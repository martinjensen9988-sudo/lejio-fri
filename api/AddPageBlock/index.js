const { withLessorClient } = require("../rls");

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { page_id, block_type, position, config } = req.body;

    if (!page_id || !block_type) {
      context.res.status = 400;
      context.res.body = { error: "page_id and block_type required" };
      return context.res;
    }

    const result = await withLessorClient(req, async (client) => {
      let blockPosition = position;
      if (blockPosition === undefined) {
        const maxPos = await client.query(
          'SELECT COALESCE(MAX(position), -1) as max_pos FROM fri_page_blocks WHERE page_id = $1::uuid',
          [page_id]
        );
        blockPosition = maxPos.rows[0].max_pos + 1;
      }

      return client.query(
        `INSERT INTO fri_page_blocks (page_id, block_type, config, position)
         VALUES ($1::uuid, $2, $3, $4)
         RETURNING *`,
        [page_id, block_type, JSON.stringify(config || {}), blockPosition]
      );
    });

    context.res.status = 201;
    context.res.body = result.rows[0];
    return context.res;
  } catch (error) {
    console.error('AddPageBlock error:', error);
    context.res.status = error.statusCode || 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
