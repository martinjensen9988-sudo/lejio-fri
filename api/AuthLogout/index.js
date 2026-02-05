module.exports = async function (context, req) {
  // Clear the session cookie
  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": req.headers.origin || "*",
      "Access-Control-Allow-Credentials": "true",
      "Set-Cookie": "lejio_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0"
    },
    body: { success: true, message: "Logget ud" }
  };
  
  return context.res;
};
