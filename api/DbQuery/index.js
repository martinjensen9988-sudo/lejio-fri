const { withLessorClient } = require('../rls');
const { getSessionUserId } = require('../session');
const pool = require('../db');

// Block dangerous SQL patterns
const BLOCKED_PATTERNS = [
  /\b(DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE)\b/i,
  /\bfri_sessions\b/i,
  /\bpg_/i,
  /\binformation_schema\b/i,
];

module.exports = async function (context, req) {
  context.res = context.res || {};
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers?.origin || "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === 'OPTIONS') {
    context.res.status = 204;
    context.res.body = '';
    return;
  }

  const { query, admin } = req.body || {};

  if (!query || typeof query !== 'string') {
    context.res.status = 400;
    context.res.body = { error: 'Query is required' };
    return;
  }

  // Security: block dangerous patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(query)) {
      context.res.status = 403;
      context.res.body = { error: 'Forbidden query pattern' };
      return;
    }
  }

  try {
    if (admin) {
      // Admin mode: verify admin status, query without RLS
      const userId = await getSessionUserId(req);
      if (!userId) {
        context.res.status = 401;
        context.res.body = { error: 'Not authenticated' };
        return;
      }

      // Check if user is admin
      const adminCheck = await pool.query(
        `SELECT id FROM fri_admins WHERE id = $1 
         OR email = (SELECT email FROM fri_users WHERE id::text = $1)
         OR admin_email = (SELECT email FROM fri_users WHERE id::text = $1)`,
        [userId]
      );

      // Also allow test users as admins
      const isTestAdmin = userId === 'test-martin';
      
      if (adminCheck.rows.length === 0 && !isTestAdmin) {
        context.res.status = 403;
        context.res.body = { error: 'Admin access required' };
        return;
      }

      const result = await pool.query(query);
      context.res.status = 200;
      context.res.body = {
        data: result.rows || [],
        recordset: result.rows || [],
        rowCount: result.rowCount,
      };
    } else {
      // Normal mode: use RLS
      await withLessorClient(req, async (client, lessorId) => {
        const result = await client.query(query);
        context.res.status = 200;
        context.res.body = {
          data: result.rows || [],
          recordset: result.rows || [],
          rowCount: result.rowCount,
        };
      });
    }
  } catch (error) {
    if (error.statusCode === 401) {
      context.res.status = 401;
      context.res.body = { error: 'Not authenticated' };
    } else {
      console.error('DbQuery error:', error.message);
      context.res.status = 500;
      context.res.body = { error: error.message };
    }
  }
};
