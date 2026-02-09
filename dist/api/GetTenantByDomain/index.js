const { Client } = require('pg');

module.exports = async function (context, req) {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  });

  try {
    const { domain, subdomain } = req.query;

    if (!domain && !subdomain) {
      context.res = {
        status: 400,
        body: JSON.stringify({ error: 'Missing required parameter: domain or subdomain' })
      };
      return;
    }

    await client.connect();

    let query, params;

    if (domain) {
      // Look up by custom domain or main domain
      query = `
        SELECT 
          id,
          name,
          slug,
          domain,
          custom_domain,
          subdomain,
          plan,
          status,
          owner_email,
          primary_color,
          logo_url,
          trial_end_date,
          subscription_start_date,
          created_at
        FROM fri_tenants
        WHERE custom_domain = $1 OR domain = $1
        LIMIT 1
      `;
      params = [domain];
    } else {
      // Look up by subdomain (e.g., "customer-name" from "customer-name.lejio-fri.dk")
      query = `
        SELECT 
          id,
          name,
          slug,
          domain,
          custom_domain,
          subdomain,
          plan,
          status,
          owner_email,
          primary_color,
          logo_url,
          trial_end_date,
          subscription_start_date,
          created_at
        FROM fri_tenants
        WHERE subdomain = $1
        LIMIT 1
      `;
      params = [subdomain];
    }

    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      context.res = {
        status: 404,
        body: JSON.stringify({ 
          error: 'Tenant not found',
          lookingFor: domain || subdomain
        })
      };
      return;
    }

    const tenant = result.rows[0];

    // Get provisioning status
    const provResult = await client.query(
      `SELECT status, step, progress_percent FROM fri_tenant_provisioning WHERE tenant_id = $1 LIMIT 1`,
      [tenant.id]
    );

    const provisioning = provResult.rows.length > 0 ? provResult.rows[0] : null;

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          domain: tenant.domain,
          customDomain: tenant.custom_domain,
          subdomain: tenant.subdomain,
          plan: tenant.plan,
          status: tenant.status,
          ownerEmail: tenant.owner_email,
          primaryColor: tenant.primary_color,
          logoUrl: tenant.logo_url,
          trialEndDate: tenant.trial_end_date,
          subscriptionStartDate: tenant.subscription_start_date,
          createdAt: tenant.created_at
        },
        provisioning: provisioning ? {
          status: provisioning.status,
          step: provisioning.step,
          progressPercent: provisioning.progress_percent,
          isReady: provisioning.status === 'completed' && provisioning.progress_percent === 100
        } : null,
        isActive: tenant.status === 'active' && (!provisioning || provisioning.status === 'completed')
      })
    };

  } catch (error) {
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to fetch tenant',
        message: error.message
      })
    };
  } finally {
    await client.end();
  }
};
