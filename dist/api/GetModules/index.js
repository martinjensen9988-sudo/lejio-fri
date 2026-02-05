module.exports = async function (context, req) {
  const lessorId = req.query.lessor_id || req.body?.lessor_id || 'lessor-1';

  // Always return mock data
  const modules = [
    {
      id: 'mock-garageplan-' + lessorId,
      lessor_id: lessorId,
      module_id: 'garageplan',
      status: 'active',
      activated_at: '2026-02-05T10:00:00Z',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-02-05T10:00:00Z'
    },
    {
      id: 'mock-fleet-' + lessorId,
      lessor_id: lessorId,
      module_id: 'fleet',
      status: 'inactive',
      activated_at: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-02-05T10:00:00Z'
    }
  ];

  return {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
    body: { modules }
  };
};
