const pool = require("./db");
const { getSessionUserId } = require("./session");

async function getLessorIdFromSession(userId) {
  if (!userId) return null;

  // First, check if this user is the owner (id = lessor_id)
  const ownerCheck = await pool.query('SELECT id FROM fri_lessors WHERE id = $1', [userId]);
  if (ownerCheck.rows.length > 0) {
    return userId; // User is the lessor/owner
  }

  // Otherwise, check if user is a team member
  try {
    const teamResult = await pool.query(
      `SELECT lessor_id FROM fri_lessor_team_members 
       WHERE email = (SELECT email FROM fri_users WHERE id::text = $1 LIMIT 1) 
       AND status = 'active' LIMIT 1`,
      [userId]
    );
    if (teamResult.rows.length > 0) {
      return teamResult.rows[0].lessor_id;
    }
  } catch (err) {
    console.warn('Failed to resolve lessor from team members:', err.message);
  }

  // Fallback: user_id is lessor_id
  return userId;
}

async function withLessorClient(req, handler) {
  const client = await pool.connect();
  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      const error = new Error("Not authenticated");
      error.statusCode = 401;
      throw error;
    }

    const lessorId = await getLessorIdFromSession(userId);

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
  getLessorIdFromSession,
};
