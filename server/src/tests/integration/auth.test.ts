/**
 * Integration Tests — Auth Routes
 * Tests registration, login, /me, logout against real DB
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app, cleanupTestData, authHeaders, disconnectPrisma } from '../helpers';

const testUserIds: number[] = [];

afterAll(async () => {
    await cleanupTestData(testUserIds);
    await disconnectPrisma();
});

describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
        const email = `register-test-${Date.now()}@test.com`;
        const res = await request(app)
            .post('/auth/register')
            .send({
                email,
                password: 'Test@1234',
                firstName: 'Register',
                lastName: 'Test',
                companyName: 'Test Company',
            });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user).toHaveProperty('id');
        expect(res.body.user.email).toBe(email);
        expect(res.body.user.firstName).toBe('Register');
        expect(res.body.user.companyName).toBe('Test Company');
        // Should auto-create free trial subscription
        expect(res.body.user.subscription).toBeDefined();
        expect(res.body.user.subscription.plan).toBe('free_trial');
        expect(res.body.user.subscription.status).toBe('active');

        testUserIds.push(res.body.user.id);
    });

    it('should register with phone and PAN', async () => {
        const email = `register-phone-${Date.now()}@test.com`;
        const res = await request(app)
            .post('/auth/register')
            .send({
                email,
                password: 'Test@1234',
                firstName: 'Phone',
                lastName: 'User',
                companyName: 'Phone Company',
                phone: '9876543210',
                panNumber: 'ABCDE1234F',
            });

        expect(res.status).toBe(200);
        expect(res.body.user.phone).toBe('9876543210');
        testUserIds.push(res.body.user.id);
    });

    it('should reject duplicate email', async () => {
        const email = `dup-test-${Date.now()}@test.com`;
        // First registration
        const first = await request(app)
            .post('/auth/register')
            .send({ email, password: 'Test@1234', firstName: 'A', lastName: 'B', companyName: 'C' });
        testUserIds.push(first.body.user.id);

        // Second with same email
        const res = await request(app)
            .post('/auth/register')
            .send({ email, password: 'Test@1234', firstName: 'X', lastName: 'Y', companyName: 'Z' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('already registered');
    });

    it('should reject missing required fields', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: 'incomplete@test.com' });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('required');
    });

    it('should reject invalid PAN format', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                email: `bad-pan-${Date.now()}@test.com`,
                password: 'Test@1234',
                firstName: 'Bad',
                lastName: 'PAN',
                companyName: 'Bad PAN Co',
                panNumber: 'INVALID',
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('PAN');
    });

    it('should reject invalid phone number', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                email: `bad-phone-${Date.now()}@test.com`,
                password: 'Test@1234',
                firstName: 'Bad',
                lastName: 'Phone',
                companyName: 'Bad Phone Co',
                phone: '1234567890', // starts with 1
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toContain('phone');
    });
});

describe('POST /auth/login', () => {
    const loginEmail = `login-${Date.now()}@test.com`;

    beforeAll(async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({ email: loginEmail, password: 'Test@1234', firstName: 'Login', lastName: 'User', companyName: 'Login Co' });
        testUserIds.push(res.body.user.id);
    });

    it('should login successfully with correct credentials', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: loginEmail, password: 'Test@1234' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe(loginEmail);
        expect(res.body.user).toHaveProperty('subscription');
    });

    it('should reject wrong password', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: loginEmail, password: 'WrongPassword' });

        expect(res.status).toBe(401);
        expect(res.body.message).toContain('Invalid');
    });

    it('should reject non-existent email', async () => {
        const res = await request(app)
            .post('/auth/login')
            .send({ email: 'nonexistent@nowhere.com', password: 'anything' });

        expect(res.status).toBe(401);
    });
});

describe('GET /auth/me', () => {
    let userToken: string;
    let userId: number;

    beforeAll(async () => {
        const res = await request(app)
            .post('/auth/register')
            .send({
                email: `me-${Date.now()}@test.com`,
                password: 'Test@1234',
                firstName: 'Me',
                lastName: 'Endpoint',
                companyName: 'Me Co',
                phone: '8765432109',
                panNumber: 'ZZZZZ9999Z',
            });
        userToken = res.body.token;
        userId = res.body.user.id;
        testUserIds.push(userId);
    });

    it('should return user profile with auth', async () => {
        const res = await request(app)
            .get('/auth/me')
            .set(authHeaders(userToken));

        expect(res.status).toBe(200);
        expect(res.body.user.email).toContain('me-');
        expect(res.body.user.firstName).toBe('Me');
        expect(res.body.user).toHaveProperty('phone');
        expect(res.body.user).toHaveProperty('panNumber');
        expect(res.body.user).toHaveProperty('phoneVerified');
        expect(res.body.user).toHaveProperty('emailVerified');
        expect(res.body.user).toHaveProperty('subscription');
    });

    it('should reject request without token', async () => {
        const res = await request(app)
            .get('/auth/me');

        expect(res.status).toBe(401);
    });

    it('should reject request with invalid token', async () => {
        const res = await request(app)
            .get('/auth/me')
            .set(authHeaders('invalid.token.here'));

        expect(res.status).toBe(401);
    });
});

describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
        const regRes = await request(app)
            .post('/auth/register')
            .send({
                email: `logout-${Date.now()}@test.com`,
                password: 'Test@1234',
                firstName: 'Logout',
                lastName: 'User',
                companyName: 'Logout Co',
            });
        testUserIds.push(regRes.body.user.id);

        const res = await request(app)
            .post('/auth/logout')
            .set(authHeaders(regRes.body.token));

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});
