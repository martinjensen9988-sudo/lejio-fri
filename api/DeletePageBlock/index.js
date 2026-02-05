// Mock pages storage
const mockPages = {};

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const pageId = req.query.page_id;
    const blockId = req.query.block_id;

    if (!pageId || !blockId) {
      context.res.status = 400;
      context.res.body = { error: "page_id and block_id required" };
      return context.res;
    }

    const page = mockPages[pageId];
    if (!page) {
      context.res.status = 404;
      context.res.body = { error: "Page not found" };
      return context.res;
    }

    const blockIndex = page.blocks?.findIndex(b => b.id === blockId);
    if (blockIndex === -1 || blockIndex === undefined) {
      context.res.status = 404;
      context.res.body = { error: "Block not found" };
      return context.res;
    }

    page.blocks.splice(blockIndex, 1);

    context.res.status = 200;
    context.res.body = { message: "Block deleted" };
    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
