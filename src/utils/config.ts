import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  max: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

interface JWTConfig {
  secret: string;
  expiresIn: string;
}

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  from: string;
}

interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string;
  database: DatabaseConfig;
  jwt: JWTConfig;
  email: EmailConfig;
}

const getConfig = (): AppConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';

  return {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv,
    corsOrigin: process.env.CORS_ORIGIN || '*',
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'employee_work_tracker',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      max: nodeEnv === 'production' ? 20 : 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    },
    email: {
      host: process.env.EMAIL_HOST || 'smtp.example.com',
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      user: process.env.EMAIL_USER || '',
      password: process.env.EMAIL_PASSWORD || '',
      from: process.env.EMAIL_FROM || 'noreply@worktracker.com',
    },
  };
};

export const config = getConfig();
