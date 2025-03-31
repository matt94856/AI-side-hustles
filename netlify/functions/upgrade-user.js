const fetch = require("node-fetch");

exports.handler = async (event) => {
  console.log("Received event:", event);

  let userId;
  try {
    userId = JSON.parse(event.body).userId;
  } catch (err) {
    console.error("Invalid JSON:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid JSON in request" })
    };
  }

  if (!userId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing userId" })
    };
  }

  try {
    const response = await fetch(`https://api.netlify.com/api/v1/users/${userId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.NETLIFY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_metadata: {
          accessLevel: "premium",
        }
      }),
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, user: data })
    };
  } catch (error) {
    console.error("Error upgrading user:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
