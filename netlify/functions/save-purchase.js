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

        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Invalid token' }) };
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
        return { 
            statusCode: 500, 
            body: JSON.stringify({ error: 'Server error', details: error.message }) 
        };
    }
}; 