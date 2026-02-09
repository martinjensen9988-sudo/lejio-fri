const pool = require('../db');
const { getSessionUserId } = require('../session');

const testUsers = {
  "test-martin": { id: "test-martin", email: "martin@lejio.dk", full_name: "Martin Jensen", lessor_id: "test-martin", company_name: "Lejio Test" },
  "test-user": { id: "test-user", email: "test@example.com", full_name: "Test User", lessor_id: "test-user", company_name: "Test Company" },
};

module.exports = async function (context, req) {
  context.res = context.res || {};
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers?.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const userId = await getSessionUserId(req);
    if (!userId) {
      context.res.status = 200;
      context.res.body = { id: null, email: null, company_name: null };
      return;
    }

    // Check test users
    if (testUsers[userId]) {
      context.res.status = 200;
      context.res.body = testUsers[userId];
      return;
    }

    // Look up real user
    const result = await pool.query(
      'SELECT id, email, full_name, company_name, cvr_number FROM fri_users WHERE id::text = $1',
      [userId]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      context.res.status = 200;
      context.res.body = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        lessor_id: user.id,
        company_name: user.company_name || 'Lejio',
      };
    } else {
      context.res.status = 200;
      context.res.body = { id: null, email: null, company_name: null };
    }
  } catch (err) {
    console.error('AuthMe error:', err);
    context.res.status = 200;
    context.res.body = { id: null, email: null, company_name: null };
  }
};
