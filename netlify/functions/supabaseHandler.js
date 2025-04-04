const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    const { user, action, data, table } = JSON.parse(event.body);

    // Verify user authentication
    if (!user || !user.token) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    let result;
    
    switch (action) {
      case 'getPurchases':
        result = await supabase
          .from(table)
          .select('*')
          .eq('user_id', user.id);
        break;

      case 'upsertPurchase':
        result = await supabase
          .from(table)
          .upsert({
            ...data,
            user_id: user.id,
            last_synced: new Date().toISOString()
          });
        break;

      case 'verifyPurchase':
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
      body: JSON.stringify(result.data || [])
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server Error' })
    };
  }
}; 
