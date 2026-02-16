import { getPool } from './db';
import { getAuthToken, verifyJWT } from './auth';

// Helper function to get user ID from token
export function getUserIdFromRequest(request) {
  const token = getAuthToken(request);
  if (!token) return null;

  const decoded = verifyJWT(token);
  return decoded?.userId || null;
}

// Helper to execute queries with user ID
export async function queryAsUser(request, sql, params = []) {
  const pool = getPool();
  const userId = getUserIdFromRequest(request);

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return await pool.query(sql, [...params, userId]);
}
