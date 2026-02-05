// Mock pages storage
const mockPages = {};

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { page_id, title, meta_description, is_published } = req.body;

    if (!page_id) {
      context.res.status = 400;
      context.res.body = { error: "page_id required" };
      return context.res;
    }

    const page = mockPages[page_id];
    if (!page) {
      context.res.status = 404;
      context.res.body = { error: "Page not found" };
      return context.res;
    }

    // Update allowed fields
    if (title) page.title = title;
    if (meta_description) page.meta_description = meta_description;
    if (typeof is_published === "boolean") page.is_published = is_published;
    page.updated_at = new Date().toISOString();

    context.res.status = 200;
    context.res.body = page;
    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
