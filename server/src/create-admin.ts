import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function generateUserCode(): Promise<string> {
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
        if (!isNaN(parsed)) nextNum = parsed + 1;
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

        const passwordHash = await bcrypt.hash(password, 10);
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
    } catch (e: any) {
        console.error('Error creating admin user:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
