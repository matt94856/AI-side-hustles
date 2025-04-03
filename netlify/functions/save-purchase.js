const { createClient } = require('@supabase/supabase-js');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const token = event.headers.authorization?.split(' ')[1];
        if (!token) {
            return { statusCode: 401, body: JSON.stringify({ error: 'No authorization token' }) };
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

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            console.error('Auth error:', authError);
            return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token', details: authError }) };
        }

        const purchaseData = JSON.parse(event.body);
        
        // Check if purchase already exists
        const { data: existingPurchase, error: checkError } = await supabase
            .from('user_purchases')
            .select('*')
            .eq('user_id', user.id)
            .eq('tutorial_id', purchaseData.tutorial_id)
            .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error('Database check error:', checkError);
            return { statusCode: 500, body: JSON.stringify({ error: 'Database check error', details: checkError }) };
        }

        if (existingPurchase) {
            // Update existing purchase
            const { error: updateError } = await supabase
                .from('user_purchases')
                .update({ 
                    updated_at: new Date().toISOString(),
                    ...purchaseData
                })
                .eq('id', existingPurchase.id);

            if (updateError) {
                console.error('Update error:', updateError);
                return { statusCode: 500, body: JSON.stringify({ error: 'Update error', details: updateError }) };
            }
        } else {
            // Insert new purchase
            const { error: insertError } = await supabase
                .from('user_purchases')
                .insert([{
                    user_id: user.id,
                    created_at: new Date().toISOString(),
                    ...purchaseData
                }]);

            if (insertError) {
                console.error('Insert error:', insertError);
                return { statusCode: 500, body: JSON.stringify({ error: 'Insert error', details: insertError }) };
            }
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: JSON.stringify({ success: true })
        };
    } catch (error) {
        console.error('Server error:', error);
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Server error', details: error.message }) 
        };
    }
}; 