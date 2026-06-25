"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function generateUserCode() {
    const prefix = 'OKB-';
    const lastUser = await prisma.user.findFirst({
        where: { userCode: { startsWith: prefix } },
        orderBy: { userCode: 'desc' },
        select: { userCode: true },
    });
    let nextNum = 1;
    if (lastUser?.userCode) {
        const numPart = lastUser.userCode.replace(prefix, '');
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed))
            nextNum = parsed + 1;
    }
    return `${prefix}${String(nextNum).padStart(5, '0')}`;
}
async function main() {
    const email = 'smrita@neurqai.com';
    const password = 'smritaPass2026!';
    const firstName = 'Smrita';
    const lastName = 'Pandey';
    const companyName = 'NeurQAI';
    try {
        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            console.log(`User ${email} already exists! Promoting to admin...`);
            await prisma.user.update({
                where: { email },
                data: { role: 'admin' },
            });
            console.log(`Successfully updated role to admin for ${email}`);
            return;
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const userCode = await generateUserCode();
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                companyName,
                userCode,
                role: 'admin',
                onboardingComplete: true,
            },
        });
        console.log(`Successfully created user:`, user);
        // Auto-create 14-day free trial subscription
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        const sub = await prisma.subscription.create({
            data: {
                userId: user.id,
                plan: 'free_trial',
                status: 'active',
                trialEndsAt: trialEnd,
                endDate: trialEnd,
                amount: 0,
            },
        });
        console.log(`Successfully created subscription for admin:`, sub);
    }
    catch (e) {
        console.error('Error creating admin user:', e.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=create-admin.js.map