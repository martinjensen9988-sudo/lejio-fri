const { withLessorClient } = require('../rls');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { name, discountPercent, validFrom, validTo } = req.body;

    if (!name || !discountPercent || !validFrom || !validTo) {
      context.res.status = 400;
      context.res.body = { error: "Missing required fields" };
      return context.res;
    }

    const cardId = uuidv4();

    await withLessorClient(req, async (client, lessorId) =>
      client.query(`
        INSERT INTO fri_dealer_loyalty_cards 
        (id, lessor_id, name, discount_percent, valid_from, valid_to, is_active, created_at, updated_at)
        VALUES 
        ($1, $2, $3, $4, $5, $6, TRUE, NOW(), NOW())
      `, [cardId, lessorId, name, discountPercent, validFrom, validTo])
    );

    context.res.status = 201;
    context.res.body = { id: cardId, name, discountPercent, validFrom, validTo, isActive: true };
    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
