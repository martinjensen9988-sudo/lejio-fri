const pool = require("../db");
const crypto = require("crypto");

// Test users (always available)
const testUsers = {
  "martin@lejio.dk": { id: "test-martin", email: "martin@lejio.dk", full_name: "Martin Jensen", lessor_id: "test-martin" },
  "test@example.com": { id: "test-user", email: "test@example.com", full_name: "Test User", lessor_id: "test-user" },
};

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

  try {
    const { email, password } = (req.body || {});

    if (!email || !password) {
      context.res.status = 400;
      context.res.body = { error: "Email and password required" };
      return context.res;
    }

    // Check test users first (password: "test")
    if (testUsers[email] && password === "test") {
      const user = testUsers[email];
      const token = generateToken(user.id, user.email);
      context.res.status = 200;
      context.res.body = {
        session: {
          access_token: token,
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            lessor_id: user.lessor_id,
          },
        },
      };
      return context.res;
    }

    // Check database for user
    const result = await pool.query(
      'SELECT id, email, full_name, password_hash FROM fri_users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      context.res.status = 401;
      context.res.body = { error: "Invalid email or password" };
      return context.res;
    }

    const user = result.rows[0];
    const passwordHash = hashPassword(password);

    if (user.password_hash !== passwordHash) {
      context.res.status = 401;
      context.res.body = { error: "Invalid email or password" };
      return context.res;
    }

    const token = generateToken(user.id, user.email);
    context.res.status = 200;
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
    console.error("AuthLogin error:", err);
    context.res.status = 500;
    context.res.body = { error: err.message };
    return context.res;
  }
};
