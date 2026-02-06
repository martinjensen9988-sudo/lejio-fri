const pool = require("../db");
const crypto = require("crypto");

// Test users (always available)
const testUsers = {
  "martin@lejio.dk": { id: "test-martin", email: "martin@lejio.dk", full_name: "Martin Jensen", lessor_id: "test-martin", user_type: "professionel" },
  "test@example.com": { id: "test-user", email: "test@example.com", full_name: "Test User", lessor_id: "test-user", user_type: "professionel" },
};

// Generate secure random session ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function setCookie(sessionId, isSecure) {
  // Session valid for 30 days
  const maxAge = 30 * 24 * 60 * 60;
  const secure = isSecure ? '; Secure' : '';
  return `lejio_sid=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

module.exports = async function (context, req) {
  const isSecure = req.headers['x-forwarded-proto'] === 'https';
  
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { email, password } = (req.body || {});

    if (!email || !password) {
      context.res.status = 400;
      context.res.body = { error: "Email og adgangskode er påkrævet" };
      return context.res;
    }

    let userData = null;

    // Check test users first (password: "test")
    if (testUsers[email] && password === "test") {
      userData = testUsers[email];
    } else {
      // Check database for user
      const result = await pool.query(
        'SELECT id, email, full_name, password_hash, user_type, company_name, cvr_number FROM fri_users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        context.res.status = 401;
        context.res.body = { error: "Forkert email eller adgangskode" };
        return context.res;
      }

      const user = result.rows[0];
      const passwordHash = hashPassword(password);

      if (user.password_hash !== passwordHash) {
        context.res.status = 401;
        context.res.body = { error: "Forkert email eller adgangskode" };
        return context.res;
      }

      userData = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        lessor_id: user.id,
        user_type: user.user_type || 'professionel',
        company_name: user.company_name,
        cvr_number: user.cvr_number,
      };
    }

    // Create server-side session (GDPR compliant - no user data in cookie)
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    await pool.query(
      `INSERT INTO fri_sessions (id, user_id, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (id) DO UPDATE SET expires_at = $3`,
      [sessionId, userData.id, expiresAt, req.headers['x-forwarded-for'] || 'unknown', req.headers['user-agent'] || 'unknown']
    );

    context.res.headers["Set-Cookie"] = setCookie(sessionId, isSecure);
    context.res.status = 200;
    context.res.body = {
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        lessor_id: userData.lessor_id,
        user_type: userData.user_type,
      },
    };
    return context.res;
  } catch (err) {
    console.error("AuthLogin error:", err);
    context.res.status = 500;
    context.res.body = { error: "Der opstod en fejl" };
    return context.res;
  }
};
