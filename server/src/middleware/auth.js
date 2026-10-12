import jwt from 'jsonwebtoken';
import { findUserById } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_prep_pulse_jwt_key_2026';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User session not found or expired.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}
