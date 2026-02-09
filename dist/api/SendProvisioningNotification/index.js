const nodemailer = require('nodemailer');
const { Client } = require('pg');

const dbConfig = {
  host: process.env.POSTGRES_HOST,
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

// Setup email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY || process.env.SMTP_PASSWORD || ''
  }
});

const siteUrl = process.env.SITE_URL || 'https://lejio-fri.onrender.com';

module.exports = async function (context, req) {
  const client = new Client(dbConfig);

  try {
    const { tenant_id, lessor_id, event_type } = req.body;

    if (!tenant_id || !lessor_id || !event_type) {
      context.res = {
        status: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
      return;
    }

    await client.connect();

    // Fetch lessor info
    const lessorResult = await client.query(
      'SELECT email, company_name FROM fri_lessors WHERE id = $1',
      [lessor_id]
    );

    if (lessorResult.rows.length === 0) {
      throw new Error('Lessor not found');
    }

    const lessor = lessorResult.rows[0];

    // Fetch tenant info
    const tenantResult = await client.query(
      'SELECT name, domain, subdomain FROM fri_tenants WHERE id = $1',
      [tenant_id]
    );

    if (tenantResult.rows.length === 0) {
      throw new Error('Tenant not found');
    }

    const tenant = tenantResult.rows[0];

    // Get provisioning info
    const provResult = await client.query(
      'SELECT status, progress_percent, step FROM fri_tenant_provisioning WHERE tenant_id = $1',
      [tenant_id]
    );

    const prov = provResult.rows[0];

    // Generate email based on event type
    let emailContent = {};

    switch (event_type) {
      case 'provisioning_started':
        emailContent = generateProvisioningStartedEmail(tenant, lessor);
        break;

      case 'provisioning_progress':
        emailContent = generateProvisioningProgressEmail(tenant, lessor, prov);
        break;

      case 'provisioning_completed':
        emailContent = generateProvisioningCompletedEmail(tenant, lessor);
        break;

      case 'provisioning_failed':
        emailContent = generateProvisioningFailedEmail(tenant, lessor, prov);
        break;

      case 'trial_ending_soon':
        emailContent = generateTrialEndingSoonEmail(tenant, lessor);
        break;

      default:
        throw new Error(`Unknown event type: ${event_type}`);
    }

    // Send email
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@lejio-fri.dk',
      to: lessor.email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    context.res = {
      status: 200,
      body: JSON.stringify({
        success: true,
        email: lessor.email,
        event: event_type
      })
    };

  } catch (error) {
    context.log(`Email notification error: ${error.message}`);
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to send notification',
        message: error.message
      })
    };
  } finally {
    await client.end();
  }
};

function generateProvisioningStartedEmail(tenant, lessor) {
  return {
    subject: '🚀 Din LEJIO FRI-konto bliver sat op!',
    text: `
Hej ${lessor.company_name},

Din LEJIO FRI-konto er blevet oprettet og opsætning er nu startet!

Domæne: ${tenant.domain}
Status: Initializing...

Du kan følge opsætningsstatusen her:
${siteUrl}/tenant-provisioning/${tenant.id}

Opsætningen tager normalt 5-10 minutter.

Med venlig hilsen,
LEJIO FRI Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">🚀 Din LEJIO FRI-konto bliver sat op!</h1>
        </div>
        
        <div style="padding: 40px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <p>Hej <strong>${lessor.company_name}</strong>,</p>
          
          <p>Din LEJIO FRI-konto er blevet oprettet og opsætning er nu startet!</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #667eea; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Din domæne</p>
            <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold; color: #667eea; word-break: break-all;">
              ${tenant.domain}
            </p>
          </div>
          
          <p style="text-align: center; margin: 20px 0;">
            <a href="${siteUrl}/tenant-provisioning/${tenant.id}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Følg opsætningsstatus →
            </a>
          </p>
          
          <p style="color: #666; font-size: 14px; text-align: center;">
            Opsætningen tager normalt 5-10 minutter.
          </p>
          
          <div style="background: #f0f9ff; padding: 15px; border-radius: 6px; margin-top: 20px; border-left: 4px solid #667eea;">
            <p style="margin: 0; font-size: 13px; color: #1e40af;">
              ℹ️ Vi overfører dine trial-data til din egen dedikerede server. Ingen downtime!
            </p>
          </div>
        </div>
        
        <div style="padding: 20px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;">
          <p style="margin: 0;">Med venlig hilsen,<br/>LEJIO FRI Team</p>
        </div>
      </div>
    `
  };
}

