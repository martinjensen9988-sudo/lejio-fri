const pool = require("../db");

// Test users (always available)
const testUsers = {
  "test-martin": { id: "test-martin", email: "martin@lejio.dk", full_name: "Martin Jensen", lessor_id: "test-martin", user_type: "professionel" },
  "test-user": { id: "test-user", email: "test@example.com", full_name: "Test User", lessor_id: "test-user", user_type: "professionel" },
};

function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) cookies[name] = value;
    });
  }
  return cookies;
}

module.exports = async function (context, req) {
  context.res = {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": req.headers.origin || "*",
      "Access-Control-Allow-Credentials": "true",
    }
  };

  try {
    // Get token from cookie
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies.lejio_session;

    if (!token) {
      context.res.status = 200;
      context.res.body = { user: null };
      return context.res;
    }

    // Decode token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const userId = decoded.user_id || decoded.lessor_id;

    // Check test users first
    if (testUsers[userId]) {
      const user = testUsers[userId];
      context.res.status = 200;
      context.res.body = { user };
      return context.res;
    }

    // Check database
    const result = await pool.query(
      'SELECT id, email, full_name, user_type, company_name, cvr_number FROM fri_users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      context.res.status = 200;
      context.res.body = { user: null };
      return context.res;
    }

    const user = result.rows[0];
    context.res.status = 200;
    context.res.body = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        lessor_id: user.id,
        user_type: user.user_type || 'professionel',
        company_name: user.company_name,
        cvr_number: user.cvr_number,
      }
    };
    return context.res;
  } catch (err) {
    console.error("AuthSession error:", err);
    context.res.status = 200;
    context.res.body = { user: null };
    return context.res;
  }
};
