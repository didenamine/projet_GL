import dotenv from 'dotenv';

dotenv.config();

export const NODE_ENV = process.env.NODE_ENV;
export const PORT = process.env.PORT;
export const MONGO_URI = process.env.MONGO_URI;
export const BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN;
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN;
export const CORS_ORIGIN = process.env.CORS_ORIGIN;
export const NODEMAILER_EMAIL = process.env.NODEMAILER_EMAIL;
export const NODEMAILER_PASSWORD = process.env.NODEMAILER_PASSWORD;
export const APP_NAME = process.env.APP_NAME || 'PFE Management System';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'PFE Management Team';