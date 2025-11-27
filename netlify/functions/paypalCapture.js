const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const res = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    throw new Error(`PayPal auth failed: ${res.status}`);
  }

  const data = await res.json();
  return data.access_token;
}

async function verifyOrder(orderId) {
  const token = await getPayPalAccessToken();

  const res = await fetch(
    `https://api-m.paypal.com/v2/checkout/orders/${orderId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    throw new Error(`PayPal order lookup failed: ${res.status}`);
  }

  const data = await res.json();
  if (data.status !== 'COMPLETED') {
    throw new Error(`Order not completed: ${data.status}`);
  }

  return data;
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const { orderId, courseId, userId, email, amount, currency } = JSON.parse(
      event.body || '{}'
    );

    if (!orderId || !courseId || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing orderId, courseId, or userId' }),
      };
    }

    const order = await verifyOrder(orderId);

    const purchaseAmount =
      amount ||
      Number(
        order.purchase_units?.[0]?.amount?.value ||
          order.purchase_units?.[0]?.amount?.gross_total ||
          0
      ) ||
      null;
    const purchaseCurrency =
      currency || order.purchase_units?.[0]?.amount?.currency_code || 'USD';
    const payerEmail = email || order.payer?.email_address || null;

    // Ensure user exists
    if (payerEmail) {
      await supabase
        .from('users')
        .upsert({ id: userId, email: payerEmail }, { onConflict: 'id' });
    }

    const { error: purchaseError } = await supabase.from('purchases').upsert(
      {
        user_id: userId,
        tutorial_id: courseId,
        all_access: false,
        amount: purchaseAmount,
        currency: purchaseCurrency,
        payment_provider: 'paypal',
        payment_id: orderId,
        transaction_details: order,
      },
      { onConflict: 'user_id,tutorial_id,all_access', ignoreDuplicates: false }
    );

    if (purchaseError) {
      throw purchaseError;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('paypalCapture error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message }),
    };
  }
};


