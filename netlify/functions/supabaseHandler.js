const { createClient } = require('@supabase/supabase-js');

// Supabase service client
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

    if (!user || !user.id || !user.token) {
      console.error('Missing user data:', user);
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

    console.log('📦 Request:', { action, table, userId: user.id });

    let result;

    switch (action) {
      case 'getPurchases':
        result = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id)
          .eq('status', 'completed');
        break;

      case 'upsertPurchase':
        if (!data || !data.user_id) {
          console.error('Missing user_id in purchase data:', data);
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Missing user_id in purchase data' })
          };
        }

        console.log('🧾 Upserting purchase:', data);

        // Prepare data according to the database schema
        const insertData = {
          user_id: data.user_id,
          tutorial_id: data.tutorial_id,
          all_access: data.all_access || false,
          status: data.status || 'completed',
          amount: data.amount,
          currency: data.currency || 'USD',
          payment_provider: data.payment_provider || 'paypal',
          payment_id: data.payment_id,
          sync_status: data.sync_status || 'synced',
          created_at: data.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        console.log('📝 Insert data:', insertData);

        // First check if purchase already exists
        const existingPurchase = await supabase
          .from(table)
          .select('*')
          .eq('user_id', data.user_id)
          .eq('tutorial_id', data.tutorial_id)
          .eq('all_access', data.all_access)
          .single();

        if (existingPurchase.data) {
          console.log('🔄 Purchase exists, updating...');
          result = await supabase
            .from(table)
            .update({
              status: data.status,
              amount: data.amount,
              currency: data.currency,
              payment_provider: data.payment_provider,
              payment_id: data.payment_id,
              sync_status: data.sync_status,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPurchase.data.id);
        } else {
          console.log('🆕 Creating new purchase...');
          result = await supabase
            .from(table)
            .insert(insertData);
        }

        if (result.error) {
          console.error('❌ Supabase upsert error:', result.error);
          throw result.error;
        }

        console.log('✅ Purchase saved:', result.data);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: result.data
          })
        };

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
          .eq('status', 'completed')
          .single();
        break;

      case 'getAllAccess':
        result = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id)
          .eq('all_access', true)
          .eq('status', 'completed')
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
      console.error('❌ Supabase operation error:', result.error);
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
    console.error('💥 Server error:', error);
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
