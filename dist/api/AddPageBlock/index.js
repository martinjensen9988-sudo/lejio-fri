// Mock pages storage with blocks
const mockPages = {};

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const { page_id, block_type, position, config } = req.body;

    if (!page_id || !block_type) {
      context.res.status = 400;
      context.res.body = { error: "page_id and block_type required" };
      return context.res;
    }

    const page = mockPages[page_id];
    if (!page) {
      context.res.status = 404;
      context.res.body = { error: "Page not found" };
      return context.res;
    }

    const blockId = `block-${Date.now()}`;
    const newBlock = {
      id: blockId,
      page_id,
      block_type,
      position: position !== undefined ? position : (page.blocks?.length || 0),
      config: config || {},
    };

    if (!page.blocks) page.blocks = [];
    page.blocks.push(newBlock);

    context.res.status = 201;
    context.res.body = newBlock;
    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
