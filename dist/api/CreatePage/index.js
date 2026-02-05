const { readPages, writePages } = require("../storage");

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { lessor_id, title, slug, meta_description } = req.body;

    if (!lessor_id || !title || !slug) {
      context.res.status = 400;
      context.res.body = { error: "lessor_id, title, and slug required" };
      return context.res;
    }

    const pages = readPages();
    
    // Check if slug already exists for this lessor
    for (const page of Object.values(pages)) {
      if (page.lessor_id === lessor_id && page.slug === slug) {
        context.res.status = 409;
        context.res.body = { error: "Page with this slug already exists" };
        return context.res;
      }
    }

    const pageId = `page-${Date.now()}`;
    const newPage = {
      id: pageId,
      lessor_id,
      slug,
      title,
      meta_description: meta_description || "",
      is_published: false,
      blocks: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    pages[pageId] = newPage;
    writePages(pages);

    context.res.status = 201;
    context.res.body = newPage;
    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
