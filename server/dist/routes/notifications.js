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
// GET /notifications
router.get('/', async (req, res) => {
    try {
        const { limit = '50', offset = '0' } = req.query;
        const [notifications, total] = await Promise.all([
            prisma_1.default.notification.findMany({ where: { userId: req.userId }, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } }),
            prisma_1.default.notification.count({ where: { userId: req.userId } }),
        ]);
        res.json({ notifications, total });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// PATCH /notifications/:id/read
router.patch('/:id/read', async (req, res) => {
    try {
        await prisma_1.default.notification.updateMany({ where: { id: Number(req.params.id), userId: req.userId }, data: { read: true } });
        res.status(204).send();
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=notifications.js.map