const pool = require('../db.js');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const lessorId = req.query.lessor_id;

    if (!lessorId) {
      context.res.status = 400;
      context.res.body = { error: "lessor_id required" };
      return context.res;
    }

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
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
