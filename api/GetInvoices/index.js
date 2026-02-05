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
    const status = req.query.status;

    if (!lessorId) {
      context.res.status = 400;
      context.res.body = { error: "lessor_id required" };
      return context.res;
    }

    let pool = await sql.connect(config);

    let query = `
      SELECT 
        i.id, 
        i.invoice_number, 
        i.invoice_date, 
        i.due_date, 
        i.total_amount, 
        i.net_amount, 
        i.status,
        c.full_name as customer_name,
        c.email as customer_email
      FROM fri_invoices i
      JOIN fri_customers c ON i.customer_id = c.id
      WHERE i.lessor_id = @lessorId
    `;

    const request = pool.request().input('lessorId', sql.UniqueIdentifier, lessorId);

    if (status) {
      query += ' AND i.status = @status';
      request.input('status', sql.NVarChar(50), status);
    }

    query += ' ORDER BY i.invoice_date DESC';

    const result = await request.query(query);

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