function generateProvisioningProgressEmail(tenant, lessor, prov) {
  const steps = [
    { percent: 5, name: 'Initializing' },
    { percent: 40, name: 'Database setup' },
    { percent: 60, name: 'Data migration' },
    { percent: 90, name: 'Verification' },
    { percent: 100, name: 'Complete' }
  ];

  return {
    subject: `⏳ Opsætning i gang: ${prov.progress_percent}%`,
    text: `
Din LEJIO FRI opsætning skrider frem!

Nuværende status: ${prov.step}
Fremskridt: ${prov.progress_percent}%

Domæne: ${tenant.domain}

Følg frem med:
${siteUrl}/tenant-provisioning/${tenant.id}
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⏳ Din opsætning skrider frem!</h1>
        </div>
        
        <div style="padding: 40px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 32px; font-weight: bold; color: #667eea;">${prov.progress_percent}%</p>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Nuværende trin: ${prov.step}</p>
            </div>
            
            <div style="background: #f0f9ff; border-radius: 6px; overflow: hidden;">
              <div style="width: ${prov.progress_percent}%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 8px;"></div>
            </div>
          </div>
          
          <p style="text-align: center; margin: 20px 0;">
            <a href="${siteUrl}/tenant-provisioning/${tenant.id}" 
               style="color: #667eea; text-decoration: none; font-weight: bold;">
              Se live status →
            </a>
          </p>
        </div>
        
        <div style="padding: 20px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;">
          <p style="margin: 0;">LEJIO FRI Team</p>
        </div>
      </div>
    `
  };
}

function generateProvisioningCompletedEmail(tenant, lessor) {
  return {
    subject: '✅ Din LEJIO FRI er klar!',
    text: `
Tillykke! Din LEJIO FRI opsætning er færdig!

Du kan nu få adgang til din konto på:
https://${tenant.domain}

Login med dine credentials og kom i gang!

Med venlig hilsen,
LEJIO FRI Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">✅ Din LEJIO FRI er klar!</h1>
        </div>
        
        <div style="padding: 40px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <p>Hej <strong>${lessor.company_name}</strong>,</p>
          
          <p style="font-size: 16px; margin: 20px 0;">
            Tillykke! Din LEJIO FRI opsætning er færdig! 🎉
          </p>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="https://${tenant.domain}" 
               style="background: #10b981; color: white; padding: 16px 40px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 16px;">
              Åbn din LEJIO FRI →
            </a>
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border: 2px solid #10b981; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 12px; text-transform: uppercase;">Din domæne</p>
            <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold; color: #10b981; word-break: break-all;">
              ${tenant.domain}
            </p>
          </div>
          
          <div style="background: #ecfdf5; padding: 15px; border-radius: 6px; border-left: 4px solid #10b981; margin-top: 20px;">
            <p style="margin: 0; font-size: 13px; color: #065f46;">
              ✓ Din til data er fuldt migreret<br/>
              ✓ Alle features er tilgængelige<br/>
              ✓ Du har fuld administrativ kontrol
            </p>
          </div>
        </div>
        
        <div style="padding: 20px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;">
          <p style="margin: 0;">Med venlig hilsen,<br/>LEJIO FRI Team</p>
        </div>
      </div>
    `
  };
}

function generateProvisioningFailedEmail(tenant, lessor, prov) {
  return {
    subject: '⚠️ Opsætning fejlede - Vi hjælper!',
    text: `
Desværre fejlede opsætningen af din LEJIO FRI konto.

Fejl: ${prov.error_message}

Vores team er blevet notificeret og arbejder på at løse problemet.

Du hører fra os snarest.

Med venlig hilsen,
LEJIO FRI Support
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ Opsætning fejlede</h1>
        </div>
        
        <div style="padding: 40px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <p>Hej ${lessor.company_name},</p>
          
          <p>Desværre fejlede opsætningen af din LEJIO FRI konto. Vi beklager dette.</p>
          
          <div style="background: #fee2e2; padding: 15px; border-radius: 6px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #991b1b;">
              <strong>Fejl:</strong> ${prov.error_message}
            </p>
          </div>
          
          <p style="margin: 20px 0;">
            Vores tekniske team er blevet notificeret og arbejder på at løse problemet.
          </p>
          
          <p style="text-align: center;">
            <a href="mailto:support@lejio-fri.dk" 
               style="color: #ef4444; text-decoration: none; font-weight: bold;">
              Kontakt support →
            </a>
          </p>
        </div>
        
        <div style="padding: 20px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;">
          <p style="margin: 0;">LEJIO FRI Support Team</p>
        </div>
      </div>
    `
  };
}

function generateTrialEndingSoonEmail(tenant, lessor) {
  return {
    subject: '📅 Din LEJIO FRI trial slutter snart',
    text: `
Hej ${lessor.company_name},

Din 14-dages trial slutter om 48 timer.

Vælg en plan for at fortsætte og få din egen dedikeret LEJIO FRI:
${siteUrl}/pricing

Med venlig hilsen,
LEJIO FRI Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; color: white; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">📅 Din trial slutter snart!</h1>
        </div>
        
        <div style="padding: 40px; background: #f9fafb; border: 1px solid #e5e7eb;">
          <p>Hej ${lessor.company_name},</p>
          
          <p>Din 14-dages trial af LEJIO FRI slutter om <strong>48 timer</strong>.</p>
          
          <p>Vælg en plan nu for at:</p>
          <ul style="color: #374151;">
            <li>Fortsætte uden afbrydelse</li>
            <li>Få din egen dedikerede server</li>
            <li>Få ubegrænset adgang til alle features</li>
          </ul>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${siteUrl}/pricing" 
               style="background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Se priser →
            </a>
          </p>
        </div>
        
        <div style="padding: 20px; background: #f3f4f6; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px;">
          <p style="margin: 0;">LEJIO FRI Team</p>
        </div>
      </div>
    `
  };
}
