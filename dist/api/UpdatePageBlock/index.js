// Mock pages storage
const mockPages = {};

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { page_id, block_id, config, position } = req.body;

    if (!page_id || !block_id) {
      context.res.status = 400;
      context.res.body = { error: "page_id and block_id required" };
      return context.res;
    }

    const page = mockPages[page_id];
    if (!page) {
      context.res.status = 404;
      context.res.body = { error: "Page not found" };
      return context.res;
    }

    const block = page.blocks?.find(b => b.id === block_id);
    if (!block) {
      context.res.status = 404;
      context.res.body = { error: "Block not found" };
      return context.res;
    }

    if (config) block.config = config;
    if (position !== undefined) block.position = position;

    context.res.status = 200;
    context.res.body = block;
    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
