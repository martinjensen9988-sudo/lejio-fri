module.exports = async function (context, req) {
  context.res = context.res || {};
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers?.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { subscription_tier } = req.body || {};
    console.log('[UpdateSubscriptionTier] Request:', { subscription_tier, body: req.body });
    if (!subscription_tier) {
      console.error('[UpdateSubscriptionTier] Missing subscription_tier');
      context.res.status = 400;
      context.res.body = { error: 'subscription_tier is required' };
      return context.res;
    }

    const result = await withLessorClient(req, async (client, lessorId) => {
      console.log('[UpdateSubscriptionTier] Got lessorId:', lessorId);
      // Validate plan exists and is active (these don't have RLS, so use pool)
      const planResult = await pool.query(
        'SELECT id FROM fri_subscription_plans WHERE id = $1 AND is_active = TRUE',
        [subscription_tier]
      );
      console.log('[UpdateSubscriptionTier] Plan validation result:', planResult.rows);
      if (planResult.rows.length === 0) {
        const error = new Error('Invalid subscription tier');
        error.statusCode = 400;
        throw error;
      }

      // Update using RLS-protected context
      console.log('[UpdateSubscriptionTier] Updating fri_lessors for lessorId:', lessorId);
      const updateResult = await client.query(
        'UPDATE fri_lessors SET subscription_tier = $1, updated_at = NOW() WHERE id = $2 RETURNING subscription_tier',
        [subscription_tier, lessorId]
      );
      console.log('[UpdateSubscriptionTier] Update result:', updateResult.rows);

      return { subscription_tier: updateResult.rows[0]?.subscription_tier };
    });

    console.log('[UpdateSubscriptionTier] Success:', result);
    context.res.status = 200;
    context.res.body = { success: true, ...result };
    return context.res;
  } catch (err) {
    console.error('UpdateSubscriptionTier error:', err.message, err.stack);
    const statusCode = err.statusCode || 500;
    context.res.status = statusCode;
    context.res.body = { error: err.message || 'Failed to update plan' };
    return context.res;
  }
};
