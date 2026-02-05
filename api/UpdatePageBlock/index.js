const pool = require("../db");

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { block_id, config, position } = req.body;

    if (!block_id) {
      context.res.status = 400;
      context.res.body = { error: "block_id required" };
      return context.res;
    }

    // Check block exists
    const blockCheck = await pool.query('SELECT id FROM fri_page_blocks WHERE id = $1::uuid', [block_id]);
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
