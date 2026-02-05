const pool = require("../db");

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { page_id, title, slug, meta_description, is_published, blocks } = req.body;

    if (!page_id) {
      context.res.status = 400;
      context.res.body = { error: "page_id required" };
      return context.res;
    }

    // Check page exists
    const existing = await pool.query('SELECT id FROM fri_pages WHERE id = $1::uuid', [page_id]);
    if (existing.rows.length === 0) {
      context.res.status = 404;
      context.res.body = { error: "Page not found" };
      return context.res;
    }

    // Build update query dynamically
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (slug !== undefined) {
      updates.push(`slug = $${paramCount++}`);
      values.push(slug);
    }
    if (meta_description !== undefined) {
      updates.push(`meta_description = $${paramCount++}`);
      values.push(meta_description);
    }
    if (typeof is_published === "boolean") {
      updates.push(`is_published = $${paramCount++}`);
      values.push(is_published);
    }

    updates.push(`updated_at = NOW()`);
    values.push(page_id);

    // Update page
    await pool.query(
      `UPDATE fri_pages SET ${updates.join(', ')} WHERE id = $${paramCount}::uuid`,
      values
    );

    // Update blocks if provided
    if (blocks && Array.isArray(blocks)) {
      // Delete existing blocks
      await pool.query('DELETE FROM fri_page_blocks WHERE page_id = $1::uuid', [page_id]);
      
      // Insert new blocks
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        await pool.query(
          `INSERT INTO fri_page_blocks (page_id, block_type, config, position)
           VALUES ($1::uuid, $2, $3, $4)`,
          [page_id, block.block_type, JSON.stringify(block.config || {}), i]
        );
      }
    }

    // Fetch updated page with blocks
    const result = await pool.query(
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
       WHERE p.id = $1::uuid
       GROUP BY p.id`,
      [page_id]
    );

    context.res.status = 200;
    context.res.body = result.rows[0];
    return context.res;
  } catch (error) {
    console.error('UpdatePage error:', error);
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
