module.exports = async function (context, req) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    context.res = {
      status: 400,
      body: { error: "Email and password required" }
    };
    return context.res;
  }

  // Mock signup - just validate format
  if (!email.includes('@')) {
    context.res = {
      status: 400,
      body: { error: "Invalid email" }
    };
    return context.res;
  }

  // For now, we require manual activation, so just return success
  context.res = {
    status: 200,
    body: {
      message: "Signup successful. Please check your email to verify your account.",
      email: email
    }
  };
  
  return context.res;
};
