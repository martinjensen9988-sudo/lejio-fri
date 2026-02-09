const { Pool } = require('pg');

let tenantCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
});

/**
 * Extract tenant from request based on domain/subdomain
 */
function extractTenantFromHost(host) {
  if (!host) return null;

  // Remove port if present
  const domain = host.split(':')[0];

  // For subdomains: customer-name.lejio-fri.dk
  if (domain.includes('lejio-fri.dk')) {
    const subdomain = domain.split('.')[0];
    if (subdomain && subdomain !== 'www' && subdomain !== 'lejio-fri') {
      return { type: 'subdomain', value: subdomain };
    }
  }

  // For custom domains: customer.com
  if (!domain.includes('localhost') && !domain.includes('127.0.0.1')) {
    return { type: 'domain', value: domain };
  }

  return null;
}

/**
 * Resolve tenant info from database
 */
async function resolveTenant(identifier) {
  // Check cache first
  if (tenantCache[identifier.value]) {
    const cached = tenantCache[identifier.value];
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.tenant;
    } else {
      delete tenantCache[identifier.value];
    }
  }

  let query, params;

  if (identifier.type === 'subdomain') {
    query = `
      SELECT id, name, slug, domain, custom_domain, subdomain, plan, status, 
             primary_color, logo_url, owner_email
      FROM fri_tenants
      WHERE subdomain = $1 AND status = 'active'
      LIMIT 1
    `;
    params = [identifier.value];
  } else {
    query = `
      SELECT id, name, slug, domain, custom_domain, subdomain, plan, status,
             primary_color, logo_url, owner_email
      FROM fri_tenants
      WHERE (custom_domain = $1 OR domain = $1) AND status = 'active'
      LIMIT 1
    `;
    params = [identifier.value];
  }

  const result = await pool.query(query, params);

  if (result.rows.length === 0) {
    return null;
  }

  const tenant = result.rows[0];

  // Cache the result
  tenantCache[identifier.value] = {
    tenant,
    timestamp: Date.now()
  };

  return tenant;
}

/**
 * Middleware to inject tenant into request context
 * Call this as early as possible in request processing
 */
module.exports.tenantResolutionMiddleware = async (context, req) => {
  try {
    const host = req.headers['host'];
    const identifier = extractTenantFromHost(host);

    if (!identifier) {
      // No tenant identification (shared trial server)
      context.tenantId = null;
      context.tenantInfo = null;
      return;
    }

    const tenant = await resolveTenant(identifier);

    if (tenant) {
      context.tenantId = tenant.id;
      context.tenantInfo = {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        domain: tenant.domain,
        customDomain: tenant.custom_domain,
        subdomain: tenant.subdomain,
        plan: tenant.plan,
        status: tenant.status,
        primaryColor: tenant.primary_color,
        logoUrl: tenant.logo_url,
        ownerEmail: tenant.owner_email
      };
    } else {
      context.tenantId = null;
      context.tenantInfo = null;
    }
  } catch (error) {
    context.log(`Tenant resolution error: ${error.message}`);
    context.tenantId = null;
    context.tenantInfo = null;
  }
};

/**
 * Middleware to enforce tenant isolation in RLS policies
 * Call after authentication, before database queries
 */
module.exports.enforceRLSContext = async (client, tenantId, lessorId) => {
  if (!lessorId) {
    throw new Error('lessorId required for RLS enforcement');
  }

  // For tenant-scoped connections, set both tenant_id and lessor_id
  if (tenantId) {
    await client.query(`SET app.tenant_id = '${tenantId}'`);
  }

  // Always set lessor_id for multi-lessor isolation within tenant
  await client.query(`SET app.lessor_id = '${lessorId}'`);
};

/**
 * Clear tenant cache (call periodically or on tenant updates)
 */
module.exports.clearTenantCache = (identifier = null) => {
  if (identifier) {
    delete tenantCache[identifier];
  } else {
    tenantCache = {};
  }
};

/**
 * Get current cache stats
 */
module.exports.getCacheStats = () => {
  return {
    cachedTenants: Object.keys(tenantCache).length,
    cacheSize: JSON.stringify(tenantCache).length,
    ttlMinutes: CACHE_TTL / 60000
  };
};
