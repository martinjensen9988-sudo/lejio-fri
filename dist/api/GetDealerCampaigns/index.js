const { withLessorClient } = require('../rls');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const result = await withLessorClient(req, async (client, lessorId) => {
      const response = await client.query(
        'SELECT id, title, offer_text, target_group, sent_count, response_count, is_active, created_at FROM fri_dealer_campaigns WHERE lessor_id = $1 ORDER BY created_at DESC',
        [lessorId]
      );

      const campaigns = response.rows.map(row => ({
        id: row.id,
        title: row.title,
        offerText: row.offer_text,
        targetGroup: row.target_group,
        sentCount: row.sent_count,
        responseCount: row.response_count,
        isActive: row.is_active,
        createdAt: row.created_at.toISOString(),
      }));

      return { campaigns };
    });

    context.res.status = 200;
    context.res.body = result;
    return context.res;
  } catch (err) {
    context.res.status = 500;
    context.res.body = { error: err.message || 'Failed to fetch campaigns' };
    return context.res;
  }
};
