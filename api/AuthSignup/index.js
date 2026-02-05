const pool = require('../db');
const crypto = require('crypto');

function generateToken(userId, email) {
  return Buffer.from(JSON.stringify({
    user_id: userId,
    lessor_id: userId,
    email,
    iat: Date.now()
  })).toString("base64");
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function setCookie(token) {
  const maxAge = 30 * 24 * 60 * 60;
  return `lejio_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

module.exports = async function (context, req) {
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
    const token = generateToken(user.id, user.email);

    context.res.headers["Set-Cookie"] = setCookie(token);
    context.res.status = 201;
    context.res.body = {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        lessor_id: user.id,
        user_type: user.user_type,
        company_name: user.company_name,
        cvr_number: user.cvr_number,
      },
    };
    return context.res;
  } catch (err) {
    console.error('Signup error:', err);
    context.res.status = 500;
    context.res.body = { error: err.message };
    return context.res;
  }
};
