const sql = require('mssql');
const { v4: uuidv4 } = require('uuid');

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
    const { lessor_id, make, model, year, license_plate, daily_rate, fuel_type, transmission } = req.body;

    if (!lessor_id || !make || !model || !year || !license_plate || !daily_rate) {
      context.res.status = 400;
      context.res.body = { error: "Missing required fields" };
      return context.res;
    }

    const vehicleId = uuidv4();

    let pool = await sql.connect(config);

    await pool.request()
      .input('id', sql.UniqueIdentifier, vehicleId)
      .input('lessorId', sql.UniqueIdentifier, lessor_id)
      .input('make', sql.NVarChar(100), make)
      .input('model', sql.NVarChar(100), model)
      .input('year', sql.Int, year)
      .input('licensePlate', sql.NVarChar(50), license_plate)
      .input('dailyRate', sql.Decimal(10, 2), daily_rate)
      .input('fuelType', sql.NVarChar(50), fuel_type || null)
      .input('transmission', sql.NVarChar(50), transmission || null)
      .query(`
        INSERT INTO fri_vehicles 
        (id, lessor_id, make, model, year, license_plate, daily_rate, fuel_type, transmission, status, is_active)
        VALUES 
        (@id, @lessorId, @make, @model, @year, @licensePlate, @dailyRate, @fuelType, @transmission, 'available', 1)
      `);

    await pool.close();

    context.res.status = 201;
    context.res.body = { id: vehicleId, message: "Vehicle created successfully" };

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
