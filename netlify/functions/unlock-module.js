const fetch = require("node-fetch");

exports.handler = async (event) => {
  let userId, tutorialId, moduleId;

  try {
    const body = JSON.parse(event.body);
    userId = body.userId;
    tutorialId = body.tutorialId;
    moduleId = body.moduleId;
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid input format" })
    };
  }

  if (!userId || tutorialId == null || moduleId == null) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing required fields" })
    };
  }

  const userApiUrl = `https://api.netlify.com/api/v1/users/${userId}`;

  try {
    const getUserRes = await fetch(userApiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.NETLIFY_API_TOKEN}`
      }
    });
    const user = await getUserRes.json();
    const existingUnlocked = user.user_metadata?.unlockedModules || [];

    const updatedModules = [...existingUnlocked, { tutorialId, moduleId }];
    const response = await fetch(userApiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.NETLIFY_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_metadata: {
          ...user.user_metadata,
          unlockedModules: updatedModules
        }
      }),
    });

    const updatedUser = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, user: updatedUser })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
