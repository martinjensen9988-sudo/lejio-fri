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

    const result = await pool.query(`
      SELECT 
        id, 
        make, 
        model, 
        year, 
        license_plate, 
        daily_rate, 
        availability_status as status, 
        last_mileage as odometer,
        created_at,
        updated_at
      FROM fri_vehicles 
      WHERE lessor_id = $1 AND is_active = TRUE
      ORDER BY created_at DESC
    `, [lessorId]);

    context.res.status = 200;
    context.res.body = result.rows || [];

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
