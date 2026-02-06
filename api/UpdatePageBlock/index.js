const { withLessorClient } = require("../rls");

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { block_id, config, position } = req.body;

    if (!block_id) {
      context.res.status = 400;
      context.res.body = { error: "block_id required" };
      return context.res;
    }

    const result = await withLessorClient(req, async (client) => {
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
        const error = new Error("No fields to update");
        error.statusCode = 400;
        throw error;
      }

      values.push(block_id);
      return client.query(
        `UPDATE fri_page_blocks SET ${updates.join(', ')} WHERE id = $${paramCount}::uuid RETURNING *`,
        values
      );
    });

    context.res.status = 200;
    context.res.body = result.rows[0];
    return context.res;
  } catch (error) {
    console.error('UpdatePageBlock error:', error);
    context.res.status = error.statusCode || 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
