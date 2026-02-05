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
    const id = req.query.id;
    const lessor_id = req.query.lessor_id;

    if (!id || !lessor_id) {
      context.res.status = 400;
      context.res.body = { error: "id and lessor_id required" };
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

    // Soft delete (set is_active = 0)
    await pool.request()
      .input('id', sql.UniqueIdentifier, id)
      .query('UPDATE fri_vehicles SET is_active = 0, updated_at = GETUTCDATE() WHERE id = @id');

    await pool.close();

    context.res.status = 200;
    context.res.body = { message: "Vehicle deleted successfully" };

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
