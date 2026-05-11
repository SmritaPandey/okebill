import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);
router.use(requireAdmin);

// ─── GET /admin/stats ─────────────────────────────────────
// Platform-wide statistics for the admin dashboard cards
router.get('/stats', async (_req, res) => {
    try {
        const [
            totalUsers,
            activeUsers,
            adminUsers,
            trialUsers,
            subscriptions,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: { not: 'disabled' } } }),
            prisma.user.count({ where: { role: 'admin' } }),
            prisma.subscription.count({ where: { plan: 'free_trial', status: 'active' } }),
            prisma.subscription.groupBy({
                by: ['plan'],
                _count: { plan: true },
            }),
        ]);

        const planBreakdown: Record<string, number> = {};
        for (const s of subscriptions) {
            planBreakdown[s.plan] = s._count.plan;
        }

        res.json({
            totalUsers,
            activeUsers,
            adminUsers,
            trialUsers,
            planBreakdown,
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /admin/users ─────────────────────────────────────
// List all users with search, filters, pagination
router.get('/users', async (req, res) => {
    try {
        const {
            search,
            role,
            status,
            plan,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            limit = '20',
            offset = '0',
        } = req.query;

        const where: any = {};

        // Search filter — name, email, or userCode
        if (search) {
            const term = String(search);
            where.OR = [
                { firstName: { contains: term, mode: 'insensitive' } },
                { lastName: { contains: term, mode: 'insensitive' } },
                { email: { contains: term, mode: 'insensitive' } },
                { userCode: { contains: term, mode: 'insensitive' } },
                { companyName: { contains: term, mode: 'insensitive' } },
            ];
        }

        // Role filter
        if (role && role !== 'all') {
            where.role = String(role);
        }

        // Status filter — 'active' means role !== 'disabled', 'disabled' means role === 'disabled'
        if (status === 'active') {
            where.role = { not: 'disabled' };
        } else if (status === 'disabled') {
            where.role = 'disabled';
        }

        // Subscription plan filter
        let subscriptionFilter: any = undefined;
        if (plan && plan !== 'all') {
            subscriptionFilter = {
                some: { plan: String(plan), status: 'active' },
            };
            where.subscriptions = subscriptionFilter;
        }

        // Sorting
        const validSortFields = ['createdAt', 'email', 'firstName', 'lastName', 'userCode', 'role'];
        const orderField = validSortFields.includes(String(sortBy)) ? String(sortBy) : 'createdAt';
        const orderDir = String(sortOrder) === 'asc' ? 'asc' : 'desc';

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                select: {
                    id: true,
                    userCode: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    companyName: true,
                    role: true,
                    phone: true,
                    phoneVerified: true,
                    emailVerified: true,
                    onboardingComplete: true,
                    panNumber: true,
                    gstin: true,
                    companyType: true,
                    createdAt: true,
                    updatedAt: true,
                    subscriptions: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: {
                            plan: true,
                            status: true,
                            trialEndsAt: true,
                            endDate: true,
                            amount: true,
                        },
                    },
                    _count: {
                        select: {
                            invoices: true,
                            clients: true,
                            proposals: true,
                        },
                    },
                },
                orderBy: { [orderField]: orderDir },
                take: Number(limit),
                skip: Number(offset),
            }),
            prisma.user.count({ where }),
        ]);

        // Flatten subscription to a single object for convenience
        const formatted = users.map((u) => ({
            ...u,
            subscription: u.subscriptions[0] || null,
            subscriptions: undefined,
            stats: u._count,
            _count: undefined,
        }));

        res.json({ users: formatted, total });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /admin/users/:id ─────────────────────────────────
// Full user profile for admin detail view
router.get('/users/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: Number(req.params.id) },
            select: {
                id: true,
                userCode: true,
                email: true,
                firstName: true,
                lastName: true,
                companyName: true,
                role: true,
                phone: true,
                phoneVerified: true,
                emailVerified: true,
                onboardingComplete: true,
                panNumber: true,
                gstin: true,
                tan: true,
                cin: true,
                companyType: true,
                bankAccountNo: true,
                bankIfsc: true,
                bankName: true,
                createdAt: true,
                updatedAt: true,
                subscriptions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                _count: {
                    select: {
                        invoices: true,
                        clients: true,
                        proposals: true,
                        contracts: true,
                        payments: true,
                    },
                },
            },
        });

        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }

        res.json({
            ...user,
            subscription: user.subscriptions[0] || null,
            subscriptions: undefined,
            stats: user._count,
            _count: undefined,
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PATCH /admin/users/:id/role ──────────────────────────
// Change a user's role
router.patch('/users/:id/role', async (req: AuthRequest, res) => {
    try {
        const { role } = req.body;
        const validRoles = ['user', 'admin'];
        if (!role || !validRoles.includes(role)) {
            res.status(400).json({ message: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
            return;
        }

        // Prevent admin from demoting themselves
        if (Number(req.params.id) === req.userId && role !== 'admin') {
            res.status(400).json({ message: 'You cannot remove your own admin role' });
            return;
        }

        const user = await prisma.user.update({
            where: { id: Number(req.params.id) },
            data: { role },
            select: { id: true, userCode: true, email: true, firstName: true, lastName: true, role: true },
        });

        res.json(user);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── PATCH /admin/users/:id/status ────────────────────────
// Activate or deactivate a user (sets role to 'disabled' or restores to 'user')
router.patch('/users/:id/status', async (req: AuthRequest, res) => {
    try {
        const { active } = req.body;
        if (typeof active !== 'boolean') {
            res.status(400).json({ message: 'active must be a boolean' });
            return;
        }

        // Prevent admin from deactivating themselves
        if (Number(req.params.id) === req.userId && !active) {
            res.status(400).json({ message: 'You cannot deactivate your own account' });
            return;
        }

        const user = await prisma.user.update({
            where: { id: Number(req.params.id) },
            data: { role: active ? 'user' : 'disabled' },
            select: { id: true, userCode: true, email: true, firstName: true, lastName: true, role: true },
        });

        res.json(user);
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
