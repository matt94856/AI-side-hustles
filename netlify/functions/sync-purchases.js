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
                body: JSON.stringify({ error: 'No authorization token' })
            };
        }

        // Initialize Supabase client with service role key and pooling config
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                },
                db: {
                    schema: 'public'
                },
                global: {
                    headers: { 'x-my-custom-header': 'my-app-name' }
                }
            }
        );

        // Verify the token and get user
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            console.error('Auth error:', authError);
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid token', details: authError })
            };
        }

        // Get user's purchases
        const { data: purchases, error: dbError } = await supabase
            .from('user_purchases')
            .select('*')
            .eq('user_id', user.id);

        if (dbError) {
            console.error('Database error:', dbError);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Database error', details: dbError })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: JSON.stringify({ purchases })
        };

    } catch (error) {
        console.error('Server error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Server error', details: error.message })
        };
    }
}; 