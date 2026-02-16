import jwt from 'jsonwebtoken';
import { hashPassword, comparePassword, comparePasswordDetailed } from './crypto';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
  throw new Error('JWT_SECRET must be set to a strong value.');
}

export function verifyJWT(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function signJWT(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

export function getAuthToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1];
}

export function getUserFromToken(request) {
  const token = getAuthToken(request);
  if (!token) return null;
  const decoded = verifyJWT(token);
  return decoded ? { userId: decoded.userId, email: decoded.email } : null;
}

export function requireAuth(handler) {
  return async (request, context) => {
    const token = getAuthToken(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const decoded = verifyJWT(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Add user info to request for use in handlers
    request.user = decoded;

    return handler(request, context);
  };
}

export { hashPassword, comparePassword, comparePasswordDetailed };
