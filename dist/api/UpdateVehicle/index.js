const pool = require('../db.js');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { id, lessor_id, make, model, year, license_plate, daily_rate, availability_status } = req.body;

    if (!id || !lessor_id) {
      context.res.status = 400;
      context.res.body = { error: "Missing required fields" };
      return context.res;
    }

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM fri_vehicles WHERE id = $1 AND lessor_id = $2',
      [id, lessor_id]
    );

    if (ownerCheck.rows.length === 0) {
      context.res.status = 403;
      context.res.body = { error: "Unauthorized" };
      return context.res;
    }

    const updates = [];
    const params = [id]; // $1 is always the vehicle id
    let paramCount = 2;

    if (make !== undefined) {
      updates.push(`make = $${paramCount}`);
      params.push(make);
      paramCount++;
    }
    if (model !== undefined) {
      updates.push(`model = $${paramCount}`);
      params.push(model);
      paramCount++;
    }
    if (year !== undefined) {
      updates.push(`year = $${paramCount}`);
      params.push(year);
      paramCount++;
    }
    if (license_plate !== undefined) {
      updates.push(`license_plate = $${paramCount}`);
      params.push(license_plate);
      paramCount++;
    }
    if (daily_rate !== undefined) {
      updates.push(`daily_rate = $${paramCount}`);
      params.push(daily_rate);
      paramCount++;
    }
    if (availability_status !== undefined) {
      updates.push(`availability_status = $${paramCount}`);
      params.push(availability_status);
      paramCount++;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    if (updates.length === 1) {
      context.res.status = 400;
      context.res.body = { error: "No fields to update" };
      return context.res;
    }

    await pool.query(
      `UPDATE fri_vehicles SET ${updates.join(', ')} WHERE id = $1`,
      params
    );

    context.res.status = 200;
    context.res.body = { message: "Vehicle updated successfully" };

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
