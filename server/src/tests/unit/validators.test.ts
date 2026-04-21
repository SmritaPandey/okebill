/**
 * Unit Tests — Validators
 * Tests PAN, phone, GSTIN regex and phone cleaning from auth.ts
 */
import { describe, it, expect } from 'vitest';

// Recreate validators from auth.ts for unit testing
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const TAN_REGEX = /^[A-Z]{4}[0-9]{5}[A-Z]$/;
const CIN_REGEX = /^[UL][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
const LLPIN_REGEX = /^[A-Z]{3}-[0-9]{4}$/;
const UDYAM_REGEX = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/;
const FSSAI_REGEX = /^\d{14}$/;
const IEC_REGEX = /^[A-Z0-9]{10}$/;

function cleanPhone(phone: string): string {
    return phone.replace(/[\s\-+]/g, '').replace(/^91/, '');
}

function generateOtp(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
}

describe('PAN Validation', () => {
    const validPANs = ['ABCDE1234F', 'ZZZZZ9999Z', 'AAPCS1234K', 'BQRPG5678H'];
    const invalidPANs = [
        'ABCDE1234',   // too short
        'ABCDE12345F', // too long
        '12345ABCDF',  // starts with numbers
        'abcde1234f',  // lowercase
        'ABCDE1234',   // missing last letter
        'A1CDE1234F',  // number in first 5
        '',             // empty
        'ABCDEFFFFZ',  // letters where digits should be
    ];

    it.each(validPANs)('should accept valid PAN: %s', (pan) => {
        expect(PAN_REGEX.test(pan)).toBe(true);
    });

    it.each(invalidPANs)('should reject invalid PAN: "%s"', (pan) => {
        expect(PAN_REGEX.test(pan)).toBe(false);
    });
});

describe('Indian Phone Number Validation', () => {
    const validPhones = ['9876543210', '7890123456', '8888888888', '6000000000'];
    const invalidPhones = [
        '0876543210',    // starts with 0
        '1234567890',    // starts with 1
        '5876543210',    // starts with 5
        '987654321',     // only 9 digits
        '98765432100',   // 11 digits
        '',              // empty
        'abcdefghij',    // letters
        '+919876543210', // with country code (needs cleaning first)
    ];

    it.each(validPhones)('should accept valid phone: %s', (phone) => {
        expect(INDIAN_PHONE_REGEX.test(phone)).toBe(true);
    });

    it.each(invalidPhones)('should reject invalid phone: "%s"', (phone) => {
        expect(INDIAN_PHONE_REGEX.test(phone)).toBe(false);
    });
});

describe('GSTIN Validation', () => {
    const validGSTINs = ['22AAAAA0000A1Z5', '27AAPCS1234K1ZG', '06BZAHM6385P6Z2'];
    const invalidGSTINs = [
        '22AAAAA0000A1Z',   // too short (14)
        '22AAAAA0000A1Z55', // too long (16)
        '',                  // empty
        'ABCDE12344566788',  // wrong format
        '00AAAAA0000A0Z5',   // 0 in position 13 (must be 1-9/A-Z)
    ];

    it.each(validGSTINs)('should accept valid GSTIN: %s', (gstin) => {
        expect(GSTIN_REGEX.test(gstin)).toBe(true);
    });

    it.each(invalidGSTINs)('should reject invalid GSTIN: "%s"', (gstin) => {
        expect(GSTIN_REGEX.test(gstin)).toBe(false);
    });
});

describe('TAN Validation', () => {
    const valid = ['MUMH12345E', 'DELH99999A', 'CHNS00001Z'];
    const invalid = ['MUMH1234E', 'MUMH123456E', 'mumh12345e', '1234567890', ''];

    it.each(valid)('should accept valid TAN: %s', (tan) => {
        expect(TAN_REGEX.test(tan)).toBe(true);
    });
    it.each(invalid)('should reject invalid TAN: "%s"', (tan) => {
        expect(TAN_REGEX.test(tan)).toBe(false);
    });
});

describe('CIN Validation', () => {
    const valid = ['U74110MH2017PTC123456', 'L21091KA1946PLC020800'];
    const invalid = ['X74110MH2017PTC123456', 'U74110MH2017PTC12345', '', 'random-string'];

    it.each(valid)('should accept valid CIN: %s', (cin) => {
        expect(CIN_REGEX.test(cin)).toBe(true);
    });
    it.each(invalid)('should reject invalid CIN: "%s"', (cin) => {
        expect(CIN_REGEX.test(cin)).toBe(false);
    });
});

describe('LLPIN Validation', () => {
    const valid = ['AAA-1234', 'XYZ-9999'];
    const invalid = ['AAA1234', 'AA-1234', 'AAAA-1234', '', 'aaa-1234'];

    it.each(valid)('should accept valid LLPIN: %s', (llpin) => {
        expect(LLPIN_REGEX.test(llpin)).toBe(true);
    });
    it.each(invalid)('should reject invalid LLPIN: "%s"', (llpin) => {
        expect(LLPIN_REGEX.test(llpin)).toBe(false);
    });
});

describe('UDYAM/MSME Registration Validation', () => {
    const valid = ['UDYAM-MH-02-1234567', 'UDYAM-DL-01-0000001'];
    const invalid = ['UDYAM-MH-2-1234567', 'UDYAM-M-02-1234567', 'udyam-mh-02-1234567', '', 'MSME12345'];

    it.each(valid)('should accept valid UDYAM: %s', (u) => {
        expect(UDYAM_REGEX.test(u)).toBe(true);
    });
    it.each(invalid)('should reject invalid UDYAM: "%s"', (u) => {
        expect(UDYAM_REGEX.test(u)).toBe(false);
    });
});

describe('FSSAI License Validation', () => {
    const valid = ['12345678901234', '10020011000123'];
    const invalid = ['1234567890123', '123456789012345', '', 'ABCDEF12345678'];

    it.each(valid)('should accept valid FSSAI: %s', (f) => {
        expect(FSSAI_REGEX.test(f)).toBe(true);
    });
    it.each(invalid)('should reject invalid FSSAI: "%s"', (f) => {
        expect(FSSAI_REGEX.test(f)).toBe(false);
    });
});

describe('IEC (Import Export Code) Validation', () => {
    const valid = ['ABCDE1234F', '0123456789', 'AAPCS1234K'];
    const invalid = ['ABCDE1234', 'ABCDE12345F', '', 'abcde1234f'];

    it.each(valid)('should accept valid IEC: %s', (iec) => {
        expect(IEC_REGEX.test(iec)).toBe(true);
    });
    it.each(invalid)('should reject invalid IEC: "%s"', (iec) => {
        expect(IEC_REGEX.test(iec)).toBe(false);
    });
});

describe('Phone Cleaning Function', () => {
    it('strips +91 prefix', () => {
        expect(cleanPhone('+919876543210')).toBe('9876543210');
    });

    it('strips 91 prefix', () => {
        expect(cleanPhone('919876543210')).toBe('9876543210');
    });

    it('strips spaces and hyphens', () => {
        expect(cleanPhone('98765 432-10')).toBe('9876543210');
    });

    it('strips +91 with spaces', () => {
        expect(cleanPhone('+91 98765 43210')).toBe('9876543210');
    });

    it('handles clean input unchanged', () => {
        expect(cleanPhone('9876543210')).toBe('9876543210');
    });

    it('handles empty string', () => {
        expect(cleanPhone('')).toBe('');
    });
});

describe('OTP Generation', () => {
    it('generates a 6-digit numeric string', () => {
        for (let i = 0; i < 100; i++) {
            const otp = generateOtp();
            expect(otp).toHaveLength(6);
            expect(otp).toMatch(/^\d{6}$/);
        }
    });

    it('generates different OTPs (not deterministic)', () => {
        const otps = new Set<string>();
        for (let i = 0; i < 50; i++) {
            otps.add(generateOtp());
        }
        // Should have at least 10 unique values out of 50
        expect(otps.size).toBeGreaterThan(10);
    });

    it('OTP is always between 100000 and 999999', () => {
        for (let i = 0; i < 100; i++) {
            const otp = parseInt(generateOtp(), 10);
            expect(otp).toBeGreaterThanOrEqual(100000);
            expect(otp).toBeLessThanOrEqual(999999);
        }
    });
});
