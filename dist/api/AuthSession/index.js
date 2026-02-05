module.exports = async function (context, req) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    context.res = {
      status: 200,
      body: { session: null }
    };
    return context.res;
  }

  try {
    // Decode base64 token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    context.res = {
      status: 200,
      body: {
        session: {
          user: {
            id: decoded.lessor_id,
            email: decoded.email,
            company_name: "Lejio Test"
          },
          access_token: token
        }
      }
    };
  } catch (err) {
    context.res = {
      status: 200,
      body: { session: null }
    };
  }
  
  return context.res;
};
