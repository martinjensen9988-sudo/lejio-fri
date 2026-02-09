const { withLessorClient } = require('../rls');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const result = await withLessorClient(req, async (client, lessorId) => {
      console.log('[GetDealerLoyaltyCards] Fetching for lessor:', lessorId);
      
      const response = await client.query(
        'SELECT id, name, discount_percent, valid_from, valid_to, is_active, created_at FROM fri_dealer_loyalty_cards WHERE lessor_id = $1 ORDER BY created_at DESC',
        [lessorId]
      );

      const cards = response.rows.map(row => ({
        id: row.id,
        name: row.name,
        discountPercent: Number(row.discount_percent),
        validFrom: row.valid_from.toISOString(),
        validTo: row.valid_to.toISOString(),
        isActive: row.is_active,
        createdAt: row.created_at.toISOString(),
      }));

      console.log('[GetDealerLoyaltyCards] Found', cards.length, 'cards');
      return { cards };
    });

    context.res.status = 200;
    context.res.body = result;
    return context.res;
  } catch (err) {
    console.error('GetDealerLoyaltyCards error:', err.message);
    context.res.status = 500;
    context.res.body = { error: err.message || 'Failed to fetch loyalty cards' };
    return context.res;
  }
};
