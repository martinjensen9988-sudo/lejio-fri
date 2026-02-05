const pool = require('../db.js');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const lessorId = req.query.lessor_id;
    const status = req.query.status;

    if (!lessorId) {
      context.res.status = 400;
      context.res.body = { error: "lessor_id required" };
      return context.res;
    }

    let query = `
      SELECT 
        b.id, 
        b.vehicle_id, 
        b.customer_name, 
        b.start_date, 
        b.end_date, 
        b.total_price, 
        b.status,
        v.make,
        v.model,
        b.email as customer_email
      FROM fri_bookings b
      JOIN fri_vehicles v ON b.vehicle_id = v.id
      WHERE b.lessor_id = $1
    `;

    const params = [lessorId];

    if (status) {
      query += ' AND b.status = $2';
      params.push(status);
    }

    query += ' ORDER BY b.start_date DESC';

    const result = await pool.query(query, params);

    context.res.status = 200;
    context.res.body = result.rows || [];

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
