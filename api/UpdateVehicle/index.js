const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    }
  },
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { id, lessor_id, make, model, year, license_plate, daily_rate, fuel_type, transmission, status } = req.body;

    if (!id || !lessor_id) {
      context.res.status = 400;
      context.res.body = { error: "Missing required fields" };
      return context.res;
    }

    let pool = await sql.connect(config);

    // Verify ownership
    const ownerCheck = await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .input('lessorId', sql.UniqueIdentifier, lessor_id)
      .query('SELECT id FROM fri_vehicles WHERE id = @id AND lessor_id = @lessorId');

    if (ownerCheck.recordset.length === 0) {
      await pool.close();
      context.res.status = 403;
      context.res.body = { error: "Unauthorized" };
      return context.res;
    }

    const updates = [];
    const request = pool.request()
      .input('id', sql.UniqueIdentifier, id);

    if (make !== undefined) {
      updates.push('make = @make');
      request.input('make', sql.NVarChar(100), make);
    }
    if (model !== undefined) {
      updates.push('model = @model');
      request.input('model', sql.NVarChar(100), model);
    }
    if (year !== undefined) {
      updates.push('year = @year');
      request.input('year', sql.Int, year);
    }
    if (license_plate !== undefined) {
      updates.push('license_plate = @licensePlate');
      request.input('licensePlate', sql.NVarChar(50), license_plate);
    }
    if (daily_rate !== undefined) {
      updates.push('daily_rate = @dailyRate');
      request.input('dailyRate', sql.Decimal(10, 2), daily_rate);
    }
    if (fuel_type !== undefined) {
      updates.push('fuel_type = @fuelType');
      request.input('fuelType', sql.NVarChar(50), fuel_type);
    }
    if (transmission !== undefined) {
      updates.push('transmission = @transmission');
      request.input('transmission', sql.NVarChar(50), transmission);
    }
    if (status !== undefined) {
      updates.push('status = @status');
      request.input('status', sql.NVarChar(50), status);
    }

    updates.push('updated_at = GETUTCDATE()');

    if (updates.length === 1) {
      await pool.close();
      context.res.status = 400;
      context.res.body = { error: "No fields to update" };
      return context.res;
    }

    await request.query(`UPDATE fri_vehicles SET ${updates.join(', ')} WHERE id = @id`);

    await pool.close();

    context.res.status = 200;
    context.res.body = { message: "Vehicle updated successfully" };

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
