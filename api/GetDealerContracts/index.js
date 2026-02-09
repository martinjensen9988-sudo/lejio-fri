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
        'SELECT id, listing_id, contract_type, customer_name, customer_email, customer_phone, status, signed_at, created_at FROM fri_dealer_contracts WHERE lessor_id = $1 ORDER BY created_at DESC',
        [lessorId]
      );

      const contracts = response.rows.map(row => ({
        id: row.id,
        listingId: row.listing_id,
        contractType: row.contract_type,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone,
        status: row.status,
        signedAt: row.signed_at ? row.signed_at.toISOString() : null,
        createdAt: row.created_at.toISOString(),
      }));

      return { contracts };
    });

    context.res.status = 200;
    context.res.body = result;
    return context.res;
  } catch (err) {
    context.res.status = 500;
    context.res.body = { error: err.message || 'Failed to fetch contracts' };
    return context.res;
  }
};
