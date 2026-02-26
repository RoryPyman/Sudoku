import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Verifies the Bearer access token and attaches `req.user = { id }`.
 */
export function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing access token' });
  }

  const token = header.slice(7);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired access token' });
  }
}
