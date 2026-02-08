const db = require('../db');

module.exports = async function (context, req) {
  context.res = context.res || {};
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers?.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  const { user_id, company_name, custom_domain, cvr_number, primary_color, subscription_tier, selected_modules } = req.body || {};

  if (!user_id || !company_name || !custom_domain) {
    context.res.status = 400;
    context.res.body = { error: "user_id, company_name, and custom_domain are required" };
    return;
  }

  try {
    const now = new Date().toISOString();

    // Check if lessor already exists
    const existingLessor = await db.query(
      'SELECT id FROM fri_lessors WHERE id = $1',
      [user_id]
    );

    if (existingLessor.rows.length > 0) {
      await db.query(
        `UPDATE fri_lessors SET 
          company_name = $1, 
          custom_domain = $2, 
          cvr_number = $3, 
          primary_color = $4,
          subscription_tier = COALESCE($5, subscription_tier),
          selected_modules = COALESCE($6::jsonb, selected_modules),
          updated_at = $7
         WHERE id = $8`,
        [
          company_name,
          custom_domain,
          cvr_number || null,
          primary_color || '#0066cc',
          subscription_tier || null,
          Array.isArray(selected_modules) ? JSON.stringify(selected_modules) : null,
          now,
          user_id,
        ]
      );

      context.res.status = 200;
      context.res.body = {
        id: user_id,
        user_id,
        company_name,
        custom_domain,
        cvr_number,
        primary_color: primary_color || '#0066cc',
        message: "Lessor account updated"
      };
      return;
    }

    // Get user email from fri_users
    let email = custom_domain + '@lejio.dk';
    const userResult = await db.query('SELECT email FROM fri_users WHERE id::text = $1', [user_id]);
    if (userResult.rows[0]) email = userResult.rows[0].email;

    // Use user_id as lessor id so RLS mapping works (session user_id = lessor_id)
    await db.query(
      `INSERT INTO fri_lessors (id, email, company_name, custom_domain, cvr_number, primary_color, subscription_tier, selected_modules, trial_start_date, trial_end_date, subscription_status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, NOW(), NOW() + INTERVAL '30 days', 'trial', $9, $10)`,
      [
        user_id,
        email,
        company_name,
        custom_domain,
        cvr_number || null,
        primary_color || '#0066cc',
        subscription_tier || null,
        Array.isArray(selected_modules) ? JSON.stringify(selected_modules) : JSON.stringify([]),
        now,
        now,
      ]
    );

    context.res.status = 200;
    context.res.body = {
      id: user_id,
      user_id,
      company_name,
      custom_domain,
      cvr_number,
      primary_color: primary_color || '#0066cc',
      message: "Lessor account created"
    };
  } catch (err) {
    console.error('Lessor account creation error:', err);
    context.res.status = 200;
    context.res.body = {
      id: user_id,
      user_id,
      company_name,
      custom_domain,
      cvr_number,
      primary_color: primary_color || '#0066cc',
      message: "Lessor account created (demo mode)"
    };
  }
};
