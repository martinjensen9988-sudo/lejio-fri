const { withLessorClient } = require('../rls');

module.exports = async function (context, req) {
  context.res = context.res || {};
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers?.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const result = await withLessorClient(req, async (client, lessorId) => {
      console.log('[GetDealerListings] Fetching listings for lessor:', lessorId);
      
      const response = await client.query(
        'SELECT id, title, reg_number, price, status, created_at, updated_at FROM fri_dealer_listings WHERE lessor_id = $1 ORDER BY created_at DESC',
        [lessorId]
      );

      const listings = response.rows.map(row => ({
        id: row.id,
        title: row.title,
        reg: row.reg_number,
        price: Number(row.price),
        status: row.status,
        createdAt: row.created_at.toISOString().split('T')[0],
      }));

      console.log('[GetDealerListings] Found', listings.length, 'listings');
      return { listings };
    });

    context.res.status = 200;
    context.res.body = result;
    return context.res;
  } catch (err) {
    console.error('GetDealerListings error:', err.message);
    context.res.status = 500;
    context.res.body = { error: err.message || 'Failed to fetch listings' };
    return context.res;
  }
};
