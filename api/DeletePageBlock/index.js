const pool = require("../db");

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const blockId = req.query.block_id;

    if (!blockId) {
      context.res.status = 400;
      context.res.body = { error: "block_id required" };
      return context.res;
    }

    // Check block exists
    const blockCheck = await pool.query('SELECT id FROM fri_page_blocks WHERE id = $1::uuid', [blockId]);
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
