// Azure Function: GetVehicles
// Copy this code into the Function App portal editor

const { ConnectionPool } = require('mssql');

module.exports = async function (context, req) {
  context.log('GetVehicles function triggered');

  const config = {
    user: 'adminuser',
    password: 'Abc123!@#$Pass', // From Step 2
    server: 'lejio-fri-db.database.windows.net',
    database: 'lejio_fri',
    authentication: {
      type: 'default',
    },
    options: {
      encrypt: true,
      trustServerCertificate: false,
      connectionTimeout: 15000,
    },
  };

  try {
    const pool = new ConnectionPool(config);
    await pool.connect();

    // Get lessor_id from request
    const { lessor_id } = req.body;

    if (!lessor_id) {
      return (context.res = {
        status: 400,
        body: { error: 'lessor_id required' },
      });
    }

    // Query vehicles for this lessor
    const result = await pool
      .request()
      .input('lessor_id', lessor_id)
      .query('SELECT * FROM fri_vehicles WHERE lessor_id = @lessor_id');

    await pool.close();

    context.res = {
      status: 200,
      body: result.recordset,
    };
  } catch (error) {
    context.log('Error:', error.message);
    context.res = {
      status: 500,
      body: { error: error.message },
    };
  }
};
