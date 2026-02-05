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

function verifyToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string };
    return decoded.sub;
  } catch {
    return null;
  }
}

interface CreatePageRequest {
  title: string;
  slug: string;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('Pages/CreatePage function triggered');

  if (req.method !== 'POST') {
    context.res = {
      status: 405,
      body: { error: 'Method not allowed' }
    };
    return;
  }

  try {
    const lessorId = verifyToken(req.headers.authorization);
    if (!lessorId) {
      context.res = {
        status: 401,
        body: { error: 'Unauthorized' }
      };
      return;
    }

    const { title, slug } = req.body as CreatePageRequest;

    if (!title || !slug) {
      context.res = {
        status: 400,
        body: { error: 'Title and slug required' }
      };
      return;
    }

    const pool = new mssql.ConnectionPool(sqlConfig);
    await pool.connect();

    const pageId = `page-${Date.now()}`;
    const now = new Date();

    const result = await pool.request()
      .input('id', mssql.VarChar, pageId)
      .input('lessor_id', mssql.VarChar, lessorId)
      .input('title', mssql.VarChar, title)
      .input('slug', mssql.VarChar, slug)
      .input('layout_json', mssql.NVarChar, '[]')
      .input('created_at', mssql.DateTime2, now)
      .input('updated_at', mssql.DateTime2, now)
      .query(`
        INSERT INTO fri_pages (id, lessor_id, title, slug, layout_json, is_published, created_at, updated_at)
        VALUES (@id, @lessor_id, @title, @slug, @layout_json, 0, @created_at, @updated_at)
      `);

    context.res = {
      status: 201,
      body: {
        success: true,
        page: {
          id: pageId,
          lessor_id: lessorId,
          title,
          slug,
          layout_json: [],
          is_published: false,
          created_at: now,
          updated_at: now
        }
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
