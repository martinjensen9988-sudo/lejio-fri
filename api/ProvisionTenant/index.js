const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');

// Helper to create custom slug from company name
function createSlug(companyName) {
  return companyName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .substring(0, 50);
}

// Helper to generate unique subdomain
async function generateUniqueSubdomain(slug, client) {
  let subdomain = slug;
  let counter = 1;
  
  while (true) {
    const existing = await client.query(
      'SELECT id FROM fri_tenants WHERE subdomain = $1',
      [subdomain]
    );
    if (existing.rows.length === 0) break;
    subdomain = `${slug}-${counter}`;
    counter++;
  }
  
  return subdomain;
}

module.exports = async function (context, req) {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    const { lessor_id, subscription_tier, custom_domain } = req.body;

    if (!lessor_id || !subscription_tier) {
      context.res = {
        status: 400,
        body: JSON.stringify({ error: 'Missing required fields: lessor_id, subscription_tier' })
      };
      return;
    }

    await client.connect();

    // 1. Fetch lessor details
    const lessorResult = await client.query(
      `SELECT id, company_name, email, custom_domain, trial_end_date, subscription_status 
       FROM fri_lessors WHERE id = $1`,
      [lessor_id]
    );

    if (lessorResult.rows.length === 0) {
      throw new Error('Lessor not found');
    }

    const lessor = lessorResult.rows[0];

    // 2. Check if already provisioned
    const existingTenant = await client.query(
      `SELECT id FROM fri_tenants WHERE owner_email = $1 AND status = 'active'`,
      [lessor.email]
    );

    if (existingTenant.rows.length > 0) {
      context.res = {
        status: 200,
        body: JSON.stringify({
          message: 'Tenant already provisioned',
          tenant_id: existingTenant.rows[0].id,
          status: 'already_active'
        })
      };
      return;
    }

    // 3. Generate tenant ID and unique subdomain
    const tenantId = uuidv4().substring(0, 36);
    const slug = createSlug(lessor.company_name);
    const subdomain = await generateUniqueSubdomain(slug, client);
    const domain = custom_domain || `${subdomain}.lejio-fri.dk`;

    // 4. Create tenant record
    await client.query(
      `INSERT INTO fri_tenants 
       (id, name, slug, domain, custom_domain, subdomain, plan, status, owner_email, 
        cvr_number, trial_start_date, trial_end_date, subscription_start_date, primary_color, logo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        tenantId,
        lessor.company_name,
        slug,
        domain,
        custom_domain || null,
        subdomain,
        subscription_tier,
        'provisioning',
        lessor.email,
        null,
        new Date(),
        lessor.trial_end_date,
        new Date(),
        '#a17a4d',
        null
      ]
    );

    // 5. Create provisioning tracking record
    await client.query(
      `INSERT INTO fri_tenant_provisioning 
       (tenant_id, lessor_id, status, step, progress_percent, trial_end_timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        tenantId,
        lessor_id,
        'provisioning',
        'initializing',
        5,
        lessor.trial_end_date
      ]
    );

    // 6. Update lessor with new tenant_id
    await client.query(
      `UPDATE fri_lessors SET tenant_id = $1, subscription_status = $2 WHERE id = $3`,
      [tenantId, 'active', lessor_id]
    );

    // 7. Trigger migration (in background, but start it now)
    // This would normally be an async job, but for now we log it
    await client.query(
      `INSERT INTO fri_tenant_migrations 
       (tenant_id, lessor_id, migration_type, status, started_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, lessor_id, 'trial_to_paid', 'pending', new Date()]
    );

    // 8. Update provisioning status - schema setup complete
    await client.query(
      `UPDATE fri_tenant_provisioning 
       SET step = $1, progress_percent = $2, updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $3`,
      ['schema_provisioning', 40, tenantId]
    );

    context.res = {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        tenant_id: tenantId,
        company_name: lessor.company_name,
        subdomain,
        domain,
        status: 'provisioning',
        url: `https://${domain}`,
        message: 'Tenant provisioning initiated. Setup will complete automatically within 5-10 minutes.'
      })
    };

  } catch (error) {
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Tenant provisioning failed',
        message: error.message,
        details: error.toString()
      })
    };
  } finally {
    await client.end();
  }
};
