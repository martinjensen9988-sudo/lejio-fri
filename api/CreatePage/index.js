const pool = require("../db");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) cookies[name] = value;
  });
  return cookies;
}

async function resolveLessorId(req) {
  if (req.body?.lessor_id) return req.body.lessor_id;
  if (req.query?.lessor_id) return req.query.lessor_id;

  const cookies = parseCookies(req.headers.cookie);
  const sessionId = cookies.lejio_sid;
  if (!sessionId) return null;

  const sessionResult = await pool.query(
    'SELECT user_id FROM fri_sessions WHERE id = $1',
    [sessionId]
  );

  if (sessionResult.rows.length === 0) return null;
  return sessionResult.rows[0].user_id;
}

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { title, slug, meta_description, blocks } = req.body || {};
    const lessor_id = await resolveLessorId(req);

    if (!lessor_id || !title || !slug) {
      context.res.status = 400;
      context.res.body = { error: "lessor_id, title, and slug required" };
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
