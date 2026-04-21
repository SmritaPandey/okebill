import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
    userId?: number;
    userEmail?: string;
    userRole?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ message: 'Authentication required', code: 'AUTH_MISSING' });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'null' || token === 'undefined') {
        res.status(401).json({ message: 'Invalid authentication token', code: 'AUTH_INVALID' });
        return;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret') as any;
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userRole = decoded.role;
        next();
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ message: 'Session expired. Please log in again.', code: 'AUTH_EXPIRED' });
        } else if (err.name === 'JsonWebTokenError') {
            res.status(401).json({ message: 'Invalid token. Please log in again.', code: 'AUTH_MALFORMED' });
        } else {
            res.status(401).json({ message: 'Authentication failed', code: 'AUTH_UNKNOWN' });
        }
    }
}
