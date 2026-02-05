const pool = require("../db");
const { getSessionUserId } = require("../session");

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const pageId = req.query.page_id;
    const userId = await getSessionUserId(req);

    if (!userId) {
      context.res.status = 401;
      context.res.body = { error: "Not authenticated" };
      return context.res;
    }

    if (!pageId) {
      context.res.status = 400;
      context.res.body = { error: "page_id required" };
      return context.res;
    }

    // Check page ownership
    const existing = await pool.query(
      'SELECT id FROM fri_pages WHERE id = $1::uuid AND lessor_id = $2',
      [pageId, userId]
    );
    if (existing.rows.length === 0) {
      context.res.status = 404;
      context.res.body = { error: "Page not found" };
      return context.res;
    }

  // Delete blocks first (foreign key constraint) - though CASCADE should handle it
  await pool.query('DELETE FROM fri_page_blocks WHERE page_id = $1::uuid', [pageId]);
    
  // Delete page
  await pool.query('DELETE FROM fri_pages WHERE id = $1::uuid', [pageId]);

    context.res.status = 200;
    context.res.body = { message: "Page deleted" };
    return context.res;
  } catch (error) {
    console.error('DeletePage error:', error);
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
