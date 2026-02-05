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
    const lessorId = req.query.lessor_id;

    if (!lessorId) {
      context.res.status = 400;
      context.res.body = { error: "lessor_id required" };
      return context.res;
    }

    let pool = await sql.connect(config);

    const result = await pool.request()
      .input('lessorId', sql.UniqueIdentifier, lessorId)
      .query(`
        SELECT 
          id, 
          make, 
          model, 
          year, 
          license_plate, 
          daily_rate, 
          status, 
          odometer,
          insurance_expiry,
          registration_expiry,
          image_url
        FROM fri_vehicles 
        WHERE lessor_id = @lessorId AND is_active = 1
        ORDER BY created_at DESC
      `);

    await pool.close();

    context.res.status = 200;
    context.res.body = result.recordset || [];

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
