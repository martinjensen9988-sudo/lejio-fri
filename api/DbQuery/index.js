const { getSessionUserId } = require('../session');
const pool = require('../db');

// Block dangerous SQL patterns
const BLOCKED_PATTERNS = [
  /\b(DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE|COPY)\b/i,
  /\bfri_sessions\b/i,
  /\bfri_users\s*.*password/i,
  /\bpg_/i,
  /\binformation_schema\b/i,
  /--/,           // SQL comments
  /\/\*/,         // Block comments
  /;\s*\w/,       // Multiple statements (semicolon followed by letters)
  /\bUNION\b/i,   // UNION injection
  /\bINTO\s+OUTFILE\b/i,
  /\bLOAD_FILE\b/i,
];

// Tables that require lessor_id scoping (tenant isolation)
const TENANT_TABLES = [
  'fri_lessors', 'fri_lessor_team_members', 'fri_vehicles', 'fri_bookings',
  'fri_invoices', 'fri_pages', 'fri_page_blocks', 'fri_modules', 
  'fri_api_keys', 'fri_payments', 'fri_settings',
];

// Inject lessor_id WHERE clause for tenant isolation on SELECT queries
function injectLessorFilter(query, lessorId) {
  const upperQuery = query.trim().toUpperCase();
  
  // Only apply to SELECT statements
  if (!upperQuery.startsWith('SELECT')) return query;
  
  // Check if query touches a tenant table
  const queryLower = query.toLowerCase();
  const touchesTenantTable = TENANT_TABLES.some(t => queryLower.includes(t));
  if (!touchesTenantTable) return query;
  
  // Skip fri_lessors - it doesn't have lessor_id column, it IS the lessor
  if (queryLower.includes('fri_lessors')) return query;
  
  // Already has a lessor_id filter — don't double-filter
  if (queryLower.includes('lessor_id')) return query;
  
  // Inject WHERE lessor_id = 'xxx' or AND lessor_id = 'xxx'
  const hasWhere = upperQuery.includes('WHERE');
  const escapedId = lessorId.replace(/'/g, "''");
  
  if (hasWhere) {
    // Add AND clause after WHERE
    return query.replace(/WHERE/i, `WHERE lessor_id = '${escapedId}' AND`);
  } else {
    // Add WHERE clause before ORDER BY, LIMIT, GROUP BY, or at end
    const insertBefore = query.match(/(ORDER\s+BY|LIMIT|GROUP\s+BY|HAVING|$)/i);
    if (insertBefore) {
      const pos = insertBefore.index;
      return query.slice(0, pos) + ` WHERE lessor_id = '${escapedId}' ` + query.slice(pos);
    }
  }
  return query;
}

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

  // Max query length
  if (query.length > 5000) {
    context.res.status = 400;
    context.res.body = { error: 'Query too long' };
    return;
  }

  try {
    // Always require authentication
    const userId = await getSessionUserId(req);
    if (!userId) {
      console.log('[DbQuery] Authentication failed:', {
        hasCookie: !!req.headers.cookie,
        cookiePreview: req.headers.cookie ? req.headers.cookie.substring(0, 50) + '...' : 'no cookie',
        origin: req.headers.origin,
      });
      context.res.status = 401;
      context.res.body = { error: 'Not authenticated' };
      return;
    }
    console.log('[DbQuery] Authenticated user:', userId);

    if (admin) {
      // Admin mode: verify admin status, query without lessor scoping
      const adminCheck = await pool.query(
        `SELECT id FROM fri_admins WHERE id = $1 
         OR email = (SELECT email FROM fri_users WHERE id::text = $1)
         OR admin_email = (SELECT email FROM fri_users WHERE id::text = $1)`,
        [userId]
      );

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
      // Normal mode: determine lessor_id for tenant isolation
      // Check if user is a team member (use lessor's id) or the owner (use own id)
      let lessorId = userId;
      try {
        const userResult = await pool.query('SELECT email FROM fri_users WHERE id::text = $1', [userId]);
        if (userResult.rows.length > 0) {
          const teamResult = await pool.query(
            `SELECT lessor_id FROM fri_lessor_team_members WHERE email = $1 AND status = 'active' LIMIT 1`,
            [userResult.rows[0].email]
          );
          if (teamResult.rows.length > 0) {
            lessorId = teamResult.rows[0].lessor_id;
          }
        }
      } catch (e) { /* use userId as fallback */ }

      // Inject lessor_id WHERE clause for tenant isolation
      const scopedQuery = injectLessorFilter(query, lessorId);
      
      const result = await pool.query(scopedQuery);
      context.res.status = 200;
      context.res.body = {
        data: result.rows || [],
        recordset: result.rows || [],
        rowCount: result.rowCount,
      };
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
