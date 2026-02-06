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
        i.id, 
        i.invoice_number, 
        i.created_at as invoice_date, 
        i.due_date, 
        i.total_amount, 
        i.amount as net_amount, 
        i.tax_amount,
        i.status,
        i.customer_name,
        i.email as customer_email
      FROM fri_invoices i
      WHERE i.lessor_id = $1
    `;

    const params = [];

    if (status) {
      query += ' AND i.status = $2';
      params.push(status);
    }

    query += ' ORDER BY i.created_at DESC';

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
