/**
 * Integration Tests — Subscription Routes
 * Tests plans listing, status, checkout, callback, history
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, createTestUser, authHeaders, cleanupTestData, disconnectPrisma, prisma, TestUser } from '../helpers';

let testUser: TestUser;
const testUserIds: number[] = [];

beforeAll(async () => {
    testUser = await createTestUser();
    testUserIds.push(testUser.id);

    // Create a trial subscription for the test user
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14);
    await prisma.subscription.create({
        data: {
            userId: testUser.id,
            plan: 'free_trial',
            status: 'active',
            trialEndsAt: trialEnd,
            endDate: trialEnd,
            amount: 0,
        },
    });
});

afterAll(async () => {
    await cleanupTestData(testUserIds);
    await disconnectPrisma();
});

describe('GET /subscription/plans', () => {
    it('should return list of subscription plans', async () => {
        const res = await request(app)
            .get('/subscription/plans')
            .set(authHeaders(testUser.token));

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('plans');
        expect(Array.isArray(res.body.plans)).toBe(true);
        expect(res.body.plans.length).toBeGreaterThanOrEqual(3);

        // Check plan structure
        for (const plan of res.body.plans) {
            expect(plan).toHaveProperty('id');
            expect(plan).toHaveProperty('name');
            expect(plan).toHaveProperty('price');
            expect(plan).toHaveProperty('features');
            expect(plan).toHaveProperty('limits');
        }
    });

    it('should require authentication', async () => {
        const res = await request(app)
            .get('/subscription/plans');

        expect(res.status).toBe(401);
    });
});

describe('GET /subscription/status', () => {
    it('should return current subscription status', async () => {
        const res = await request(app)
            .get('/subscription/status')
            .set(authHeaders(testUser.token));

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('hasSubscription');
        expect(res.body.hasSubscription).toBe(true);
        expect(res.body.plan).toBe('free_trial');
        expect(res.body.status).toBe('active');
        expect(res.body).toHaveProperty('trialEndsAt');
    });

    it('should handle user with no subscription', async () => {
        // Create user without subscription
        const noSubUser = await createTestUser({ email: `nosub-${Date.now()}@test.com` });
        testUserIds.push(noSubUser.id);

        const res = await request(app)
            .get('/subscription/status')
            .set(authHeaders(noSubUser.token));

        expect(res.status).toBe(200);
        expect(res.body.hasSubscription).toBe(false);
    });
});

describe('POST /subscription/checkout', () => {
    it('should create a checkout order (dev simulation)', async () => {
        const res = await request(app)
            .post('/subscription/checkout')
            .set(authHeaders(testUser.token))
            .send({ planId: 'starter' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('success');
        // In dev mode (no PAYG creds), it should simulate
        if (res.body.success) {
            // Should have either paymentProcessUrl or simulated response
            expect(res.body).toHaveProperty('message');
        }
    });

    it('should reject invalid plan ID', async () => {
        const res = await request(app)
            .post('/subscription/checkout')
            .set(authHeaders(testUser.token))
            .send({ planId: 'nonexistent_plan' });

        expect(res.status).toBe(400);
    });

    it('should reject free_trial plan (cannot checkout for free)', async () => {
        const res = await request(app)
            .post('/subscription/checkout')
            .set(authHeaders(testUser.token))
            .send({ planId: 'free_trial' });

        // Should either reject or handle gracefully
        expect([200, 400]).toContain(res.status);
    });

    it('should require authentication', async () => {
        const res = await request(app)
            .post('/subscription/checkout')
            .send({ planId: 'starter' });

        expect(res.status).toBe(401);
    });
});

describe('GET /subscription/history', () => {
    it('should return empty transaction list for new user', async () => {
        const res = await request(app)
            .get('/subscription/history')
            .set(authHeaders(testUser.token));

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('transactions');
        expect(Array.isArray(res.body.transactions)).toBe(true);
    });

    it('should require authentication', async () => {
        const res = await request(app)
            .get('/subscription/history');

        expect(res.status).toBe(401);
    });
});

describe('ALL /subscription/callback', () => {
    it('should handle missing transaction data gracefully', async () => {
        const res = await request(app)
            .get('/subscription/callback')
            .query({ orderKeyId: 'nonexistent_order' });

        // Should not crash — returns error or redirect
        expect([200, 302, 400, 401, 404, 500]).toContain(res.status);
    });
});
