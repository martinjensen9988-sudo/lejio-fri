const pool = require("../db");
const { getSessionUserId } = require("../session");

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const { title, slug, meta_description, blocks } = req.body || {};
    const lessor_id = await getSessionUserId(req);

    if (!lessor_id) {
      context.res.status = 401;
      context.res.body = { error: "Not authenticated" };
      return context.res;
    }

    if (!title || !slug) {
      context.res.status = 400;
      context.res.body = { error: "title and slug required" };
      return context.res;
    }

    // Check if slug already exists for this lessor
    const existingSlug = await pool.query(
      'SELECT id FROM fri_pages WHERE lessor_id = $1 AND slug = $2',
      [lessor_id, slug]
    );

    if (existingSlug.rows.length > 0) {
      context.res.status = 409;
      context.res.body = { error: "Page with this slug already exists" };
      return context.res;
    }

    // Create the page
    const result = await pool.query(
      `INSERT INTO fri_pages (lessor_id, slug, title, meta_description, is_published, created_at, updated_at)
       VALUES ($1, $2, $3, $4, false, NOW(), NOW())
       RETURNING *`,
      [lessor_id, slug, title, meta_description || ""]
    );

    const newPage = result.rows[0];

    // Insert blocks if provided
    if (blocks && Array.isArray(blocks) && blocks.length > 0) {
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        await pool.query(
          `INSERT INTO fri_page_blocks (page_id, block_type, config, position)
           VALUES ($1, $2, $3, $4)`,
          [newPage.id, block.block_type, JSON.stringify(block.config || {}), i]
        );
      }
    }

    // Fetch page with blocks
    const pageWithBlocks = await pool.query(
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
       WHERE p.id = $1
       GROUP BY p.id`,
      [newPage.id]
    );

    context.res.status = 201;
    context.res.body = pageWithBlocks.rows[0];
    return context.res;
  } catch (error) {
    console.error('CreatePage error:', error);
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
