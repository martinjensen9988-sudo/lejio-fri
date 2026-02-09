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
    const { lessor_id, tenant_id } = req.query;

    if (!lessor_id && !tenant_id) {
      context.res = {
        status: 400,
        body: JSON.stringify({ error: 'Missing required parameter: lessor_id or tenant_id' })
      };
      return;
    }

    await client.connect();

    let query, params;

    if (tenant_id) {
      query = `
        SELECT 
          tp.id,
          tp.tenant_id,
          tp.lessor_id,
          tp.status,
          tp.step,
          tp.progress_percent,
          tp.error_message,
          tp.provisioned_at,
          tp.estimated_completion,
          tp.created_at,
          tp.updated_at,
          ft.name,
          ft.domain,
          ft.custom_domain,
          ft.subdomain,
          ft.plan,
          ft.status as tenant_status
        FROM fri_tenant_provisioning tp
        JOIN fri_tenants ft ON tp.tenant_id = ft.id
        WHERE tp.tenant_id = $1
      `;
      params = [tenant_id];
    } else {
      query = `
        SELECT 
          tp.id,
          tp.tenant_id,
          tp.lessor_id,
          tp.status,
          tp.step,
          tp.progress_percent,
          tp.error_message,
          tp.provisioned_at,
          tp.estimated_completion,
          tp.created_at,
          tp.updated_at,
          ft.name,
          ft.domain,
          ft.custom_domain,
          ft.subdomain,
          ft.plan,
          ft.status as tenant_status
        FROM fri_tenant_provisioning tp
        JOIN fri_tenants ft ON tp.tenant_id = ft.id
        WHERE tp.lessor_id = $1
        ORDER BY tp.created_at DESC
        LIMIT 1
      `;
      params = [lessor_id];
    }

    const result = await client.query(query, params);

    if (result.rows.length === 0) {
      context.res = {
        status: 404,
        body: JSON.stringify({ error: 'No provisioning record found' })
      };
      return;
    }

    const prov = result.rows[0];

    // Get migration status
    const migrationResult = await client.query(
      `SELECT id, migration_type, status, started_at, completed_at, records_migrated 
       FROM fri_tenant_migrations 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC 
       LIMIT 5`,
      [prov.tenant_id]
    );

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provisioning: {
          tenantId: prov.tenant_id,
          lessorId: prov.lessor_id,
          status: prov.status,
          step: prov.step,
          progressPercent: prov.progress_percent,
          errorMessage: prov.error_message,
          provisionedAt: prov.provisioned_at,
          estimatedCompletion: prov.estimated_completion,
          createdAt: prov.created_at,
          updatedAt: prov.updated_at
        },
        tenant: {
          name: prov.name,
          domain: prov.domain,
          customDomain: prov.custom_domain,
          subdomain: prov.subdomain,
          plan: prov.plan,
          status: prov.tenant_status,
          url: `https://${prov.domain || prov.custom_domain}`
        },
        migrations: migrationResult.rows.map(m => ({
          id: m.id,
          type: m.migration_type,
          status: m.status,
          startedAt: m.started_at,
          completedAt: m.completed_at,
          recordsMigrated: m.records_migrated
        })),
        readyForUse: prov.status === 'completed' && prov.progress_percent === 100
      })
    };

  } catch (error) {
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to check provisioning status',
        message: error.message
      })
    };
  } finally {
    await client.end();
  }
};
