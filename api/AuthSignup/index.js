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

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  const { email, password, full_name } = req.body || {};

  if (!email || !password) {
    context.res.status = 400;
    context.res.body = { error: "Email and password required" };
    return context.res;
  }

  // Validate email format
  if (!email.includes('@')) {
    context.res.status = 400;
    context.res.body = { error: "Invalid email format" };
    return context.res;
  }

  // Validate password length
  if (password.length < 6) {
    context.res.status = 400;
    context.res.body = { error: "Password must be at least 6 characters" };
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
      context.res.body = { error: "Email already registered" };
      return context.res;
    }

    // Create new user
    const passwordHash = hashPassword(password);
    const result = await pool.query(
      `INSERT INTO fri_users (email, password_hash, full_name, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING id, email, full_name`,
      [email.toLowerCase(), passwordHash, full_name || '']
    );

    const user = result.rows[0];
    const token = generateToken(user.id, user.email);

    context.res.status = 201;
    context.res.body = {
      session: {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          lessor_id: user.id,
        },
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
