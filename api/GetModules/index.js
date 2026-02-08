const { withLessorClient } = require('../rls');

module.exports = async function (context, req) {
  context.res = context.res || {};
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers?.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  try {
    const now = new Date().toISOString();

    const result = await withLessorClient(req, async (client, lessorId) => {
      const result = await client.query('SELECT selected_modules FROM fri_lessors WHERE id = $1', [lessorId]);
      const selectedModules = result.rows[0]?.selected_modules;
      let moduleIds = [];
      if (Array.isArray(selectedModules)) {
        moduleIds = selectedModules;
      } else if (typeof selectedModules === 'string') {
        try {
          const parsed = JSON.parse(selectedModules);
          moduleIds = Array.isArray(parsed) ? parsed : [];
        } catch (err) {
          moduleIds = [];
        }
      }

      const modules = moduleIds.map((moduleId) => ({
        id: `mod-${lessorId}-${moduleId}`,
        lessor_id: lessorId,
        module_id: moduleId,
        status: 'active',
        activated_at: now,
        created_at: now,
        updated_at: now
      }));

      return { modules };
    });

    context.res.status = 200;
    context.res.body = result;
    return context.res;
  } catch (err) {
    console.error('GetModules error:', err.message);
    const statusCode = err.statusCode || 500;
    context.res.status = statusCode;
    context.res.body = { error: err.message || 'Failed to load modules' };
    return context.res;
  }
};
