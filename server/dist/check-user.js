"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    try {
        const targetEmail = 'smrita@neurqai.com';
        const user = await prisma.user.findUnique({
            where: { email: targetEmail },
            include: { subscriptions: true }
        });
        console.log('Admin user and subscription details:', JSON.stringify(user, null, 2));
    }
    catch (e) {
        console.error('Error:', e.message);
    }
    finally {
        await prisma.$disconnect();
    }
}
main();
//# sourceMappingURL=check-user.js.map