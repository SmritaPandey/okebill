// ─── OTP Verification Routes ──────────────────────────────
// Indian phone validation: 10 digits starting with 6-9
// OTP: 6-digit, 5-minute expiry, max 5 attempts
// Rate limit: max 5 OTP sends per phone per hour

import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();
router.use(authMiddleware);

// Indian phone number validation
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const OTP_EXPIRY_MINUTES = 5;
const MAX_OTP_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;

function generateOtp(): string {
    return String(Math.floor(100000 + crypto.randomInt(900000)));
}

// ─── POST /otp/send ──────────────────────────────────────
router.post('/send', async (req: AuthRequest, res) => {
    try {
        const userId = req.userId!;
        const { phone, type = 'phone' } = req.body;

        // Validate phone number (Indian format)
        if (type === 'phone') {
            const cleaned = String(phone || '').replace(/[\s\-+]/g, '').replace(/^91/, '');
            if (!INDIAN_PHONE_REGEX.test(cleaned)) {
                return res.status(400).json({
                    message: 'Invalid Indian mobile number. Must be 10 digits starting with 6-9.',
                });
            }

            // Rate limiting: max 5 OTPs per phone per hour
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentCount = await prisma.otpVerification.count({
                where: {
                    target: cleaned,
                    targetType: 'phone',
                    createdAt: { gte: oneHourAgo },
                },
            });
            if (recentCount >= MAX_OTP_PER_HOUR) {
                return res.status(429).json({
                    message: 'Too many OTP requests. Please try again after some time.',
                });
            }

            // Generate OTP
            const otpCode = generateOtp();
            const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

            // Store OTP
            await prisma.otpVerification.create({
                data: {
                    userId,
                    target: cleaned,
                    targetType: 'phone',
                    otpCode,
                    expiresAt,
                },
            });

            // Send SMS via configured provider
            const smsProvider = process.env.SMS_PROVIDER || '';

            if (smsProvider === '2factor' || process.env.TWOFACTOR_API_KEY) {
                // 2Factor.in — most popular Indian OTP service
                const apiKey = process.env.TWOFACTOR_API_KEY || '';
                try {
                    const tfResponse = await fetch(
                        `https://2factor.in/API/V1/${apiKey}/SMS/+91${cleaned}/${otpCode}/OkeBill+OTP+is+${otpCode}+valid+for+${OTP_EXPIRY_MINUTES}+min`,
                        { signal: AbortSignal.timeout(10000) }
                    );
                    const tfData = await tfResponse.json() as any;
                    if (tfData?.Status !== 'Success') {
                        console.warn('2Factor.in response:', tfData);
                    }
                } catch (smsErr) {
                    console.error('2Factor.in SMS failed:', smsErr);
                }
            } else if (smsProvider === 'msg91') {
                // MSG91 integration
                const msg91AuthKey = process.env.MSG91_AUTH_KEY || '';
                const msg91TemplateId = process.env.MSG91_TEMPLATE_ID || '';
                try {
                    await fetch('https://control.msg91.com/api/v5/flow/', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            authkey: msg91AuthKey,
                        },
                        body: JSON.stringify({
                            template_id: msg91TemplateId,
                            short_url: '0',
                            recipients: [{ mobiles: `91${cleaned}`, otp: otpCode }],
                        }),
                    });
                } catch (smsErr) {
                    console.error('MSG91 SMS failed:', smsErr);
                }
            } else if (smsProvider === 'textlocal') {
                // TextLocal integration
                const tlApiKey = process.env.TEXTLOCAL_API_KEY || '';
                const tlSender = process.env.TEXTLOCAL_SENDER || 'ONEINV';
                try {
                    const params = new URLSearchParams({
                        apikey: tlApiKey,
                        numbers: `91${cleaned}`,
                        message: `Your OkeBill verification code is ${otpCode}. Valid for ${OTP_EXPIRY_MINUTES} minutes. Do not share.`,
                        sender: tlSender,
                    });
                    await fetch('https://api.textlocal.in/send/?' + params.toString());
                } catch (smsErr) {
                    console.error('TextLocal SMS failed:', smsErr);
                }
            } else {
                // Dev mode — log to console
                console.log(`\n🔐 OTP for +91${cleaned}: ${otpCode} (expires in ${OTP_EXPIRY_MINUTES} min)\n`);
            }

            res.json({
                success: true,
                message: `OTP sent to +91${cleaned.slice(0, 2)}****${cleaned.slice(-2)}`,
                expiresInSeconds: OTP_EXPIRY_MINUTES * 60,
            });
        } else {
            res.status(400).json({ message: 'Unsupported OTP type. Only phone is supported.' });
        }
    } catch (err: any) {
        console.error('OTP send error:', err);
        res.status(500).json({ message: err.message });
    }
});

// ─── POST /otp/verify ────────────────────────────────────
router.post('/verify', async (req: AuthRequest, res) => {
    try {
        const userId = req.userId!;
        const { phone, otp, type = 'phone' } = req.body;

        if (!phone || !otp) {
            return res.status(400).json({ message: 'Phone and OTP are required' });
        }

        const cleaned = String(phone).replace(/[\s\-+]/g, '').replace(/^91/, '');

        // Find the latest non-expired, unverified OTP for this phone
        const record = await prisma.otpVerification.findFirst({
            where: {
                userId,
                target: cleaned,
                targetType: type,
                verified: false,
                expiresAt: { gte: new Date() },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!record) {
            return res.status(400).json({
                message: 'OTP expired or not found. Please request a new OTP.',
            });
        }

        // Check max attempts
        if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
            return res.status(429).json({
                message: 'Too many failed attempts. Please request a new OTP.',
            });
        }

        // Increment attempts
        await prisma.otpVerification.update({
            where: { id: record.id },
            data: { attempts: { increment: 1 } },
        });

        // Verify OTP
        if (record.otpCode !== String(otp).trim()) {
            return res.status(400).json({
                message: 'Invalid OTP. Please try again.',
                attemptsRemaining: MAX_VERIFY_ATTEMPTS - record.attempts - 1,
            });
        }

        // Mark as verified
        await prisma.otpVerification.update({
            where: { id: record.id },
            data: { verified: true },
        });

        // Update user's phone verification status
        if (type === 'phone') {
            await prisma.user.update({
                where: { id: userId },
                data: {
                    phone: cleaned,
                    phoneVerified: true,
                },
            });
        }

        res.json({
            success: true,
            message: 'Phone number verified successfully!',
        });
    } catch (err: any) {
        console.error('OTP verify error:', err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
