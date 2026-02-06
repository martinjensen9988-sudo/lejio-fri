const { withLessorClient } = require('../rls');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const status = req.query.status;

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

    const params = [];

    if (status) {
      query += ' AND b.status = $2';
      params.push(status);
    }

    query += ' ORDER BY b.start_date DESC';

    const result = await withLessorClient(req, (client, lessorId) => {
      const values = [lessorId, ...params];
      return client.query(query, values);
    });

    context.res.status = 200;
    context.res.body = result.rows || [];

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
