import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

/**
 * Generate the next sequential customer code for a given tenant.
 * Format: CUST-00001, CUST-00002, etc.
 */
async function generateCustomerCode(tenantId: number): Promise<string> {
    const prefix = 'CUST-';
    // Find the highest existing customer code for this tenant
    const lastCustomer = await prisma.customer.findFirst({
        where: {
            tenantId,
            customerCode: { startsWith: prefix },
        },
        orderBy: { customerCode: 'desc' },
        select: { customerCode: true },
    });

    let nextNum = 1;
    if (lastCustomer?.customerCode) {
        const numPart = lastCustomer.customerCode.replace(prefix, '');
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed)) nextNum = parsed + 1;
    }

    return `${prefix}${String(nextNum).padStart(5, '0')}`;
}

// GET /customers
router.get('/', async (req, res) => {
    try {
        const { tenantId, search, limit = '50', offset = '0' } = req.query;
        const where: any = {};
        if (tenantId) where.tenantId = Number(tenantId);
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: 'insensitive' } },
                { email: { contains: String(search), mode: 'insensitive' } },
                { phone: { contains: String(search), mode: 'insensitive' } },
                { customerCode: { contains: String(search), mode: 'insensitive' } },
            ];
        }
        const [customers, total] = await Promise.all([
            prisma.customer.findMany({ where, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } }),
            prisma.customer.count({ where }),
        ]);
        res.json({ customers, total });
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET /customers/by-code/:code — lookup by customer code
router.get('/by-code/:code', async (req, res) => {
    try {
        const { tenantId } = req.query;
        if (!tenantId) { res.status(400).json({ message: 'tenantId is required' }); return; }
        const customer = await prisma.customer.findFirst({
            where: {
                tenantId: Number(tenantId),
                customerCode: { equals: req.params.code, mode: 'insensitive' },
            },
        });
        if (!customer) { res.status(404).json({ message: 'Customer not found' }); return; }
        res.json(customer);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// GET /customers/:id
router.get('/:id', async (req, res) => {
    try {
        const customer = await prisma.customer.findUnique({ where: { id: Number(req.params.id) } });
        if (!customer) { res.status(404).json({ message: 'Customer not found' }); return; }
        res.json(customer);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// POST /customers
router.post('/', async (req, res) => {
    try {
        const tenantId = req.body.tenantId;
        if (!tenantId) { res.status(400).json({ message: 'tenantId is required' }); return; }

        // Auto-generate customerCode if not provided
        const customerCode = req.body.customerCode || await generateCustomerCode(tenantId);

        const customer = await prisma.customer.create({
            data: {
                ...req.body,
                customerCode,
            },
        });
        res.status(201).json(customer);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// PUT /customers/:id — customerCode is immutable once assigned
router.put('/:id', async (req, res) => {
    try {
        // Prevent changing the customerCode
        const { customerCode, ...updateData } = req.body;
        const customer = await prisma.customer.update({ where: { id: Number(req.params.id) }, data: updateData });
        res.json(customer);
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

// DELETE /customers/:id
router.delete('/:id', async (req, res) => {
    try {
        await prisma.customer.delete({ where: { id: Number(req.params.id) } });
        res.status(204).send();
    } catch (err: any) { res.status(500).json({ message: err.message }); }
});

export default router;
