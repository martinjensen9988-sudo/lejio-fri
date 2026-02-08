const pool = require('../db');
const { getSessionUserId } = require('../session');

const MODULE_DEPENDENCIES = {
  garadeal: ['garagebooks', 'garagesync', 'garagechat'],
};

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
  context.log('SetModule endpoint called');

  const { module_id, enabled } = req.body || {};
  if (!module_id || typeof enabled !== 'boolean') {
    return {
      status: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Credentials": "true"
      },
      body: { error: 'module_id and enabled are required' }
    };
  }

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
  const status = enabled ? 'active' : 'inactive';

  try {
    const result = await pool.query('SELECT selected_modules FROM fri_lessors WHERE id = $1', [lessorId]);
    const selectedModules = result.rows[0]?.selected_modules;
    const moduleIds = Array.isArray(selectedModules)
      ? selectedModules
      : typeof selectedModules === 'string'
        ? JSON.parse(selectedModules)
        : [];

    const updatedModules = new Set(moduleIds);
    if (enabled) {
      updatedModules.add(module_id);
      const dependencies = MODULE_DEPENDENCIES[module_id] || [];
      dependencies.forEach((dep) => updatedModules.add(dep));
    } else {
      updatedModules.delete(module_id);
    }

    const updatedList = Array.from(updatedModules);
    await pool.query(
      'UPDATE fri_lessors SET selected_modules = $1::jsonb, updated_at = $2 WHERE id = $3',
      [JSON.stringify(updatedList), now, lessorId]
    );

    const module = {
      id: `mod-${lessorId}-${module_id}`,
      lessor_id: lessorId,
      module_id,
      status,
      activated_at: enabled ? now : null,
      created_at: now,
      updated_at: now
    };

    return {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Credentials": "true"
      },
      body: { module, enabled_modules: updatedList }
    };
  } catch (err) {
    console.error('SetModule error:', err.message);
    return {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": req.headers.origin || "*",
        "Access-Control-Allow-Credentials": "true"
      },
      body: { error: 'Failed to update module' }
    };
  }
};
