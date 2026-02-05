const pool = require("../db");
const { getSessionUserId } = require("../session");

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { block_id, config, position } = req.body;
    const userId = await getSessionUserId(req);

    if (!userId) {
      context.res.status = 401;
      context.res.body = { error: "Not authenticated" };
      return context.res;
    }

    if (!block_id) {
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
      [block_id, userId]
    );
    if (blockCheck.rows.length === 0) {
      context.res.status = 404;
      context.res.body = { error: "Block not found" };
      return context.res;
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (config !== undefined) {
      updates.push(`config = $${paramCount++}`);
      values.push(JSON.stringify(config));
    }
    if (position !== undefined) {
      updates.push(`position = $${paramCount++}`);
      values.push(position);
    }

    if (updates.length === 0) {
      context.res.status = 400;
      context.res.body = { error: "No fields to update" };
      return context.res;
    }

    values.push(block_id);
    const result = await pool.query(
      `UPDATE fri_page_blocks SET ${updates.join(', ')} WHERE id = $${paramCount}::uuid RETURNING *`,
      values
    );

    context.res.status = 200;
    context.res.body = result.rows[0];
    return context.res;
  } catch (error) {
    console.error('UpdatePageBlock error:', error);
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
