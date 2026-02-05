const pool = require("../db");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) cookies[name] = value;
    });
  }
  return cookies;
}

module.exports = async function (context, req) {
  try {
    // Get session ID from cookie
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies.lejio_sid;

    // Delete session from database
    if (sessionId) {
      await pool.query('DELETE FROM fri_sessions WHERE id = $1', [sessionId]);
    }
  } catch (err) {
    console.error('Logout error:', err);
  }

  // Clear the session cookie
  context.res = {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": req.headers.origin || "*",
      "Access-Control-Allow-Credentials": "true",
      "Set-Cookie": "lejio_sid=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0"
    },
    body: { success: true, message: "Logget ud" }
  };
  
  return context.res;
};
