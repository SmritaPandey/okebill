"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../lib/prisma"));
const auth_1 = require("../middleware/auth");
const email_1 = require("../services/email");
const pdf_1 = require("../services/pdf");
const router = (0, express_1.Router)();
router.use(auth_1.authMiddleware);
// ─── Helper: Get company settings ──────────────────────────
async function getCompanyInfo(userId) {
    const user = await prisma_1.default.user.findUnique({ where: { id: userId } });
    const brandingSettings = await prisma_1.default.userSettings.findFirst({
        where: { userId, category: 'branding' },
    });
    const invoiceSettings = await prisma_1.default.userSettings.findFirst({
        where: { userId, category: 'invoices' },
    });
    const branding = brandingSettings?.settings || {};
    const invoiceConfig = invoiceSettings?.settings || {};
    return {
        companyName: user?.companyName || 'OkeBill',
        companyEmail: user?.email,
        companyPhone: user?.phone || undefined,
        companyGstin: user?.gstin || branding.gstin || undefined,
        companyPan: user?.panNumber || branding.pan || undefined,
        companyAddress: branding.address || undefined,
        companyLogo: branding.logo || undefined,
        signatureName: invoiceConfig.signatureName || user?.firstName + ' ' + user?.lastName,
        signatureDesignation: invoiceConfig.signatureDesignation || 'Authorized Signatory',
        termsAndConditions: invoiceConfig.termsAndConditions || undefined,
        bankDetails: {
            accountNo: user?.bankAccountNo || undefined,
            ifsc: user?.bankIfsc || undefined,
            bankName: user?.bankName || undefined,
            branch: user?.bankBranch || undefined,
            upiId: user?.upiId || undefined,
        },
    };
}
// ─── Indian State Codes ────────────────────────────────────
const INDIAN_STATES = {
    '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
    '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
    '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
    '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
    '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
    '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
    '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
    '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
    '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
    '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa',
    '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
    '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana',
    '37': 'Andhra Pradesh (New)', '38': 'Ladakh',
};
// ─── GET /invoices/:id/pdf ──────────────────────────────────
router.get('/invoices/:id/pdf', async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
            include: { client: true, payments: true },
        });
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        const company = await getCompanyInfo(req.userId);
        const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const items = Array.isArray(invoice.items) ? invoice.items.map(item => ({
            description: item.description || 'Item',
            hsnCode: item.hsnCode || item.hsn_code || undefined,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            amount: (item.quantity || 1) * (item.unitPrice || 0),
            taxRate: item.taxRate || 0,
        })) : [];
        const subtotal = Number(invoice.subtotal);
        const taxAmount = Number(invoice.taxAmount);
        const isInter = invoice.supplyType === 'inter';
        const eInvoice = invoice.eInvoiceData || {};
        const pdfBuffer = await (0, pdf_1.generateInvoicePdf)({
            // Company
            companyName: company.companyName,
            companyEmail: company.companyEmail,
            companyAddress: company.companyAddress,
            companyPhone: company.companyPhone,
            companyGstin: company.companyGstin,
            companyPan: company.companyPan,
            companyLogo: company.companyLogo,
            // Client
            clientName: invoice.client.name,
            clientEmail: invoice.client.contactEmail,
            clientAddress: invoice.client.address || undefined,
            clientGstin: invoice.client.gstin || undefined,
            clientStateCode: invoice.client.stateCode || undefined,
            customerId: `CUST-${String(invoice.client.id).padStart(5, '0')}`,
            // Invoice
            invoiceNumber: invoice.invoiceNumber,
            issueDate: new Date(invoice.issueDate).toLocaleDateString('en-IN'),
            dueDate: new Date(invoice.dueDate).toLocaleDateString('en-IN'),
            status: invoice.status,
            // Items
            items,
            // Totals
            subtotal,
            taxAmount,
            cgst: isInter ? undefined : taxAmount / 2,
            sgst: isInter ? undefined : taxAmount / 2,
            igst: isInter ? taxAmount : undefined,
            total: Number(invoice.total),
            amountPaid: totalPaid,
            balanceRemaining: Number(invoice.total) - totalPaid,
            // GST
            placeOfSupply: invoice.placeOfSupply || undefined,
            placeOfSupplyName: invoice.placeOfSupply ? INDIAN_STATES[invoice.placeOfSupply] || '' : undefined,
            supplyType: invoice.supplyType || 'intra',
            reverseCharge: false,
            irn: invoice.irn || undefined,
            ackNo: eInvoice.ackNo || undefined,
            ackDate: eInvoice.ackDate || undefined,
            // E-Way Bill
            ewayBillNumber: invoice.ewayBillNumber || undefined,
            transportMode: invoice.transportMode || undefined,
            vehicleNumber: invoice.vehicleNumber || undefined,
            transporterName: invoice.transporterName || undefined,
            transporterGstin: invoice.transporterGstin || undefined,
            distanceKm: invoice.distanceKm || undefined,
            // Extra
            notes: invoice.notes || undefined,
            termsAndConditions: company.termsAndConditions,
            signatureName: company.signatureName,
            signatureDesignation: company.signatureDesignation,
            bankDetails: company.bankDetails,
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── POST /invoices/:id/send ────────────────────────────────
router.post('/invoices/:id/send', async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
            include: { client: true, payments: true },
        });
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        const company = await getCompanyInfo(req.userId);
        const items = Array.isArray(invoice.items) ? invoice.items.map(item => ({
            description: item.description || 'Item',
            hsnCode: item.hsnCode || item.hsn_code || undefined,
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            amount: (item.quantity || 1) * (item.unitPrice || 0),
            taxRate: item.taxRate || 0,
        })) : [];
        // Generate PDF attachment
        const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const subtotal = Number(invoice.subtotal);
        const taxAmount = Number(invoice.taxAmount);
        const isInter = invoice.supplyType === 'inter';
        let pdfBuffer;
        try {
            pdfBuffer = await (0, pdf_1.generateInvoicePdf)({
                companyName: company.companyName,
                companyEmail: company.companyEmail,
                companyAddress: company.companyAddress,
                companyGstin: company.companyGstin,
                companyPan: company.companyPan,
                clientName: invoice.client.name,
                clientEmail: invoice.client.contactEmail,
                clientAddress: invoice.client.address || undefined,
                clientGstin: invoice.client.gstin || undefined,
                customerId: `CUST-${String(invoice.client.id).padStart(5, '0')}`,
                invoiceNumber: invoice.invoiceNumber,
                issueDate: new Date(invoice.issueDate).toLocaleDateString('en-IN'),
                dueDate: new Date(invoice.dueDate).toLocaleDateString('en-IN'),
                status: invoice.status,
                items,
                subtotal,
                taxAmount,
                cgst: isInter ? undefined : taxAmount / 2,
                sgst: isInter ? undefined : taxAmount / 2,
                igst: isInter ? taxAmount : undefined,
                total: Number(invoice.total),
                amountPaid: totalPaid,
                balanceRemaining: Number(invoice.total) - totalPaid,
                placeOfSupply: invoice.placeOfSupply || undefined,
                supplyType: invoice.supplyType || 'intra',
                notes: invoice.notes || undefined,
                bankDetails: company.bankDetails,
                signatureName: company.signatureName,
            });
        }
        catch { /* PDF generation optional */ }
        if (!(0, email_1.isEmailConfigured)()) {
            await prisma_1.default.emailLog.create({
                data: {
                    userId: req.userId,
                    toEmail: invoice.client.contactEmail,
                    subject: `Invoice ${invoice.invoiceNumber}`,
                    entityType: 'invoice',
                    entityId: invoice.id,
                    status: 'skipped_no_smtp',
                },
            });
            await prisma_1.default.invoice.update({ where: { id: invoice.id }, data: { status: 'sent' } });
            res.json({
                success: true,
                message: 'Invoice marked as sent (email not configured — set SMTP_USER and SMTP_PASS in .env)',
                emailSent: false,
            });
            return;
        }
        await (0, email_1.sendInvoiceEmail)({
            to: invoice.client.contactEmail,
            clientName: invoice.client.name,
            companyName: company.companyName,
            invoiceNumber: invoice.invoiceNumber,
            issueDate: new Date(invoice.issueDate).toLocaleDateString('en-IN'),
            dueDate: new Date(invoice.dueDate).toLocaleDateString('en-IN'),
            subtotal: Number(invoice.subtotal),
            tax: Number(invoice.taxAmount),
            total: Number(invoice.total),
            items,
            pdfBuffer,
        });
        await prisma_1.default.emailLog.create({
            data: {
                userId: req.userId,
                toEmail: invoice.client.contactEmail,
                subject: `Invoice ${invoice.invoiceNumber}`,
                entityType: 'invoice',
                entityId: invoice.id,
                status: 'sent',
            },
        });
        await prisma_1.default.invoice.update({ where: { id: invoice.id }, data: { status: 'sent' } });
        res.json({ success: true, message: 'Invoice sent to client', emailSent: true });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── POST /invoices/:id/remind ──────────────────────────────
router.post('/invoices/:id/remind', async (req, res) => {
    try {
        const invoice = await prisma_1.default.invoice.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
            include: { client: true, payments: true },
        });
        if (!invoice) {
            res.status(404).json({ message: 'Invoice not found' });
            return;
        }
        const company = await getCompanyInfo(req.userId);
        const totalPaid = invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const balanceRemaining = Number(invoice.total) - totalPaid;
        const daysOverdue = Math.max(0, Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / 86400000));
        if (!(0, email_1.isEmailConfigured)()) {
            await prisma_1.default.emailLog.create({
                data: {
                    userId: req.userId,
                    toEmail: invoice.client.contactEmail,
                    subject: `Payment Reminder: ${invoice.invoiceNumber}`,
                    entityType: 'reminder',
                    entityId: invoice.id,
                    status: 'skipped_no_smtp',
                },
            });
            res.json({
                success: true,
                message: 'Reminder logged (email not configured — set SMTP_USER and SMTP_PASS in .env)',
                emailSent: false,
                daysOverdue,
                balanceRemaining,
            });
            return;
        }
        await (0, email_1.sendPaymentReminderEmail)({
            to: invoice.client.contactEmail,
            clientName: invoice.client.name,
            companyName: company.companyName,
            invoiceNumber: invoice.invoiceNumber,
            dueDate: new Date(invoice.dueDate).toLocaleDateString('en-IN'),
            total: Number(invoice.total),
            balanceRemaining,
            daysOverdue,
        });
        await prisma_1.default.emailLog.create({
            data: {
                userId: req.userId,
                toEmail: invoice.client.contactEmail,
                subject: `Payment Reminder: ${invoice.invoiceNumber}`,
                entityType: 'reminder',
                entityId: invoice.id,
                status: 'sent',
            },
        });
        res.json({ success: true, message: 'Reminder sent', emailSent: true, daysOverdue });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// ─── GET /proposals/:id/pdf ─────────────────────────────────
router.get('/proposals/:id/pdf', async (req, res) => {
    try {
        const proposal = await prisma_1.default.proposal.findFirst({
            where: { id: Number(req.params.id), userId: req.userId },
            include: { client: true },
        });
        if (!proposal) {
            res.status(404).json({ message: 'Proposal not found' });
            return;
        }
        const company = await getCompanyInfo(req.userId);
        const items = Array.isArray(proposal.items) ? proposal.items.map(item => ({
            description: item.description || 'Item',
            quantity: item.quantity || 1,
            unitPrice: item.unitPrice || 0,
            amount: (item.quantity || 1) * (item.unitPrice || 0),
        })) : [];
        const pdfBuffer = await (0, pdf_1.generateProposalPdf)({
            companyName: company.companyName,
            title: proposal.title,
            clientName: proposal.client.name,
            clientEmail: proposal.client.contactEmail,
            validUntil: proposal.validUntil ? new Date(proposal.validUntil).toLocaleDateString('en-IN') : undefined,
            items,
            total: Number(proposal.total),
            notes: proposal.notes || undefined,
            createdAt: new Date(proposal.createdAt).toLocaleDateString('en-IN'),
        });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="Proposal-${proposal.id}.pdf"`);
        res.send(pdfBuffer);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=documents.js.map