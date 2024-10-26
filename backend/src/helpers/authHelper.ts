import jwt from 'jsonwebtoken';

export type AuthPayload = { 
  id: number,
  email: string,
  role: 'applicant' | 'staff' | 'super_admin',
};


const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'secret123';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'secret143';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';


export function generateAccessToken(payload: AuthPayload) {
  return jwt.sign(
    { id: payload.id, email: payload.email, role: payload.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

export function generateRefreshToken(payload: AuthPayload) {
  return jwt.sign(
    { id: payload.id, email: payload.email, role: payload.role },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}