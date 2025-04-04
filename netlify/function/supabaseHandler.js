const fetch = require("node-fetch");

exports.handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { user, action, data, table } = JSON.parse(event.body);

    // Verify user authentication
    if (!user || !user.token) {
      return { statusCode: 401, body: "Unauthorized" };
    }

    // Construct the Supabase URL and headers
    const url = `${process.env.SUPABASE_URL}/rest/v1/${table}`;
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "apikey": process.env.SUPABASE_ANON_KEY
    };

    let response;
    
    switch (action) {
      case "getPurchases":
        // Get all purchases for a user
        response = await fetch(`${url}?user_id=eq.${user.id}`, {
          method: "GET",
          headers
        });
        break;

      case "upsertPurchase":
        // Insert or update purchase
        headers["Prefer"] = "resolution=merge-duplicates";
        response = await fetch(url, {
          method: "POST",
          headers,
          body: JSON.stringify({
            ...data,
            user_id: user.id,
            last_synced: new Date().toISOString()
          })
        });
        break;

      case "verifyPurchase":
        // Verify specific purchase
        response = await fetch(
          `${url}?user_id=eq.${user.id}&tutorial_id=eq.${data.tutorial_id}`, {
          method: "GET",
          headers
        });
        break;

      case "getAllAccess":
        // Check for all-access subscription
        response = await fetch(
          `${url}?user_id=eq.${user.id}&all_access=eq.true`, {
          method: "GET",
          headers
        });
        break;

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid action" })
        };
    }

    const responseData = await response.text();
    const statusCode = response.status;

    // Add CORS headers for browser access
    const responseHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
    };

    return {
      statusCode,
      headers: responseHeaders,
      body: responseData
    };

  } catch (error) {
    console.error("Error in supabaseHandler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error",
        details: error.message
      })
    };
  }
}; 