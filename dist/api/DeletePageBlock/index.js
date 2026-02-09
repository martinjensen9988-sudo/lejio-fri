const { withLessorClient } = require("../rls");

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const blockId = req.query.block_id;

    if (!blockId) {
      context.res.status = 400;
      context.res.body = { error: "block_id required" };
      return context.res;
    }

    await withLessorClient(req, async (client) => {
      await client.query('DELETE FROM fri_page_blocks WHERE id = $1::uuid', [blockId]);
    });

    context.res.status = 200;
    context.res.body = { message: "Block deleted" };
    return context.res;
  } catch (error) {
    console.error('DeletePageBlock error:', error);
    context.res.status = error.statusCode || 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
