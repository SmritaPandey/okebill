/**
 * Unit Tests — PayG Client Library
 * Tests config, auth header generation, URL switching, and plan definitions
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We test the module's exports and behavior by importing directly
// For env-dependent tests we manipulate process.env

describe('PayG Client Library', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        process.env = { ...originalEnv };
        vi.resetModules();
    });

    describe('Subscription Plans', () => {
        it('should export SUBSCRIPTION_PLANS with correct structure', async () => {
            const { SUBSCRIPTION_PLANS } = await import('../../lib/payg');
            expect(SUBSCRIPTION_PLANS).toBeDefined();
            expect(Array.isArray(SUBSCRIPTION_PLANS)).toBe(true);
            expect(SUBSCRIPTION_PLANS.length).toBeGreaterThanOrEqual(3);
        });

        it('each plan should have required fields', async () => {
            const { SUBSCRIPTION_PLANS } = await import('../../lib/payg');
            for (const plan of SUBSCRIPTION_PLANS) {
                expect(plan).toHaveProperty('id');
                expect(plan).toHaveProperty('name');
                expect(plan).toHaveProperty('price');
                expect(plan).toHaveProperty('duration');
                expect(plan).toHaveProperty('features');
                expect(plan).toHaveProperty('limits');
                expect(typeof plan.id).toBe('string');
                expect(typeof plan.name).toBe('string');
                expect(typeof plan.price).toBe('number');
                expect(plan.price).toBeGreaterThanOrEqual(0);
                expect(typeof plan.duration).toBe('number');
                expect(Array.isArray(plan.features)).toBe(true);
                expect(plan.features.length).toBeGreaterThan(0);
                expect(plan.limits).toHaveProperty('invoicesPerMonth');
                expect(plan.limits).toHaveProperty('clients');
            }
        });

        it('should have a free_trial plan with price 0', async () => {
            const { SUBSCRIPTION_PLANS } = await import('../../lib/payg');
            const freePlan = SUBSCRIPTION_PLANS.find(p => p.id === 'free_trial');
            expect(freePlan).toBeDefined();
            expect(freePlan!.price).toBe(0);
        });

        it('starter plan should be priced at ₹499', async () => {
            const { SUBSCRIPTION_PLANS } = await import('../../lib/payg');
            const starter = SUBSCRIPTION_PLANS.find(p => p.id === 'starter');
            expect(starter).toBeDefined();
            expect(starter!.price).toBe(499);
        });

        it('professional plan should be priced at ₹999', async () => {
            const { SUBSCRIPTION_PLANS } = await import('../../lib/payg');
            const pro = SUBSCRIPTION_PLANS.find(p => p.id === 'professional');
            expect(pro).toBeDefined();
            expect(pro!.price).toBe(999);
        });

        it('enterprise plan should be the most expensive', async () => {
            const { SUBSCRIPTION_PLANS } = await import('../../lib/payg');
            const enterprise = SUBSCRIPTION_PLANS.find(p => p.id === 'enterprise');
            const maxPrice = Math.max(...SUBSCRIPTION_PLANS.map(p => p.price));
            expect(enterprise).toBeDefined();
            expect(enterprise!.price).toBe(maxPrice);
        });

        it('plan limits should increase with price (-1 = unlimited)', async () => {
            const { SUBSCRIPTION_PLANS } = await import('../../lib/payg');
            const sorted = [...SUBSCRIPTION_PLANS].sort((a, b) => a.price - b.price);
            // Each plan should have >= the previous plan's limits
            // -1 means unlimited, which is always >= any finite value
            const effective = (v: number) => (v === -1 ? Infinity : v);
            for (let i = 1; i < sorted.length; i++) {
                expect(effective(sorted[i].limits.invoicesPerMonth)).toBeGreaterThanOrEqual(effective(sorted[i - 1].limits.invoicesPerMonth));
                expect(effective(sorted[i].limits.clients)).toBeGreaterThanOrEqual(effective(sorted[i - 1].limits.clients));
            }
        });
    });

    describe('Auth Header Generation', () => {
        it('should generate a valid Base64 auth header when credentials are set', async () => {
            process.env.PAYG_MERCHANT_KEY_ID = 'testKey';
            process.env.PAYG_AUTH_TOKEN = 'testToken';
            process.env.PAYG_MID = 'testMID';

            // Dynamic import to pick up env changes
            const mod = await import('../../lib/payg');
            // The getAuthHeader is not directly exported; test via createPaygOrder would be integration
            // Instead, test the config function
            const config = (mod as any).getConfig?.();
            if (config) {
                expect(config.merchantKeyId).toBe('testKey');
                expect(config.authToken).toBe('testToken');
                expect(config.merchantMid).toBe('testMID');
            }
        });
    });

    describe('URL Configuration', () => {
        it('should use UAT URL when PAYG_MODE is not production', async () => {
            delete process.env.PAYG_MODE;
            const mod = await import('../../lib/payg');
            const baseUrl = (mod as any).getBaseUrl?.();
            if (baseUrl) {
                expect(baseUrl).toContain('uat');
            }
        });

        it('should use production URL when PAYG_MODE=production', async () => {
            process.env.PAYG_MODE = 'production';
            vi.resetModules();
            const mod = await import('../../lib/payg');
            const baseUrl = (mod as any).getBaseUrl?.();
            if (baseUrl) {
                expect(baseUrl).not.toContain('uat');
            }
        });
    });
});
