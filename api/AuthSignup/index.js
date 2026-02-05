const pool = require('../db');
const crypto = require('crypto');

// Generate secure random session ID
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function setCookie(sessionId, isSecure) {
  const maxAge = 30 * 24 * 60 * 60;
  const secure = isSecure ? '; Secure' : '';
  return `lejio_sid=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
}

module.exports = async function (context, req) {
  const isSecure = req.headers['x-forwarded-proto'] === 'https';
  
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  const { email, password, fullName, userType, cvrNumber, companyName } = req.body || {};

  if (!email || !password) {
    context.res.status = 400;
    context.res.body = { error: "Email og adgangskode er påkrævet" };
    return context.res;
  }

  // Validate email format
  if (!email.includes('@')) {
    context.res.status = 400;
    context.res.body = { error: "Ugyldig email format" };
    return context.res;
  }

  // Validate password length
  if (password.length < 6) {
    context.res.status = 400;
    context.res.body = { error: "Adgangskode skal være mindst 6 tegn" };
    return context.res;
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM fri_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      context.res.status = 400;
      context.res.body = { error: "Email er allerede registreret" };
      return context.res;
    }

    // Create new user
    const passwordHash = hashPassword(password);
    const result = await pool.query(
      `INSERT INTO fri_users (email, password_hash, full_name, user_type, company_name, cvr_number, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, email, full_name, user_type, company_name, cvr_number`,
      [email.toLowerCase(), passwordHash, fullName || '', userType || 'professionel', companyName || null, cvrNumber || null]
    );

    const user = result.rows[0];

    // Create server-side session (GDPR compliant)
    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    await pool.query(
      `INSERT INTO fri_sessions (id, user_id, expires_at, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, user.id, expiresAt, req.headers['x-forwarded-for'] || 'unknown', req.headers['user-agent'] || 'unknown']
    );

    context.res.headers["Set-Cookie"] = setCookie(sessionId, isSecure);
    context.res.status = 201;
    context.res.body = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        lessor_id: user.id,
        user_type: user.user_type,
      },
    };
    return context.res;
  } catch (err) {
    console.error('Signup error:', err);
    context.res.status = 500;
    context.res.body = { error: "Der opstod en fejl" };
    return context.res;
  }
};
