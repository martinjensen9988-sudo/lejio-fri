const { withLessorClient } = require('../rls');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { listingId, imageUrl } = req.body;

    if (!listingId || !imageUrl) {
      context.res.status = 400;
      context.res.body = { error: "Missing required fields: listingId, imageUrl" };
      return context.res;
    }

    await withLessorClient(req, async (client, lessorId) => {
      // Verify listing belongs to lessor before updating
      const verifyResult = await client.query(
        'SELECT id FROM fri_dealer_listings WHERE id = $1 AND lessor_id = $2',
        [listingId, lessorId]
      );

      if (verifyResult.rows.length === 0) {
        throw new Error('Listing not found or access denied');
      }

      // Update listing with image
      await client.query(
        'UPDATE fri_dealer_listings SET image_url = $1, updated_at = NOW() WHERE id = $2',
        [imageUrl, listingId]
      );
    });

    context.res.status = 200;
    context.res.body = { id: listingId, imageUrl, message: "Image uploaded successfully" };
    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
