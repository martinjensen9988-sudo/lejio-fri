const pool = require('../db');
const { getSessionUserId } = require('../session');

async function resolveLessorId(userId) {
  let lessorId = userId;
  try {
    const userResult = await pool.query('SELECT email FROM fri_users WHERE id::text = $1', [userId]);
    if (userResult.rows.length > 0) {
      const teamResult = await pool.query(
        `SELECT lessor_id FROM fri_lessor_team_members WHERE email = $1 AND status = 'active' LIMIT 1`,
        [userResult.rows[0].email]
      );
      if (teamResult.rows.length > 0) {
        lessorId = teamResult.rows[0].lessor_id;
      }
    }
  } catch (err) {
    console.warn('Resolve lessor id failed:', err.message);
  }
  return lessorId;
}

module.exports = async function (context, req) {
  const userId = await getSessionUserId(req);
  if (!userId) {
    return {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Credentials": "true"
      },
      body: { error: 'Not authenticated' }
    };
  }

  const lessorId = await resolveLessorId(userId);
  const now = new Date().toISOString();

  try {
    const result = await pool.query('SELECT selected_modules FROM fri_lessors WHERE id = $1', [lessorId]);
    const selectedModules = result.rows[0]?.selected_modules;
    const moduleIds = Array.isArray(selectedModules)
      ? selectedModules
      : typeof selectedModules === 'string'
        ? JSON.parse(selectedModules)
        : [];

    const modules = moduleIds.map((moduleId) => ({
      id: `mod-${lessorId}-${moduleId}`,
      lessor_id: lessorId,
      module_id: moduleId,
      status: 'active',
      activated_at: now,
      created_at: now,
      updated_at: now
    }));

    return {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Credentials": "true"
      },
      body: { modules }
    };
  } catch (err) {
    console.error('GetModules error:', err.message);
    return {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Credentials": "true"
      },
      body: { error: 'Failed to load modules' }
    };
  }
};
