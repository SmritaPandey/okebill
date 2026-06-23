import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    userId?: number;
    userEmail?: string;
    userRole?: string;
}
export declare function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void;
/**
 * Middleware that requires the authenticated user to have an 'admin' role.
 * Must be used AFTER authMiddleware.
 */
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map