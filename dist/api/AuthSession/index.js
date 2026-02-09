const pool = require("../db");

// Test users (always available)
const testUsers = {
  "test-martin": { id: "test-martin", email: "martin@lejio.dk", full_name: "Martin Jensen", lessor_id: "test-martin", user_type: "professionel", role: "owner" },
  "test-user": { id: "test-user", email: "test@example.com", full_name: "Test User", lessor_id: "test-user", user_type: "professionel", role: "owner" },
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
    // Get session ID from cookie (GDPR compliant - only session ID, no user data)
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies.lejio_sid;

    if (!sessionId) {
      context.res.status = 200;
      context.res.body = { user: null };
      return context.res;
    }

    // Look up session in database
    const sessionResult = await pool.query(
      'SELECT user_id, expires_at FROM fri_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      context.res.status = 200;
      context.res.body = { user: null };
      return context.res;
    }

    const session = sessionResult.rows[0];
    
    // Check if session has expired
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await pool.query('DELETE FROM fri_sessions WHERE id = $1', [sessionId]);
      context.res.status = 200;
      context.res.body = { user: null };
      return context.res;
    }

    const userId = session.user_id;

    // Check test users first
    if (testUsers[userId]) {
      const user = testUsers[userId];
      context.res.status = 200;
      context.res.body = { user };
      return context.res;
    }

    // Get user from database
    const userResult = await pool.query(
      'SELECT id, email, full_name, user_type, company_name, cvr_number FROM fri_users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      // User no longer exists - clean up session
      await pool.query('DELETE FROM fri_sessions WHERE id = $1', [sessionId]);
      context.res.status = 200;
      context.res.body = { user: null };
      return context.res;
    }

    const user = userResult.rows[0];

    // Determine role and lessor_id:
    // If user is a team member, their lessor_id should be the lessor they belong to
    let role = 'owner';
    let lessorId = user.id; // Default: user is the lessor/owner
    try {
      const teamResult = await pool.query(
        `SELECT lessor_id, role FROM fri_lessor_team_members WHERE email = $1 AND status = 'active' LIMIT 1`,
        [user.email]
      );
      if (teamResult.rows.length > 0) {
        lessorId = teamResult.rows[0].lessor_id; // Use the LESSOR's id, not the user's own id
        role = teamResult.rows[0].role || 'salesperson';
      }
    } catch (e) {
      // Team member table might not exist yet, default to owner
    }

    context.res.status = 200;
    context.res.body = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        lessor_id: lessorId,
        user_type: user.user_type || 'professionel',
        role: role,
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
