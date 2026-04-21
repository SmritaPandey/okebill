/**
 * Stress / Load Tests — OneInvoicer API
 * Uses autocannon to send concurrent requests and measure performance
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import autocannon from 'autocannon';
import { createTestUser, cleanupTestData, disconnectPrisma, TestUser } from '../helpers';

// Start the server on a free port for stress tests
const PORT = 4099;
let server: any;
let testUser: TestUser;
const testUserIds: number[] = [];

beforeAll(async () => {
    // Import app and start on test port
    const { default: app } = await import('../../index');
    server = app.listen(PORT);

    testUser = await createTestUser({ email: `stress-${Date.now()}@test.com` });
    testUserIds.push(testUser.id);
});

afterAll(async () => {
    if (server) server.close();
    await cleanupTestData(testUserIds);
    await disconnectPrisma();
});

function runLoadTest(opts: autocannon.Options): Promise<autocannon.Result> {
    return new Promise((resolve, reject) => {
        const instance = autocannon(opts, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
        autocannon.track(instance, { renderProgressBar: false });
    });
}

describe('Stress Tests', () => {
    it('Health endpoint: 1000 requests, 10 concurrent', async () => {
        const result = await runLoadTest({
            url: `http://localhost:${PORT}/health`,
            connections: 10,
            amount: 1000,
            timeout: 30,
        });

        console.log('\n═══ HEALTH ENDPOINT STRESS RESULTS ═══');
        console.log(`Requests completed: ${result.requests.total}`);
        console.log(`Requests/sec:       ${result.requests.average.toFixed(1)}`);
        console.log(`Latency avg:        ${result.latency.average.toFixed(1)}ms`);
        console.log(`Latency p99:        ${result.latency.p99.toFixed(1)}ms`);
        console.log(`Errors:             ${result.errors}`);
        console.log(`Timeouts:           ${result.timeouts}`);
        console.log('══════════════════════════════════════\n');

        // Health endpoint should handle 100+ req/s with low latency
        expect(result.errors).toBe(0);
        expect(result.timeouts).toBe(0);
        expect(result.latency.average).toBeLessThan(500);
    }, 60000);

    it('Subscription plans: 500 requests, 10 concurrent (authenticated)', async () => {
        const result = await runLoadTest({
            url: `http://localhost:${PORT}/subscription/plans`,
            connections: 10,
            amount: 500,
            timeout: 30,
            headers: {
                Authorization: `Bearer ${testUser.token}`,
            },
        });

        console.log('\n═══ SUBSCRIPTION PLANS STRESS RESULTS ═══');
        console.log(`Requests completed: ${result.requests.total}`);
        console.log(`Requests/sec:       ${result.requests.average.toFixed(1)}`);
        console.log(`Latency avg:        ${result.latency.average.toFixed(1)}ms`);
        console.log(`Latency p99:        ${result.latency.p99.toFixed(1)}ms`);
        console.log(`Non-2xx responses:  ${result.non2xx}`);
        console.log(`Errors:             ${result.errors}`);
        console.log('═════════════════════════════════════════\n');

        expect(result.errors).toBe(0);
        expect(result.timeouts).toBe(0);
        // Authenticated endpoint with DB should handle reasonable load
        expect(result.latency.average).toBeLessThan(1000);
    }, 60000);

    it('Auth login: 200 requests, 5 concurrent', async () => {
        // Register user for login stress test
        const email = `stress-login-${Date.now()}@test.com`;
        const { default: appModule } = await import('../../index');
        const supertest = (await import('supertest')).default;

        const regRes = await supertest(appModule)
            .post('/auth/register')
            .send({ email, password: 'Stress@1234', firstName: 'Stress', lastName: 'Login', companyName: 'Stress Co' });
        testUserIds.push(regRes.body.user?.id);

        const result = await runLoadTest({
            url: `http://localhost:${PORT}/auth/login`,
            connections: 5,
            amount: 200,
            timeout: 30,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: 'Stress@1234' }),
        });

        console.log('\n═══ AUTH LOGIN STRESS RESULTS ═══');
        console.log(`Requests completed: ${result.requests.total}`);
        console.log(`Requests/sec:       ${result.requests.average.toFixed(1)}`);
        console.log(`Latency avg:        ${result.latency.average.toFixed(1)}ms`);
        console.log(`Latency p99:        ${result.latency.p99.toFixed(1)}ms`);
        console.log(`Errors:             ${result.errors}`);
        console.log('═════════════════════════════════\n');

        // Login involves bcrypt (intentionally slow), so higher latency is expected
        expect(result.errors).toBe(0);
        expect(result.timeouts).toBe(0);
    }, 120000);

    it('404 endpoint: validates error handling under load (500 req, 20 concurrent)', async () => {
        const result = await runLoadTest({
            url: `http://localhost:${PORT}/nonexistent/route`,
            connections: 20,
            amount: 500,
            timeout: 30,
        });

        console.log('\n═══ 404 HANDLER STRESS RESULTS ═══');
        console.log(`Requests completed: ${result.requests.total}`);
        console.log(`Requests/sec:       ${result.requests.average.toFixed(1)}`);
        console.log(`Latency avg:        ${result.latency.average.toFixed(1)}ms`);
        console.log(`Non-2xx responses:  ${result.non2xx}`);
        console.log(`Errors:             ${result.errors}`);
        console.log('══════════════════════════════════\n');

        // 404 handler should respond correctly, all should be non-2xx
        expect(result.errors).toBe(0);
        expect(result.timeouts).toBe(0);
        expect(result.non2xx).toBe(500);
    }, 60000);
});
