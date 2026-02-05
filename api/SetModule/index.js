module.exports = async function (context, req) {
  context.log('SetModule endpoint called');
  
  const { lessor_id, module_id, enabled } = req.body || {};
  const status = enabled ? 'active' : 'inactive';

  // Always return mock data
  const module = {
    id: 'mock-' + Date.now(),
    lessor_id,
    module_id,
    status,
    activated_at: enabled ? '2026-02-05T10:00:00Z' : null,
    created_at: '2026-02-05T10:00:00Z',
    updated_at: '2026-02-05T10:00:00Z'
  };

  return {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: { module }
  };
};
