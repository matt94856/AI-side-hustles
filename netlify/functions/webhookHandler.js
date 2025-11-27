const { createClient } = require('@supabase/supabase-js');

// Supabase service client for webhook operations
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
    const { action, data, webhookSecret } = body;

    // Verify webhook secret for security
    if (!webhookSecret || webhookSecret !== process.env.WEBHOOK_SECRET) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized webhook' })
      };
    }

    let result;

    if (action === 'verifyPayPalPayment') {
      // Verify PayPal payment and create purchase record
      const { userId, tutorialId, allAccess, amount, currency, paymentId, transactionDetails } = data;

      // Ensure user exists
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: data.email || 'unknown@example.com'
        });

      if (userError) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({ error: 'User creation failed' })
        };
      }

      // Create purchase record
      const purchaseData = {
        user_id: userId,
        tutorial_id: tutorialId,
        all_access: allAccess || false,
        amount: amount,
        currency: currency || 'USD',
        payment_provider: 'paypal',
        payment_id: paymentId,
        transaction_details: transactionDetails
      };

      result = await supabase
        .from('purchases')
        .upsert(purchaseData, { 
          onConflict: 'user_id,tutorial_id,all_access',
          ignoreDuplicates: false 
        });

    } else if (action === 'cleanupExpiredSessions') {
      // Internal cleanup operation
      result = await supabase
        .from('sessions')
        .delete()
        .lt('expires_at', new Date().toISOString());

    } else if (action === 'generateAnalytics') {
      // Internal analytics generation
      const { data: purchaseStats } = await supabase
        .from('purchases')
        .select('tutorial_id, all_access, amount, created_at');

      result = { 
        data: {
          totalPurchases: purchaseStats?.length || 0,
          revenue: purchaseStats?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
          courseBreakdown: purchaseStats?.reduce((acc, p) => {
            const key = p.all_access ? 'bundle' : `course_${p.tutorial_id}`;
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {}) || {}
        }
      };

    } else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid webhook action' })
      };
    }

    if (result && result.error) {
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
    console.error('Webhook handler error:', error);

    try {
      if (process.env.SENTRY_DSN) {
        const Sentry = require('@sentry/node');
        if (!Sentry.getCurrentHub().getClient()) {
          Sentry.init({ dsn: process.env.SENTRY_DSN });
        }
        Sentry.captureException(error);
      }
    } catch (sentryError) {
      console.error('Error reporting webhook error to Sentry:', sentryError);
    }

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
