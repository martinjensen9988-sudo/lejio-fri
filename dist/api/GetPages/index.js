const { withLessorClient } = require("../rls");

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const pageId = req.query.page_id;
    const slug = req.query.slug;

    const pagesResult = await withLessorClient(req, async (client, lessorId) => {
      const conditions = ["p.lessor_id = $1"];
      const values = [lessorId];

      if (pageId) {
        values.push(pageId);
        conditions.push(`p.id = $${values.length}::uuid`);
      }

      if (slug) {
        values.push(slug);
        conditions.push(`p.slug = $${values.length}`);
      }

      return client.query(
        `SELECT p.*, 
          COALESCE(
            json_agg(
              json_build_object(
                'id', pb.id,
                'block_type', pb.block_type,
                'config', pb.config,
                'position', pb.position
              ) ORDER BY pb.position
            ) FILTER (WHERE pb.id IS NOT NULL), 
            '[]'
          ) as blocks
         FROM fri_pages p
         LEFT JOIN fri_page_blocks pb ON pb.page_id = p.id
         WHERE ${conditions.join(" AND ")}
         GROUP BY p.id
         ORDER BY p.updated_at DESC`,
        values
      );
    });

    context.res.status = 200;
    context.res.body = pagesResult.rows;
    return context.res;
  } catch (error) {
    console.error("GetPages error:", error);
    context.res.status = error.statusCode || 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
