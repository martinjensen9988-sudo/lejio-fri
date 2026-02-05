// Mock test users for development
const testUsers = {
  "martin@lejio.dk": { id: 1, email: "martin@lejio.dk", company_name: "Lejio Test" },
  "test@example.com": { id: 2, email: "test@example.com", company_name: "Test Company" },
};

function generateToken(userId, email) {
  return Buffer.from(JSON.stringify({
    lessor_id: userId,
    email,
    iat: Date.now()
  })).toString("base64");
}

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { email, password } = (req.body || {});

    if (!email) {
      context.res.status = 400;
      context.res.body = { error: "Email required" };
      return context.res;
    }

    // Check test users first (always available)
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
            company_name: user.company_name,
          },
        },
      };
      return context.res;
    }

    // Reject invalid test user password
    if (testUsers[email]) {
      context.res.status = 401;
      context.res.body = { error: "Invalid password" };
      return context.res;
    }

    // For other emails, reject (database not available in development)
    context.res.status = 401;
    context.res.body = { error: "User not found" };
    return context.res;
  } catch (err) {
    context.res.status = 500;
    context.res.body = { error: err.message };
    return context.res;
  }
};
