import dotenv from 'dotenv';

dotenv.config();

export const config = {
  projectName: process.env.PROJECT_NAME || "Система управления ПТО",
  version: process.env.VERSION || "1.0.0",
  apiPrefix: process.env.API_V1_STR || "/api/v1",
  
  // Database
  databaseUrl: process.env.DATABASE_URL || "sqlite:///./pto.db",
  databasePath: process.env.DATABASE_PATH || "./pto.db",
  
  // Server
  port: process.env.PORT || 8000,
  
  // CORS
  corsOrigins: process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
      ],
  
  // Security
  secretKey: process.env.SECRET_KEY || "your-secret-key-change-in-production",
  algorithm: process.env.ALGORITHM || "HS256",
  accessTokenExpireMinutes: parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "30", 10),
};
