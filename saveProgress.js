// netlify/functions/saveProgress.js
const faunadb = require("faunadb");
const q = faunadb.query;

const client = new faunadb.Client({
  secret: process.env.FAUNADB_SERVER_SECRET
});

exports.handler = async (event, context) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed"
    };
  }

  const user = context.clientContext && context.clientContext.user;
  if (!user) {
    return {
      statusCode: 401,
      body: "Unauthorized"
    };
  }

  const { tutorialId, moduleId, completed } = JSON.parse(event.body);

  const userId = user.sub;
  const recordId = `${userId}_tutorial${tutorialId}`;

  try {
    const existing = await client.query(
      q.Get(q.Ref(q.Collection("Progress"), recordId))
    );

    const updatedModules = new Set(existing.data.completedModules || []);
    if (completed) updatedModules.add(moduleId);

    await client.query(
      q.Update(q.Ref(q.Collection("Progress"), recordId), {
        data: { completedModules: Array.from(updatedModules) }
      })
    );
  } catch (err) {
    if (err.name === "NotFound") {
      await client.query(
        q.Create(q.Ref(q.Collection("Progress"), recordId), {
          data: {
            userId,
            tutorialId,
            completedModules: completed ? [moduleId] : []
          }
        })
      );
    } else {
      return {
        statusCode: 500,
        body: `Error saving progress: ${err.message}`
      };
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
};
