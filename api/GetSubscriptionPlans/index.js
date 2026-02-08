const pool = require('../db');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { rows } = await pool.query(
      "SELECT id, category, name, price_monthly, currency, description, price_note, is_active, sort_order FROM fri_subscription_plans WHERE is_active = TRUE ORDER BY category, sort_order"
    );

    context.res.status = 200;
    context.res.body = { plans: rows };
    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
