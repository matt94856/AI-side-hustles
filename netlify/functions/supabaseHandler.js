const { createClient } = require('@supabase/supabase-js');

// Supabase service client
const supabase = createClient(
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
    const { user, action, data } = body;

    if (!user || !user.id || !user.email) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Missing user authentication data' })
      };
    }

    let result;

    if (action === 'getPurchases') {
      result = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id);
    } else if (action === 'addPurchase') {
      // Ensure user exists in users table
      const userUpsert = await supabase.from('users').upsert({
        id: user.id,
        email: user.email
      });
      if (userUpsert.error) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: userUpsert.error.message })
        };
      }
      // Insert purchase
      result = await supabase
        .from('purchases')
        .upsert({
          user_id: user.id,
          tutorial_id: data.tutorial_id,
          all_access: data.all_access || false
        }, { onConflict: 'user_id,tutorial_id,all_access' });
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
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
