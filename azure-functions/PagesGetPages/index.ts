import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as mssql from 'mssql';
import * as jwt from 'jsonwebtoken';

const sqlConfig = {
  user: process.env.DB_USER || 'martin_lejio_user',
  password: process.env.DB_PASSWORD || 'TestPassword123!',
  database: process.env.DB_NAME || 'lejio_fri',
  server: process.env.DB_SERVER || 'lejio.database.windows.net',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  },
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Verify JWT token and extract lessor_id
function verifyToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    return decoded.sub; // lessor_id
  } catch {
    return null;
  }
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('Pages/GetPages function triggered');

  try {
    // Verify token
    const lessorId = verifyToken(req.headers.authorization);
    if (!lessorId) {
      context.res = {
        status: 401,
        body: { error: 'Unauthorized' }
      };
      return;
    }

    // Connect to database
    const pool = new mssql.ConnectionPool(sqlConfig);
    await pool.connect();

    // Get pages for lessor
    const result = await pool.request()
      .input('lessor_id', mssql.VarChar, lessorId)
      .query(`
        SELECT id, lessor_id, title, slug, layout_json, is_published, published_at, created_at, updated_at
        FROM fri_pages
        WHERE lessor_id = @lessor_id
        ORDER BY created_at DESC
      `);

    context.res = {
      status: 200,
      body: {
        success: true,
        pages: result.recordset
      }
    };

    await pool.close();

  } catch (error) {
    context.log('Error:', error);
    context.res = {
      status: 500,
      body: { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
};

export default httpTrigger;
