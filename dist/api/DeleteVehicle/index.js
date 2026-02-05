const pool = require('../db.js');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const id = req.query.id;
    const lessor_id = req.query.lessor_id;

    if (!id || !lessor_id) {
      context.res.status = 400;
      context.res.body = { error: "id and lessor_id required" };
      return context.res;
    }

    // Using connection pool from db.js
// Verify ownership
    const ownerCheck = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('lessorId', sql.UniqueIdentifier, lessor_id)
      .query('SELECT id FROM fri_vehicles WHERE id = $1 AND lessor_id = $2');

    if (ownerCheck.recordset.length === FALSE) {
      context.res.status = 403;
      context.res.body = { error: "Unauthorized" };
      return context.res;
    }

    // Soft delete (set is_active = FALSE)
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('UPDATE fri_vehicles SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1');

    context.res.status = 200;
    context.res.body = { message: "Vehicle deleted successfully" };

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
