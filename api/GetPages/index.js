const pool = require('../db');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const lessorId = req.query.lessor_id;
    const pageId = req.query.page_id;

    if (!lessorId) {
      context.res.status = 400;
      context.res.body = { error: "lessor_id required" };
      return context.res;
    }

    let pages = [];
    
    if (pageId) {
      // Get specific page with its blocks
      const pageResult = await pool.query(
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
         WHERE p.id = $1::uuid AND p.lessor_id = $2
         GROUP BY p.id`,
        [pageId, lessorId]
      );
      pages = pageResult.rows;
    } else {
      // Get all pages for lessor
      const pagesResult = await pool.query(
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
         WHERE p.lessor_id = $1
         GROUP BY p.id
         ORDER BY p.updated_at DESC`,
        [lessorId]
      );
      pages = pagesResult.rows;
    }

    context.res.status = 200;
    context.res.body = pages;
    return context.res;
  } catch (error) {
    console.error('GetPages error:', error);
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
