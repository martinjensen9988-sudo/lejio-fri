const { withLessorClient } = require('../rls');

module.exports = async function (context, req) {
  try {
    const { contractId } = req.query;

    if (!contractId) {
      context.res = {
        status: 400,
        body: JSON.stringify({ error: 'Missing required parameter: contractId' })
      };
      return;
    }

    await withLessorClient(async (client, lessorId) => {
      // Verify contract belongs to lessor
      const contractCheck = await client.query(
        'SELECT id FROM fri_dealer_contracts WHERE id = $1 AND lessor_id = $2',
        [contractId, lessorId]
      );

      if (contractCheck.rows.length === 0) {
        throw new Error('Contract not found or access denied');
      }

      // Get all signatures for this contract, ordered by timestamp
      const result = await client.query(
        `SELECT 
          id, 
          signature_code, 
          customer_name, 
          customer_email, 
          ip_address,
          ip_country,
          ip_city,
          browser_name,
          browser_version,
          os_name,
          os_version,
          device_type,
          device_brand,
          device_model,
          signature_timestamp,
          is_valid,
          rejection_reason,
          created_at
         FROM fri_contract_signatures 
         WHERE contract_id = $1 AND lessor_id = $2
         ORDER BY signature_timestamp DESC`,
        [contractId, lessorId]
      );

      const signatures = result.rows.map(row => ({
        id: row.id,
        signatureCode: row.signature_code,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        ipAddress: row.ip_address,
        ipCountry: row.ip_country,
        ipCity: row.ip_city,
        browser: `${row.browser_name} ${row.browser_version}`,
        os: `${row.os_name} ${row.os_version}`,
        device: `${row.device_type} - ${row.device_brand} ${row.device_model}`,
        signatureTimestamp: row.signature_timestamp,
        isValid: row.is_valid,
        rejectionReason: row.rejection_reason,
        createdAt: row.created_at
      }));

      context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId,
          totalSignatures: signatures.length,
          signatures
        })
      };
    }, req);

  } catch (error) {
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to fetch signatures',
        message: error.message
      })
    };
  }
};
