"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// GET /tenants/:id
router.get('/:id', async (req, res) => {
    try {
        const tenant = await prisma_1.default.tenant.findUnique({ where: { id: Number(req.params.id) } });
        if (!tenant) {
            res.status(404).json({ message: 'Tenant not found' });
            return;
        }
        res.json(tenant);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// POST /tenants
router.post('/', async (req, res) => {
    try {
        const tenant = await prisma_1.default.tenant.create({ data: req.body });
        res.status(201).json(tenant);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PUT /tenants/:id
router.put('/:id', async (req, res) => {
    try {
        const tenant = await prisma_1.default.tenant.update({ where: { id: Number(req.params.id) }, data: req.body });
        res.json(tenant);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=tenants.js.map