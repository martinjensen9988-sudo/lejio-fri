const pool = require('../db');

module.exports = async function (context, req) {
  context.res = context.res || {};
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers?.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    // Extract lessor ID from query or URL path
    const lessorId = req.query.id || req.params?.id;

    if (!lessorId) {
      context.res.status = 400;
      context.res.body = { error: 'Lessor ID is required' };
      return context.res;
    }

    const result = await pool.query(
      `SELECT id, email, company_name, cvr_number, custom_domain, primary_color, logo_url,
              subscription_status, created_at
       FROM fri_lessors WHERE id = $1`,
      [lessorId]
    );

    if (result.rows.length === 0) {
      context.res.status = 404;
      context.res.body = { error: 'Lessor not found' };
      return context.res;
    }

    const lessor = result.rows[0];
    context.res.status = 200;
    context.res.body = {
      id: lessor.id,
      name: lessor.company_name,
      email: lessor.email,
      primary_color: lessor.primary_color || '#3b82f6',
      logo_url: lessor.logo_url,
      description: '',
      phone: '',
    };
    return context.res;
  } catch (err) {
    console.error('GetLessor error:', err);
    context.res.status = 500;
    context.res.body = { error: 'Server error' };
    return context.res;
  }
};
