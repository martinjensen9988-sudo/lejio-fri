const pool = require("./db");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((cookie) => {
    const [name, value] = cookie.trim().split("=");
    if (name && value) cookies[name] = value;
  });
  return cookies;
}

async function getSessionUserId(req) {
  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies.lejio_sid;
  if (!sessionId) {
    console.log('[session] No session ID in cookies:', {
      hasCookieHeader: !!req.headers.cookie,
      parsedCookies: Object.keys(cookies),
    });
    return null;
  }

  const sessionResult = await pool.query(
    "SELECT user_id, expires_at FROM fri_sessions WHERE id = $1",
    [sessionId]
  );

  if (sessionResult.rows.length === 0) {
    console.log('[session] Session ID not found in database:', sessionId.substring(0, 10) + '...');
    return null;
  }

  const session = sessionResult.rows[0];
  if (new Date(session.expires_at) < new Date()) {
    console.log('[session] Session expired for:', sessionId.substring(0, 10) + '...');
    await pool.query("DELETE FROM fri_sessions WHERE id = $1", [sessionId]);
    return null;
  }

  console.log('[session] Valid session for user:', session.user_id);
  return session.user_id;
}

module.exports = {
  getSessionUserId,
};
