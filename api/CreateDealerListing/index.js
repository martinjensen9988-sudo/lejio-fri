const { withLessorClient } = require('../rls');
const { v4: uuidv4 } = require('uuid');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { title, reg_number, price, status } = req.body;

    if (!title || !reg_number || price === undefined) {
      context.res.status = 400;
      context.res.body = { error: "Missing required fields: title, reg_number, price" };
      return context.res;
    }

    const listingId = uuidv4();
    const listingStatus = status || 'available';

    await withLessorClient(req, async (client, lessorId) =>
      client.query(`
        INSERT INTO fri_dealer_listings 
        (id, lessor_id, title, reg_number, price, status, created_at, updated_at)
        VALUES 
        ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      `, [listingId, lessorId, title, reg_number, price, listingStatus])
    );

    context.res.status = 201;
    context.res.body = { 
      id: listingId, 
      title,
      reg: reg_number,
      price,
      status: listingStatus,
      createdAt: new Date().toISOString(),
      message: "Listing created successfully" 
    };

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
