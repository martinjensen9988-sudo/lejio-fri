const { withLessorClient } = require('../rls');

module.exports = async function (context, req) {
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const id = req.query.id;
    if (!id) {
      context.res.status = 400;
      context.res.body = { error: "id required" };
      return context.res;
    }

    const result = await withLessorClient(req, (client) =>
      client.query(
        'UPDATE fri_vehicles SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
        [id]
      )
    );

    if (result.rowCount === 0) {
      context.res.status = 404;
      context.res.body = { error: "Vehicle not found" };
      return context.res;
    }

    context.res.status = 200;
    context.res.body = { message: "Vehicle deleted successfully" };

    return context.res;
  } catch (error) {
    context.res.status = error.statusCode || 500;
    context.res.body = { error: error.message };
    return context.res;
  }
};
