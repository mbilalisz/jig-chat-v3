import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { redis } from '../lib/redis';

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as { userId: string };

    const storedToken = await redis.get(`session:${decoded.userId}`);
    if (storedToken !== token) {
      res.status(401).json({ message: 'Session expired or logged in elsewhere.' });
      return;
    }

    req.userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Unauthorized: invalid or expired token' });
  }
};
