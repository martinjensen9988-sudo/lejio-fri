const { withLessorClient } = require("../rls");

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const pageId = req.query.page_id;

    if (!pageId) {
      context.res.status = 400;
      context.res.body = { error: "page_id required" };
      return context.res;
    }

    await withLessorClient(req, async (client) => {
      await client.query('DELETE FROM fri_page_blocks WHERE page_id = $1::uuid', [pageId]);
      await client.query('DELETE FROM fri_pages WHERE id = $1::uuid', [pageId]);
    });

    context.res.status = 200;
    context.res.body = { message: "Page deleted" };
    return context.res;
  } catch (error) {
    console.error('DeletePage error:', error);
    context.res.status = error.statusCode || 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
