const pool = require("./db");
const { getSessionUserId } = require("./session");

async function withLessorClient(req, handler) {
  const client = await pool.connect();
  try {
    const lessorId = await getSessionUserId(req);
    if (!lessorId) {
      const error = new Error("Not authenticated");
      error.statusCode = 401;
      throw error;
    }

    await client.query("BEGIN");
    await client.query("SET LOCAL app.lessor_id = $1", [lessorId]);

    const result = await handler(client, lessorId);

    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("RLS rollback error:", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  withLessorClient,
};
