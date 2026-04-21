/**
 * Shared test helpers for the OneInvoicer test suite
 */
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import app from '../index';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

export interface TestUser {
    id: number;
    email: string;
    token: string;
    firstName: string;
    lastName: string;
}

let userCounter = 0;

/**
 * Create a test user in the DB and return a valid JWT
 */
export async function createTestUser(overrides: Partial<{
    email: string;
    firstName: string;
    lastName: string;
    companyName: string;
    phone: string;
    panNumber: string;
}> = {}): Promise<TestUser> {
    userCounter++;
    const email = overrides.email || `test-${userCounter}-${Date.now()}@test.com`;
    const firstName = overrides.firstName || 'Test';
    const lastName = overrides.lastName || `User${userCounter}`;
    const passwordHash = await bcrypt.hash('Test@1234', 10);

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash,
            firstName,
            lastName,
            companyName: overrides.companyName || 'Test Company',
            phone: overrides.phone,
            panNumber: overrides.panNumber,
        },
    });

    const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role, firstName, lastName, companyName: user.companyName },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    return { id: user.id, email, token, firstName, lastName };
}

/**
 * Generate a JWT for an existing user ID
 */
export function generateToken(userId: number, email: string = 'test@test.com'): string {
    return jwt.sign(
        { userId, email, role: 'user', firstName: 'Test', lastName: 'User', companyName: 'Test Co' },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

/**
 * Return auth headers for requests
 */
export function authHeaders(token: string) {
    return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
}

/**
 * Clean up all test data (run in afterAll)
 */
export async function cleanupTestData(userIds: number[]) {
    if (userIds.length === 0) return;

    // Delete in order of foreign key dependencies
    await prisma.otpVerification.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.paygTransaction.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.subscription.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
}

/**
 * Disconnect Prisma after test suite completion
 */
export async function disconnectPrisma() {
    await prisma.$disconnect();
}

export { app, prisma };
