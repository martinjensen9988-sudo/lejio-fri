// Mock pages storage (replace with real database in production)
const mockPages = {};

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

    // Return all pages for lessor or specific page
    let pages = [];
    
    if (pageId) {
      const page = mockPages[pageId];
      if (page && page.lessor_id === lessorId) {
        pages = [page];
      }
    } else {
      pages = Object.values(mockPages).filter(p => p.lessor_id === lessorId);
    }

    context.res.status = 200;
    context.res.body = pages;
    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
