module.exports = async function (context, req) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    context.res = {
      status: 200,
      body: {
        id: null,
        email: null,
        company_name: null
      }
    };
    return context.res;
  }

  try {
    // Decode base64 token
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    context.res = {
      status: 200,
      body: {
        id: decoded.lessor_id,
        email: decoded.email,
        company_name: "Lejio Test"
      }
    };
  } catch (err) {
    context.res = {
      status: 200,
      body: {
        id: null,
        email: null,
        company_name: null
      }
    };
  }
  
  return context.res;
};
