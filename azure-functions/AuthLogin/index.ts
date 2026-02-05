import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import * as mssql from 'mssql';
import * as jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

// Database config
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

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  lessorId?: string;
  error?: string;
}

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  context.log('Auth/Login function triggered');

  if (req.method !== 'POST') {
    context.res = {
      status: 405,
      body: { error: 'Method not allowed' }
    };
    return;
  }

  try {
    const { email, password } = req.body as LoginRequest;

    if (!email || !password) {
      context.res = {
        status: 400,
        body: { error: 'Email and password required' }
      };
      return;
    }

    // Connect to database
    const pool = new mssql.ConnectionPool(sqlConfig);
    await pool.connect();

    // Query lessor by email
    const result = await pool.request()
      .input('email', mssql.VarChar, email)
      .query(`
        SELECT id, email, company_name, primary_color 
        FROM fri_lessors 
        WHERE email = @email
      `);

    if (result.recordset.length === 0) {
      context.res = {
        status: 401,
        body: { error: 'Invalid credentials' }
      };
      await pool.close();
      return;
    }

    const lessor = result.recordset[0];

    // For now, simple password check (in production, use proper password hashing)
    // This is a placeholder - in real scenario, password would be hashed in DB
    if (password !== 'TestPassword123!') {
      context.res = {
        status: 401,
        body: { error: 'Invalid credentials' }
      };
      await pool.close();
      return;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        sub: lessor.id,
        email: lessor.email,
        company_name: lessor.company_name,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      },
      JWT_SECRET
    );

    context.res = {
      status: 200,
      body: {
        success: true,
        token,
        lessorId: lessor.id,
        email: lessor.email,
        companyName: lessor.company_name,
        primaryColor: lessor.primary_color
      } as LoginResponse
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
