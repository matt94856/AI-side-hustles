const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

exports.handler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    // Parse and validate request body
    let body;
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      console.error('Invalid JSON in request body:', e);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      };
    }

    const { user, action, data, table } = body;

    // Validate required fields
    if (!user || !user.id || !user.token) {
      console.error('Missing user data:', { user });
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing user authentication data' })
      };
    }

    if (!action || !table) {
      console.error('Missing required fields:', { action, table });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields: action and table' })
      };
    }

    console.log('Processing request:', { action, table, userId: user.id });

    let result;
    
    switch (action) {
      case 'getPurchases':
        result = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id);
        break;

      case 'upsertPurchase':
        if (!data || !data.tutorial_id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing tutorial_id in purchase data' })
          };
        }
        
        result = await supabase
          .from(table)
          .upsert({
            user_id: user.id,
            tutorial_id: data.tutorial_id,
            transaction_id: data.transaction_id || {},
            status: 'completed',
            all_access: data.all_access || false,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,tutorial_id',
            ignoreDuplicates: false
          });
        break;

      case 'verifyPurchase':
        if (!data || !data.tutorial_id) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing tutorial_id in verification data' })
          };
        }
        
        result = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id)
          .eq('tutorial_id', data.tutorial_id)
          .single();
        break;

      case 'getAllAccess':
        result = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id)
          .eq('all_access', true)
          .single();
        break;

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        };
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Database operation failed',
          details: result.error.message
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        data: result.data || []
      })
    };

  } catch (error) {
    console.error('Server error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Server Error',
        details: error.message
      })
    };
  }
}; 