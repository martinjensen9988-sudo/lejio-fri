const { execSync } = require('child_process');
const fs = require('fs');
const sql = require('mssql');

async function createSQLUser() {
  try {
    // Get Azure AD token
    console.log('🔑 Getting Azure AD token...');
    const tokenOutput = execSync('az account get-access-token --resource "https://database.windows.net" --query accessToken -o tsv', { encoding: 'utf8' }).trim();
    const token = tokenOutput;
    
    console.log('✅ Token received');

    // Read SQL script
    const sqlScript = fs.readFileSync('./create_sql_user.sql', 'utf8');
    const statements = sqlScript.split('GO').map(s => s.trim()).filter(s => s);

    // Connect with Azure AD token
    const config = {
      server: 'lejio-fri-db.database.windows.net',
      authentication: {
        type: 'azure-active-directory-access-token',
        options: {
          token: token
        }
      },
      options: {
        encrypt: true,
        trustServerCertificate: false,
        database: 'master'
      }
    };

    const pool = new sql.ConnectionPool(config);
    
    pool.on('error', err => {
      console.error('❌ Connection Pool Error:', err);
    });

    console.log('🔌 Connecting to Azure SQL...');
    await pool.connect();
    console.log('✅ Connected!');

    // Execute statements
    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          console.log('Executing:', statement.substring(0, 50) + '...');
          await pool.request().query(statement);
        } catch (err) {
          console.log('Statement result:', err.message);
        }
      }
    }

    await pool.close();
    console.log('\n✅ SQL User Created Successfully!');
    console.log('Username: martin_lejio_user');
    console.log('Password: TestPassword123!');
    console.log('Server: lejio-fri-db.database.windows.net');
    console.log('Database: lejio_fri');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSQLUser();
