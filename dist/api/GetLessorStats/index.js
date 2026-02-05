const pool = require('../db.js');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const lessorId = req.query.lessor_id;

    if (!lessorId) {
      context.res.status = 400;
      context.res.body = { error: "lessor_id required" };
      return context.res;
    }

    // Using connection pool from db.js
// Get vehicle count
    const vehiclesResult = await pool.request()
      .input('lessorId', sql.UniqueIdentifier, lessorId)
      .query('SELECT COUNT(*) as count FROM fri_vehicles WHERE lessor_id = $1 AND is_active = TRUE');
    
    // Get bookings this month
    const bookingsResult = await pool.request()
      .input('lessorId', sql.UniqueIdentifier, lessorId)
      .input('startDate', sql.DateTime2, new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      .input('endDate', sql.DateTime2, new Date())
      .query('SELECT COUNT(*) as count FROM fri_bookings WHERE lessor_id = $1 AND MONTH(created_at) = MONTH($2) AND YEAR(created_at) = YEAR($2)');

    // Get revenue this month
    const revenueResult = await pool.request()
      .input('lessorId', sql.UniqueIdentifier, lessorId)
      .input('startDate', sql.DateTime2, new Date(new Date().getFullYear(), new Date().getMonth(), 1))
      .input('endDate', sql.DateTime2, new Date())
      .query('SELECT SUM(net_amount) as total FROM fri_invoices WHERE lessor_id = $1 AND status = \'paid\' AND MONTH(invoice_date) = MONTH($2) AND YEAR(invoice_date) = YEAR($2)');

    // Get outstanding invoices
    const outstandingResult = await pool.request()
      .input('lessorId', sql.UniqueIdentifier, lessorId)
      .query('SELECT SUM(net_amount) as total FROM fri_invoices WHERE lessor_id = $1 AND status IN (\'sent\', \'overdue\')');

    context.res.status = 200;
    context.res.body = {
      activeVehicles: vehiclesResult.recordset[0]?.count || 0,
      bookingsThisMonth: bookingsResult.recordset[0]?.count || 0,
      revenueThisMonth: revenueResult.recordset[0]?.total || 0,
      outstandingInvoices: outstandingResult.recordset[0]?.total || 0,
    };

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
