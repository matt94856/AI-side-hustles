const { createClient } = require('@supabase/supabase-js');

// Supabase anon client for user operations (respects RLS)
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Supabase service client for internal operations only
const supabaseService = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { user, action, data, accessToken } = body;

    // For internal operations, we don't need user authentication
    if (action !== 'webhook' && action !== 'internal' && !user && !accessToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing user authentication data' })
      };
    }

    let result;
    let supabaseClient;

    // Determine which client to use based on operation type
    if (action === 'webhook' || action === 'internal') {
      // Use service role for webhooks and internal operations
      supabaseClient = supabaseService;
      
      // Handle internal user creation/sync
      if (action === 'internal' && user && user.id) {
        // Check if user exists
        const { data: existingUser, error: userError } = await supabaseService
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'User lookup failed' })
          };
        }

        if (!existingUser) {
          // Create user in Supabase users table
          const { error: createError } = await supabaseService
            .from('users')
            .insert({
              id: user.id,
              email: user.email
            });

          if (createError) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'User creation failed' })
            };
          }
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: 'User synced successfully' })
        };
      }
    } else {
      // Use anon client for user operations (enforces RLS)
      supabaseClient = supabaseAnon;
      
      // Set the user session for RLS enforcement
      if (accessToken) {
        await supabaseClient.auth.setSession({
          access_token: accessToken,
          refresh_token: '' // Not needed for this use case
        });
      } else if (user && user.id) {
        // For Netlify Identity users, we need to create/get Supabase user first
        const { data: supabaseUser, error: userError } = await supabaseService
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single();

        if (userError && userError.code !== 'PGRST116') {
          return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'User lookup failed' })
          };
        }

        if (!supabaseUser) {
          // Create user in Supabase users table
          const { error: createError } = await supabaseService
            .from('users')
            .insert({
              id: user.id,
              email: user.email
            });

          if (createError) {
            return {
              statusCode: 500,
              headers,
              body: JSON.stringify({ error: 'User creation failed' })
            };
          }
        }
      }
    }

    // Execute the requested action
    if (action === 'getPurchases') {
      result = await supabaseClient
        .from('purchases')
        .select('*');
    } else if (action === 'addPurchase') {
      if (!user || !user.id) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'User ID required for purchase' })
        };
      }

      const purchaseData = {
        user_id: user.id,
        tutorial_id: data.tutorial_id,
        all_access: data.all_access || false
      };

      // Add optional fields if provided
      if (data.amount) purchaseData.amount = data.amount;
      if (data.currency) purchaseData.currency = data.currency;
      if (data.payment_provider) purchaseData.payment_provider = data.payment_provider;
      if (data.payment_id) purchaseData.payment_id = data.payment_id;
      if (data.transaction_details) purchaseData.transaction_details = data.transaction_details;

      result = await supabaseClient
        .from('purchases')
        .upsert(purchaseData, { 
          onConflict: 'user_id,tutorial_id,all_access',
          ignoreDuplicates: false 
        });
    } else if (action === 'checkAccess') {
      const courseId = data.course_id;
      
      // Check for all access first
      const allAccessResult = await supabaseClient
        .from('purchases')
        .select('*')
        .eq('all_access', true)
        .single();
      
      if (allAccessResult.data) {
        result = { data: [{ has_access: true, access_type: 'all_access' }] };
      } else {
        // Check for specific course access
        const courseAccessResult = await supabaseClient
          .from('purchases')
          .select('*')
          .eq('tutorial_id', courseId)
          .single();
        
        result = { 
          data: courseAccessResult.data ? 
            [{ has_access: true, access_type: 'course_access' }] : 
            [{ has_access: false, access_type: 'no_access' }]
        };
      }
    } else if (action === 'getUserProgress') {
      result = await supabaseClient
        .from('purchases')
        .select('*');
    } else if (action === 'webhook') {
      // Internal webhook operations using service role
      // This would be used for PayPal webhook verification, etc.
      result = { data: { success: true } };
    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid action' })
      };
    }

    if (result.error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: result.error.message })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, data: result.data })
    };

  } catch (error) {
    console.error('Supabase handler error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
