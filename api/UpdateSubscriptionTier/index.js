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
  context.res = context.res || {};
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers?.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      context.res.status = 401;
      context.res.body = { error: 'Not authenticated' };
      return context.res;
    }

    const { subscription_tier } = req.body || {};
    if (!subscription_tier) {
      context.res.status = 400;
      context.res.body = { error: 'subscription_tier is required' };
      return context.res;
    }

    const lessorId = await resolveLessorId(userId);

    const planResult = await pool.query(
      'SELECT id FROM fri_subscription_plans WHERE id = $1 AND is_active = TRUE',
      [subscription_tier]
    );
    if (planResult.rows.length === 0) {
      context.res.status = 400;
      context.res.body = { error: 'Invalid subscription tier' };
      return context.res;
    }

    await pool.query(
      'UPDATE fri_lessors SET subscription_tier = $1, updated_at = NOW() WHERE id = $2',
      [subscription_tier, lessorId]
    );

    context.res.status = 200;
    context.res.body = { success: true, subscription_tier };
    return context.res;
  } catch (err) {
    console.error('UpdateSubscriptionTier error:', err.message);
    context.res.status = 500;
    context.res.body = { error: err.message || 'Failed to update plan' };
    return context.res;
  }
};
