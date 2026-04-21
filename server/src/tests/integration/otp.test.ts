/**
 * Integration Tests — OTP Routes
 * Tests OTP send, verify, rate limiting, and error handling
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, createTestUser, authHeaders, cleanupTestData, disconnectPrisma, prisma, TestUser } from '../helpers';

let testUser: TestUser;
const testUserIds: number[] = [];

beforeAll(async () => {
    testUser = await createTestUser({ phone: '9876543210' });
    testUserIds.push(testUser.id);
});

afterAll(async () => {
    await cleanupTestData(testUserIds);
    await disconnectPrisma();
});

describe('POST /otp/send', () => {
    it('should send OTP successfully for valid Indian phone', async () => {
        const res = await request(app)
            .post('/otp/send')
            .set(authHeaders(testUser.token))
            .send({ phone: '9876543210', type: 'phone' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty('message');
    });

    it('should accept phone with +91 prefix', async () => {
        const user2 = await createTestUser({ email: `otp-plus91-${Date.now()}@test.com`, phone: '8765432109' });
        testUserIds.push(user2.id);

        const res = await request(app)
            .post('/otp/send')
            .set(authHeaders(user2.token))
            .send({ phone: '+918765432109', type: 'phone' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should reject invalid phone starting with 0', async () => {
        const res = await request(app)
            .post('/otp/send')
            .set(authHeaders(testUser.token))
            .send({ phone: '0123456789', type: 'phone' });

        expect(res.status).toBe(400);
    });

    it('should reject phone number too short', async () => {
        const res = await request(app)
            .post('/otp/send')
            .set(authHeaders(testUser.token))
            .send({ phone: '98765', type: 'phone' });

        expect(res.status).toBe(400);
    });

    it('should reject empty phone', async () => {
        const res = await request(app)
            .post('/otp/send')
            .set(authHeaders(testUser.token))
            .send({ phone: '', type: 'phone' });

        expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
        const res = await request(app)
            .post('/otp/send')
            .send({ phone: '9876543210', type: 'phone' });

        expect(res.status).toBe(401);
    });

    it('should create OTP record in database', async () => {
        const phone = '7654321098';
        const user3 = await createTestUser({ email: `otp-record-${Date.now()}@test.com`, phone });
        testUserIds.push(user3.id);

        await request(app)
            .post('/otp/send')
            .set(authHeaders(user3.token))
            .send({ phone, type: 'phone' });

        const records = await prisma.otpVerification.findMany({
            where: { userId: user3.id },
        });

        expect(records.length).toBeGreaterThan(0);
        expect(records[0].target).toBe(phone);
        expect(records[0].verified).toBe(false);
    });
});

describe('POST /otp/verify', () => {
    it('should verify correct OTP', async () => {
        const phone = '6543210987';
        const user4 = await createTestUser({ email: `otp-verify-${Date.now()}@test.com`, phone });
        testUserIds.push(user4.id);

        // Send OTP first
        await request(app)
            .post('/otp/send')
            .set(authHeaders(user4.token))
            .send({ phone, type: 'phone' });

        // Get OTP from DB (in dev mode, OTP is stored in DB)
        const otpRecord = await prisma.otpVerification.findFirst({
            where: { userId: user4.id, verified: false },
            orderBy: { createdAt: 'desc' },
        });

        expect(otpRecord).toBeDefined();

        const res = await request(app)
            .post('/otp/verify')
            .set(authHeaders(user4.token))
            .send({ phone, otp: otpRecord!.otpCode, type: 'phone' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it('should reject wrong OTP code', async () => {
        const phone = '6000000001';
        const user5 = await createTestUser({ email: `otp-wrong-${Date.now()}@test.com`, phone });
        testUserIds.push(user5.id);

        // Send OTP first
        await request(app)
            .post('/otp/send')
            .set(authHeaders(user5.token))
            .send({ phone, type: 'phone' });

        const res = await request(app)
            .post('/otp/verify')
            .set(authHeaders(user5.token))
            .send({ phone, otp: '000000', type: 'phone' });

        expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
        const res = await request(app)
            .post('/otp/verify')
            .send({ phone: '9876543210', otp: '123456', type: 'phone' });

        expect(res.status).toBe(401);
    });
});

describe('OTP Rate Limiting', () => {
    it('should enforce rate limit on OTP sends', async () => {
        const phone = '6000000099';
        const rateLimitUser = await createTestUser({ email: `otp-rate-${Date.now()}@test.com`, phone });
        testUserIds.push(rateLimitUser.id);

        // Send 6 OTPs rapidly (limit is 5/hour)
        const results: number[] = [];
        for (let i = 0; i < 6; i++) {
            const res = await request(app)
                .post('/otp/send')
                .set(authHeaders(rateLimitUser.token))
                .send({ phone, type: 'phone' });
            results.push(res.status);
        }

        // At least one should be rate limited (429 or 400)
        const hasRateLimit = results.some(s => s === 429 || s === 400);
        // If rate limiting is working, the 6th request should fail
        expect(hasRateLimit || results[5] !== 200).toBe(true);
    });
});
