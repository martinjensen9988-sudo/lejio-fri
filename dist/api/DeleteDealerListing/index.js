const { withLessorClient } = require('../rls');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { id } = req.body;

    if (!id) {
      context.res.status = 400;
      context.res.body = { error: "Missing required field: id" };
      return context.res;
    }

    await withLessorClient(req, async (client, lessorId) =>
      client.query(`
        DELETE FROM fri_dealer_listings 
        WHERE id = $1
      `, [id])
    );

    context.res.status = 200;
    context.res.body = { id, message: "Listing deleted successfully" };

    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
