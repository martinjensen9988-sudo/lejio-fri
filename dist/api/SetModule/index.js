const { withLessorClient } = require('../rls');

module.exports = async function (context, req) {
  context.res = context.res || {};
  context.res.headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": req.headers?.origin || "*",
    "Access-Control-Allow-Credentials": "true",
  };

  const { module_id, enabled } = req.body || {};
  if (!module_id || typeof enabled !== 'boolean') {
    context.res.status = 400;
    context.res.body = { error: 'module_id and enabled (boolean) are required' };
    return context.res;
  }

  try {
    const now = new Date().toISOString();
    const status = enabled ? 'active' : 'inactive';

    const result = await withLessorClient(req, async (client, lessorId) => {
      // Get current modules
      const result = await client.query('SELECT selected_modules FROM fri_lessors WHERE id = $1', [lessorId]);
      const selectedModules = result.rows[0]?.selected_modules;
      const moduleIds = Array.isArray(selectedModules)
        ? selectedModules
        : typeof selectedModules === 'string'
          ? JSON.parse(selectedModules)
          : [];

      // Update modules list
      const updatedModules = new Set(moduleIds);
      if (enabled) {
        updatedModules.add(module_id);
      } else {
        updatedModules.delete(module_id);
      }

      const updatedList = Array.from(updatedModules);

      // Update using RLS-protected context
      await client.query(
        'UPDATE fri_lessors SET selected_modules = $1::jsonb, updated_at = $2 WHERE id = $3',
        [JSON.stringify(updatedList), now, lessorId]
      );

      const module = {
        id: `mod-${lessorId}-${module_id}`,
        lessor_id: lessorId,
        module_id,
        status,
        activated_at: enabled ? now : null,
        created_at: now,
        updated_at: now
      };

      return { module, enabled_modules: updatedList };
    });

    context.res.status = 200;
    context.res.body = result;
    return context.res;
  } catch (err) {
    console.error('SetModule error:', err.message);
    const statusCode = err.statusCode || 500;
    context.res.status = statusCode;
    context.res.body = { error: err.message || 'Failed to update module' };
    return context.res;
  }
};
