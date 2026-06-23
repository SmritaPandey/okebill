"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.requireAdmin = requireAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(req, res, next) {
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
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'dev-secret');
        req.userId = decoded.userId;
        req.userEmail = decoded.email;
        req.userRole = decoded.role;
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ message: 'Session expired. Please log in again.', code: 'AUTH_EXPIRED' });
        }
        else if (err.name === 'JsonWebTokenError') {
            res.status(401).json({ message: 'Invalid token. Please log in again.', code: 'AUTH_MALFORMED' });
        }
        else {
            res.status(401).json({ message: 'Authentication failed', code: 'AUTH_UNKNOWN' });
        }
    }
}
/**
 * Middleware that requires the authenticated user to have an 'admin' role.
 * Must be used AFTER authMiddleware.
 */
function requireAdmin(req, res, next) {
    if (req.userRole !== 'admin') {
        res.status(403).json({ message: 'Admin access required', code: 'FORBIDDEN' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map