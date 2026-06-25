import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const targetEmail = 'smrita@neurqai.com';
        const user = await prisma.user.findUnique({
            where: { email: targetEmail },
            include: { subscriptions: true }
        });
        console.log('Admin user and subscription details:', JSON.stringify(user, null, 2));
    } catch (e: any) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}
main();

