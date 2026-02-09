const { withLessorClient } = require('../rls');
const { v4: uuidv4 } = require('uuid');

// Generate unique 10-character signature code
function generateSignatureCode() {
  return Math.random().toString(36).substring(2, 12).toUpperCase().padEnd(10, 'X');
}

// Get client IP address from request
function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['cf-connecting-ip'] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    'UNKNOWN'
  ).trim();
}

// Parse user agent string
function parseUserAgent(userAgentString) {
  const ua = userAgentString || '';
  
  let browserName = 'Unknown';
  let browserVersion = '0';
  let osName = 'Unknown';
  let osVersion = '0';
  let deviceType = 'Unknown';
  let deviceBrand = 'Unknown';
  let deviceModel = 'Unknown';

  // Browser detection
  if (ua.includes('Chrome') && !ua.includes('Chromium')) {
    browserName = 'Chrome';
    const match = ua.match(/Chrome\/([0-9.]+)/);
    browserVersion = match?.[1] || '0';
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browserName = 'Safari';
    const match = ua.match(/Version\/([0-9.]+)/);
    browserVersion = match?.[1] || '0';
  } else if (ua.includes('Firefox')) {
    browserName = 'Firefox';
    const match = ua.match(/Firefox\/([0-9.]+)/);
    browserVersion = match?.[1] || '0';
  } else if (ua.includes('Edge')) {
    browserName = 'Edge';
    const match = ua.match(/Edg\/([0-9.]+)/);
    browserVersion = match?.[1] || '0';
  }

  // OS detection
  if (ua.includes('Windows')) {
    osName = 'Windows';
    const match = ua.match(/Windows NT ([0-9.]+)/);
    osVersion = match?.[1] || '0';
  } else if (ua.includes('Mac')) {
    osName = 'macOS';
    const match = ua.match(/Mac OS X ([0-9_.]+)/);
    osVersion = match?.[1]?.replace(/_/g, '.') || '0';
  } else if (ua.includes('Linux')) {
    osName = 'Linux';
    osVersion = 'Unknown';
  } else if (ua.includes('iPhone') || ua.includes('iPad')) {
    osName = 'iOS';
    deviceType = ua.includes('iPad') ? 'Tablet' : 'Mobile';
    const match = ua.match(/OS ([0-9_]+) /);
    osVersion = match?.[1]?.replace(/_/g, '.') || '0';
  } else if (ua.includes('Android')) {
    osName = 'Android';
    deviceType = 'Mobile';
    const match = ua.match(/Android ([0-9.]+)/);
    osVersion = match?.[1] || '0';
  }

  // Device detection
  if (ua.includes('Mobile')) {
    deviceType = 'Mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    deviceType = 'Tablet';
  } else if (deviceType === 'Unknown') {
    deviceType = 'Desktop';
  }

  if (ua.includes('iPhone')) {
    deviceBrand = 'Apple';
    deviceModel = 'iPhone';
  } else if (ua.includes('iPad')) {
    deviceBrand = 'Apple';
    deviceModel = 'iPad';
  } else if (ua.includes('Samsung')) {
    deviceBrand = 'Samsung';
    deviceModel = 'Samsung Device';
  }

  return {
    browserName,
    browserVersion,
    osName,
    osVersion,
    deviceType,
    deviceBrand,
    deviceModel
  };
}

module.exports = async function (context, req) {
  try {
    const { contractId, customerName, customerEmail } = req.body;

    if (!contractId || !customerName || !customerEmail) {
      context.res = {
        status: 400,
        body: JSON.stringify({ error: 'Missing required fields: contractId, customerName, customerEmail' })
      };
      return;
    }

    // Get client details
    const ipAddress = getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';
    const uaData = parseUserAgent(userAgent);
    const timestamp = new Date().toISOString();
    const signatureCode = generateSignatureCode();
    const signatureId = uuidv4();

    await withLessorClient(async (client, lessorId) => {
      // Verify contract exists and belongs to lessor
      const contractCheck = await client.query(
        'SELECT id FROM fri_dealer_contracts WHERE id = $1 AND lessor_id = $2',
        [contractId, lessorId]
      );

      if (contractCheck.rows.length === 0) {
        throw new Error('Contract not found or access denied');
      }

      // Insert signature record
      await client.query(
        `INSERT INTO fri_contract_signatures (
          id, contract_id, lessor_id, signature_code, customer_name, customer_email,
          signed_by, ip_address, user_agent, browser_name, browser_version, 
          os_name, os_version, device_type, device_brand, device_model,
          signature_timestamp, signature_metadata, is_valid
        ) VALUES (
          $1, $2, $3, $4, $5, $6, 
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15, $16,
          $17, $18, $19
        )`,
        [
          signatureId,
          contractId,
          lessorId,
          signatureCode,
          customerName,
          customerEmail,
          customerName,
          ipAddress,
          userAgent,
          uaData.browserName,
          uaData.browserVersion,
          uaData.osName,
          uaData.osVersion,
          uaData.deviceType,
          uaData.deviceBrand,
          uaData.deviceModel,
          timestamp,
          JSON.stringify({
            timestamp,
            ipAddress,
            userAgent,
            confirmationUrl: `https://lejio-fri.onrender.com/sign-contract/${contractId}?code=${signatureCode}`
          }),
          true
        ]
      );

      // Update contract with signature details
      await client.query(
        `UPDATE fri_dealer_contracts 
         SET signature_id = $1, signature_ip_address = $2, signature_timestamp = $3, 
             signed_at = CURRENT_TIMESTAMP, status = $4,
             signature_metadata = $5
         WHERE id = $6`,
        [
          signatureCode,
          ipAddress,
          timestamp,
          'signed',
          JSON.stringify({
            signatureCode,
            signatureId,
            ipAddress,
            timestamp,
            browser: `${uaData.browserName} ${uaData.browserVersion}`,
            os: `${uaData.osName} ${uaData.osVersion}`,
            device: `${uaData.deviceType} - ${uaData.deviceBrand} ${uaData.deviceModel}`
          }),
          contractId
        ]
      );
    }, req);

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        success: true,
        signatureCode,
        signatureId,
        timestamp,
        ipAddress,
        browser: `${uaData.browserName} ${uaData.browserVersion}`,
        os: `${uaData.osName} ${uaData.osVersion}`,
        device: `${uaData.deviceType} - ${uaData.deviceBrand} ${uaData.deviceModel}`,
        certificateUrl: `https://lejio-fri.onrender.com/signature-certificate/${signatureCode}`
      })
    };

  } catch (error) {
    context.res = {
      status: 500,
      body: JSON.stringify({
        error: 'Failed to sign contract',
        message: error.message
      })
    };
  }
};
