const pool = require("../db");
const crypto = require("crypto");
const bcrypt = require("bcrypt");

// Test users (always available)
const testUsers = {
  "martin@lejio.dk": { id: "test-martin", email: "martin@lejio.dk", full_name: "Martin Jensen", lessor_id: "test-martin", user_type: "professionel", role: "owner" },
  "test@example.com": { id: "test-user", email: "test@example.com", full_name: "Test User", lessor_id: "test-user", user_type: "professionel", role: "owner" },
};

// Generate secure random session ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

// Legacy SHA-256 hash for migration compatibility
function legacyHashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function setCookie(sessionId, isSecure) {
  const maxAge = 30 * 24 * 60 * 60;
  const secure = isSecure ? '; Secure' : '';
  const sameSite = isSecure ? 'None' : 'Lax';
  return `lejio_sid=${sessionId}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${maxAge}${secure}`;
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

    const emailLower = email.toLowerCase();
    let userData = null;

    // Check test users first (password: "test")
    if (testUsers[emailLower] && password === "test") {
      userData = testUsers[emailLower];
    } else {
      // Check database for user
      const result = await pool.query(
        'SELECT id, email, full_name, password_hash, user_type, company_name, cvr_number FROM fri_users WHERE email = $1',
        [emailLower]
      );

      if (result.rows.length === 0) {
        context.res.status = 401;
        context.res.body = { error: "Forkert email eller adgangskode" };
        return context.res;
      }

      const user = result.rows[0];

      // Try bcrypt first, then fall back to legacy SHA-256
      let passwordValid = false;
      if (user.password_hash && user.password_hash.startsWith('$2')) {
        // bcrypt hash
        passwordValid = await bcrypt.compare(password, user.password_hash);
      } else {
        // Legacy SHA-256 hash — verify and auto-upgrade to bcrypt
        const legacyHash = legacyHashPassword(password);
        if (user.password_hash === legacyHash) {
          passwordValid = true;
          // Auto-upgrade to bcrypt
          const bcryptHash = await bcrypt.hash(password, 12);
          await pool.query('UPDATE fri_users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [bcryptHash, user.id]);
        }
      }

      if (!passwordValid) {
        context.res.status = 401;
        context.res.body = { error: "Forkert email eller adgangskode" };
        return context.res;
      }

      // Determine lessor_id and role:
      // If user is a team member, their lessor_id should be the lessor they belong to (not their own user id)
      let lessorId = user.id; // Default: user is the lessor/owner
      let role = 'owner';

      try {
        const teamResult = await pool.query(
          `SELECT lessor_id, role FROM fri_lessor_team_members WHERE email = $1 AND status = 'active' LIMIT 1`,
          [emailLower]
        );
        if (teamResult.rows.length > 0) {
          lessorId = teamResult.rows[0].lessor_id; // Use the LESSOR's id, not the user's own id
          role = teamResult.rows[0].role || 'salesperson';
        }
      } catch (e) {
        // Team table might not exist yet
      }

      userData = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        lessor_id: lessorId,
        user_type: user.user_type || 'professionel',
        company_name: user.company_name,
        cvr_number: user.cvr_number,
        role: role,
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
        role: userData.role,
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
