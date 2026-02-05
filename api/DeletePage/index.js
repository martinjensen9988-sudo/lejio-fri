// Mock pages storage
const mockPages = {};

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };

  try {
    const pageId = req.query.page_id;

    if (!pageId) {
      context.res.status = 400;
      context.res.body = { error: "page_id required" };
      return context.res;
    }

    if (!mockPages[pageId]) {
      context.res.status = 404;
      context.res.body = { error: "Page not found" };
      return context.res;
    }

    delete mockPages[pageId];

    context.res.status = 200;
    context.res.body = { message: "Page deleted" };
    return context.res;
  } catch (error) {
    context.res.status = 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
