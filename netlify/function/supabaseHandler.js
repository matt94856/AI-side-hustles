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

    // Validate the request
    if (!action || !table) {
      return { statusCode: 400, body: "Missing required parameters" };
    }

    // Construct the Supabase URL
    const url = `${process.env.SUPABASE_URL}/rest/v1/${table}`;

    // Set up headers
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "apikey": process.env.SUPABASE_ANON_KEY
    };

    // Add Prefer header for upsert operations
    if (action === "upsert") {
      headers["Prefer"] = "resolution=merge-duplicates";
    }

    // Make the request to Supabase
    const response = await fetch(url, {
      method: action === "update" ? "PATCH" : "POST",
      headers: headers,
      body: JSON.stringify(data)
    });

    const responseData = await response.text();

    return {
      statusCode: response.status,
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
