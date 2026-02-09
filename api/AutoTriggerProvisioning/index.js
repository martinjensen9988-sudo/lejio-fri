const { Client } = require('pg');
const https = require('https');

// Helper function to trigger provisioning for a lessor
async function triggerProvisioningForLessor(lessorId, subscriptionTier, baseUrl) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      lessor_id: lessorId,
      subscription_tier: subscriptionTier
    });

    const options = {
      hostname: new URL(baseUrl).hostname,
      port: 443,
      path: '/api/ProvisionTenant',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = async function (context, req) {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  });

  const baseUrl = process.env.SITE_URL || 'https://lejio-fri.onrender.com';
  const results = [];

  try {
    await client.connect();

    // 1. Find lessors whose trial ends within next 48 hours and haven't been provisioned yet
    const result = await client.query(
      `SELECT l.id, l.company_name, l.subscription_tier, l.trial_end_date, l.tenant_id
       FROM fri_lessors l
       WHERE l.subscription_status IN ('trial', 'trial_ending')
       AND l.tenant_id IS NULL
       AND l.trial_end_date BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '48 hours'
       ORDER BY l.trial_end_date ASC`
    );

    const pendingLessors = result.rows;
    context.log(`Found ${pendingLessors.length} lessors pending provisioning`);

    // 2. Check for lessors with active subscriptions but no tenant (manual upgrade)
    const activeNoTenantResult = await client.query(
      `SELECT l.id, l.company_name, l.subscription_tier, l.trial_end_date, l.tenant_id
       FROM fri_lessors l
       WHERE l.subscription_status = 'active'
       AND l.tenant_id IS NULL
       ORDER BY l.updated_at ASC`
    );

    const activeNeedingProvisioning = activeNoTenantResult.rows;
    context.log(`Found ${activeNeedingProvisioning.length} active lessors without tenant`);

    // 3. Provision pending and active customers
    const allToProvision = [...pendingLessors, ...activeNeedingProvisioning];

    for (const lessor of allToProvision) {
      try {
        // Check if already in provisioning process
        const existingProvisioning = await client.query(
          `SELECT id FROM fri_tenant_provisioning 
           WHERE lessor_id = $1 AND status NOT IN ('completed', 'failed')`,
          [lessor.id]
        );

        if (existingProvisioning.rows.length > 0) {
          results.push({
            lessor_id: lessor.id,
            company_name: lessor.company_name,
            status: 'already_provisioning',
            message: 'Already in provisioning queue'
          });
          continue;
        }

        // Trigger provisioning
        const provisionResult = await triggerProvisioningForLessor(
          lessor.id,
          lessor.subscription_tier || 'dealer_plus'
        );

        // Update subscription status to indicate activation imminent
        if (lessor.subscription_status === 'trial') {
          await client.query(
            `UPDATE fri_lessors SET subscription_status = $1, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $2`,
            ['trial_ending', lessor.id]
          );
        }

        results.push({
          lessor_id: lessor.id,
          company_name: lessor.company_name,
          tenant_id: provisionResult.data.tenant_id,
          status: 'provisioning_started',
          url: provisionResult.data.url
        });

        // Log auto-trigger event
        await client.query(
          `INSERT INTO fri_audit_logs 
           (lessor_id, action, entity_type, entity_id, created_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [lessor.id, 'auto_tenant_provisioning_initiated', 'tenant', provisionResult.data.tenant_id]
        );

      } catch (error) {
        context.log(`Error provisioning lessor ${lessor.id}: ${error.message}`);
        results.push({
          lessor_id: lessor.id,
          company_name: lessor.company_name,
          status: 'provisioning_failed',
          error: error.message
        });

        // Update provisioning status with error
        await client.query(
          `UPDATE fri_tenant_provisioning 
           SET status = $1, error_message = $2, updated_at = CURRENT_TIMESTAMP
           WHERE lessor_id = $3 AND status = 'pending'`,
          ['failed', error.message, lessor.id]
        );
      }
    }

    // 4. Update migration statuses for in-progress provisioning
    const provisioningTenants = await client.query(
      `SELECT tp.tenant_id, tp.lessor_id 
       FROM fri_tenant_provisioning tp 
       WHERE tp.status = 'provisioning'
       AND tp.updated_at < CURRENT_TIMESTAMP - INTERVAL '30 seconds'
       LIMIT 10`
    );

    for (const prov of provisioningTenants.rows) {
      // Simulate migration progress
      await client.query(
        `UPDATE fri_tenant_provisioning 
         SET step = $1, progress_percent = $2, updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $3`,
        ['data_migration', 60, prov.tenant_id]
      );

      await client.query(
        `UPDATE fri_tenant_migrations 
         SET status = $1, records_migrated = 0, started_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $2 AND status = 'pending' LIMIT 1`,
        ['in_progress', prov.tenant_id]
      );
    }

    // 5. Complete any migrations that have been running > 2 minutes
    const completingMigrations = await client.query(
      `SELECT ftm.tenant_id, ftm.id
       FROM fri_tenant_migrations ftm
       WHERE ftm.status = 'in_progress'
       AND ftm.started_at < CURRENT_TIMESTAMP - INTERVAL '2 minutes'`
    );

    for (const migration of completingMigrations.rows) {
      const migrationEndTime = new Date();

      await client.query(
        `UPDATE fri_tenant_migrations 
         SET status = $1, completed_at = $2, records_migrated = 0
         WHERE id = $3`,
        ['completed', migrationEndTime, migration.id]
      );

      await client.query(
        `UPDATE fri_tenant_provisioning 
         SET status = $1, step = $2, progress_percent = $3, 
             provisioned_at = $4, updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $5`,
        ['completed', 'provisioning_complete', 100, migrationEndTime, migration.tenant_id]
      );

      // Update tenant status to active
      await client.query(
        `UPDATE fri_tenants SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        ['active', migration.tenant_id]
      );
    }

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        stats: {
          pendingTrialExpirations: pendingLessors.length,
          activeWithoutTenant: activeNeedingProvisioning.length,
          totalProcessed: allToProvision.length,
          provisioned: results.filter(r => r.status.includes('started')).length,
          failed: results.filter(r => r.status.includes('failed')).length,
          alreadyProvisioning: results.filter(r => r.status.includes('already')).length
        },
        results
      })
    };

  } catch (error) {
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Auto-provisioning trigger failed',
        message: error.message
      })
    };
  } finally {
    await client.end();
  }
};
