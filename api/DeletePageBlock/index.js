const pool = require("../db");
const { getSessionUserId } = require("../session");

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const blockId = req.query.block_id;
    const userId = await getSessionUserId(req);

    if (!userId) {
      context.res.status = 401;
      context.res.body = { error: "Not authenticated" };
      return context.res;
    }

    if (!blockId) {
      context.res.status = 400;
      context.res.body = { error: "block_id required" };
      return context.res;
    }

    // Check block ownership
    const blockCheck = await pool.query(
      `SELECT pb.id
       FROM fri_page_blocks pb
       JOIN fri_pages p ON p.id = pb.page_id
       WHERE pb.id = $1::uuid AND p.lessor_id = $2`,
      [blockId, userId]
    );
    if (blockCheck.rows.length === 0) {
      context.res.status = 404;
      context.res.body = { error: "Block not found" };
      return context.res;
    }

  await pool.query('DELETE FROM fri_page_blocks WHERE id = $1::uuid', [blockId]);

    context.res.status = 200;
    context.res.body = { message: "Block deleted" };
    return context.res;
  } catch (error) {
    console.error('DeletePageBlock error:', error);
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
