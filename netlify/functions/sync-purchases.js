const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Get the authorization header
        const token = event.headers.authorization?.split(' ')[1];
        if (!token) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'No authorization token provided' })
            };
        }

        // Initialize Supabase client with service role key
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Verify the token and get user
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid token' })
            };
        }

        // Get user's purchases
        const { data: purchases, error: dbError } = await supabase
            .from('user_purchases')
            .select('*')
            .eq('user_id', user.id);

        if (dbError) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Database error' })
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ purchases })
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
}; 