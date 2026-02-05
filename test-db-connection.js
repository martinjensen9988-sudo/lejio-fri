const sql = require('mssql');

const config = {
  server: 'sql-vqiibdafjcmnc-dev.database.windows.net',
  database: 'lejio-fri',
  user: 'lejio_dev_user',
  password: 'LejioDev@2026!SecurePass',
  port: 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false,
    connectionTimeout: 30000,
    requestTimeout: 30000
  }
};

async function testConnection() {
  try {
    console.log('🔌 Testing database connection...');
    const pool = new sql.ConnectionPool(config);
    
    pool.on('error', err => {
      console.error('❌ Pool error:', err);
    });

    await pool.connect();
    console.log('✅ Connection successful!');
    
    const result = await pool.request().query('SELECT 1 as test');
    console.log('✅ Query executed:', result.recordset);
    
    await pool.close();
    console.log('✅ Connection closed');
    
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

testConnection();
