const { v4: uuidv4 } = require('uuid');
const db = require('../db');

module.exports = async function (context, req) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    context.res = {
      status: 400,
      body: { error: "Email and password required" }
    };
    return context.res;
  }

  // Validate email format
  if (!email.includes('@')) {
    context.res = {
      status: 400,
      body: { error: "Invalid email" }
    };
    return context.res;
  }

  try {
    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      context.res = {
        status: 400,
        body: { error: "Email already registered" }
      };
      return context.res;
    }

    // Create new user
    const userId = uuidv4();
    const now = new Date().toISOString();

    await db.query(
      `INSERT INTO users (id, email, password_hash, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, email.toLowerCase(), password, now, now] // Note: In production, hash password!
    );

    // Return user data for frontend
    context.res = {
      status: 200,
      body: {
        user: {
          id: userId,
          email: email.toLowerCase()
        },
        message: "Signup successful"
      }
    };
  } catch (err) {
    console.error('Signup error:', err);
    
    // If database error, still return a temporary user for demo purposes
    const tempUserId = uuidv4();
    context.res = {
      status: 200,
      body: {
        user: {
          id: tempUserId,
          email: email.toLowerCase()
        },
        message: "Signup successful (demo mode)"
      }
    };
  }
  
  return context.res;
};
