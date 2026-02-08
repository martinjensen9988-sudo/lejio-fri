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
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      context.res.status = 401;
      context.res.body = { error: 'Not authenticated' };
      return context.res;
    }

    const lessorId = await resolveLessorId(userId);
    const [vehiclesResult, bookingsResult, revenueResult, outstandingResult] = await Promise.all([
      pool.query(
        "SELECT COUNT(*)::int as count FROM fri_vehicles WHERE lessor_id = $1 AND is_active = TRUE",
        [lessorId]
      ),
      pool.query(
        "SELECT COUNT(*)::int as count FROM fri_bookings WHERE lessor_id = $1 AND date_trunc('month', created_at) = date_trunc('month', NOW())",
        [lessorId]
      ),
      pool.query(
        "SELECT COALESCE(SUM(total_amount), 0) as total FROM fri_invoices WHERE lessor_id = $1 AND status = 'paid' AND date_trunc('month', created_at) = date_trunc('month', NOW())",
        [lessorId]
      ),
      pool.query(
        "SELECT COALESCE(SUM(total_amount), 0) as total FROM fri_invoices WHERE lessor_id = $1 AND status IN ('sent', 'overdue')",
        [lessorId]
      ),
    ]);

    context.res.status = 200;
    context.res.body = {
      activeVehicles: vehiclesResult.rows[0]?.count || 0,
      bookingsThisMonth: bookingsResult.rows[0]?.count || 0,
      revenueThisMonth: revenueResult.rows[0]?.total || 0,
      outstandingInvoices: outstandingResult.rows[0]?.total || 0,
    };

    return context.res;
  } catch (error) {
    context.res.status = error.statusCode || 500;
    context.res.body = { error: error.message || 'Failed to load stats' };
    return context.res;
  }
};
