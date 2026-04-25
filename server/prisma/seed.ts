import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // ─── Demo User ───────────────────────────────────────────
    const passwordHash = await bcrypt.hash('password123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'demo@okebill.com' },
        update: {},
        create: {
            email: 'demo@okebill.com',
            passwordHash,
            firstName: 'Demo',
            lastName: 'User',
            companyName: 'OkeBill Demo',
            role: 'admin',
        },
    });
    console.log(`  ✅ User: ${user.email}`);

    // ─── Demo Clients ───────────────────────────────────────
    const clients = await Promise.all([
        prisma.client.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, userId: user.id, name: 'Acme Energy Solutions', contactEmail: 'billing@acmeenergy.com', phone: '+1-555-1000', address: '100 Energy Plaza, Houston, TX 77002' },
        }),
        prisma.client.upsert({
            where: { id: 2 },
            update: {},
            create: { id: 2, userId: user.id, name: 'Green Power Industries', contactEmail: 'accounts@greenpower.com', phone: '+1-555-2000', address: '200 Renewable Way, Austin, TX 78701' },
        }),
        prisma.client.upsert({
            where: { id: 3 },
            update: {},
            create: { id: 3, userId: user.id, name: 'Metro Utilities Corp', contactEmail: 'finance@metroutilities.com', phone: '+1-555-3000', address: '300 City Center, Dallas, TX 75201' },
        }),
    ]);
    console.log(`  ✅ Clients: ${clients.length}`);

    // ─── Demo Proposals ─────────────────────────────────────
    const proposals = await Promise.all([
        prisma.proposal.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, userId: user.id, clientId: 1, title: 'Annual Energy Supply Contract 2025', status: 'accepted', items: [{ description: 'Monthly energy supply', quantity: 12, unitPrice: 5000 }], total: 60000, validUntil: new Date('2025-06-01') },
        }),
        prisma.proposal.upsert({
            where: { id: 2 },
            update: {},
            create: { id: 2, userId: user.id, clientId: 2, title: 'Solar Power Integration Project', status: 'sent', items: [{ description: 'Solar panel installation', quantity: 1, unitPrice: 150000 }], total: 150000, validUntil: new Date('2025-04-01') },
        }),
        prisma.proposal.upsert({
            where: { id: 3 },
            update: {},
            create: { id: 3, userId: user.id, clientId: 3, title: 'Utility Management Services', status: 'draft', items: [{ description: 'Monthly management fee', quantity: 12, unitPrice: 2500 }], total: 30000 },
        }),
    ]);
    console.log(`  ✅ Proposals: ${proposals.length}`);

    // ─── Demo Contract ──────────────────────────────────────
    const contract = await prisma.contract.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, userId: user.id, clientId: 1, proposalId: 1, title: 'Annual Energy Supply Contract', status: 'active', terms: '12-month contract with auto-renewal', value: 120000, startDate: new Date('2025-01-01'), endDate: new Date('2025-12-31'), billingCycle: 'monthly' },
    });
    console.log(`  ✅ Contract: ${contract.title}`);

    // ─── Demo Invoices ──────────────────────────────────────
    const invoices = await Promise.all([
        prisma.invoice.upsert({
            where: { id: 1 },
            update: {},
            create: { id: 1, userId: user.id, clientId: 1, contractId: 1, invoiceNumber: 'INV-00001', status: 'paid', items: [{ description: 'January 2025 Energy Supply', quantity: 1, unitPrice: 5000 }], subtotal: 5000, taxAmount: 400, total: 5400, dueDate: new Date('2025-02-28'), paidDate: new Date('2025-02-15') },
        }),
        prisma.invoice.upsert({
            where: { id: 2 },
            update: {},
            create: { id: 2, userId: user.id, clientId: 1, contractId: 1, invoiceNumber: 'INV-00002', status: 'pending', items: [{ description: 'February 2025 Energy Supply', quantity: 1, unitPrice: 5000 }], subtotal: 5000, taxAmount: 400, total: 5400, dueDate: new Date('2025-03-31') },
        }),
        prisma.invoice.upsert({
            where: { id: 3 },
            update: {},
            create: { id: 3, userId: user.id, clientId: 2, invoiceNumber: 'INV-00003', status: 'sent', items: [{ description: 'Solar consultation', quantity: 1, unitPrice: 2500 }], subtotal: 2500, taxAmount: 200, total: 2700, dueDate: new Date('2025-04-15') },
        }),
    ]);
    console.log(`  ✅ Invoices: ${invoices.length}`);

    // ─── Demo Payment ───────────────────────────────────────
    const payment = await prisma.payment.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, userId: user.id, invoiceId: 1, amount: 5400, paymentMethod: 'bank_transfer', paymentDate: new Date('2025-02-15'), reference: 'TXN-2025-02-001', status: 'completed' },
    });
    console.log(`  ✅ Payment: $${payment.amount}`);

    // ─── Demo Tenant (Commerce) ─────────────────────────────
    const tenant = await prisma.tenant.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, name: 'Demo Company', subdomain: 'demo', industry: 'retail', currency: 'USD', timezone: 'America/New_York', financialYearStart: new Date('2025-01-01') },
    });
    console.log(`  ✅ Tenant: ${tenant.name}`);

    // ─── Demo Outlet ────────────────────────────────────────
    const outlet = await prisma.outlet.upsert({
        where: { id: 1 },
        update: {},
        create: { id: 1, tenantId: 1, name: 'Main Store', code: 'MAIN001', type: 'store', address: { street: '123 Main Street', city: 'New York', state: 'NY', zip: '10001' }, contactInfo: { phone: '+1-555-0100', email: 'main@demo.company' } },
    });
    console.log(`  ✅ Outlet: ${outlet.name}`);

    // ─── Demo Products ──────────────────────────────────────
    const products = await Promise.all([
        prisma.product.upsert({
            where: { tenantId_sku: { tenantId: 1, sku: 'PROD001' } },
            update: {},
            create: { tenantId: 1, sku: 'PROD001', barcode: '1234567890123', name: 'Wireless Bluetooth Headphones', description: 'Premium wireless headphones', category: 'Electronics', brand: 'AudioMax', unit: 'pcs', pricing: { cost: 25, retail: 49.99, wholesale: 35 }, trackingSettings: { reorderLevel: 10, reorderQuantity: 50 } },
        }),
        prisma.product.upsert({
            where: { tenantId_sku: { tenantId: 1, sku: 'PROD002' } },
            update: {},
            create: { tenantId: 1, sku: 'PROD002', barcode: '1234567890124', name: 'USB-C Charging Cable', description: 'Fast charging cable', category: 'Accessories', brand: 'TechLink', unit: 'pcs', pricing: { cost: 3, retail: 12.99, wholesale: 7 }, trackingSettings: { reorderLevel: 25, reorderQuantity: 100 } },
        }),
        prisma.product.upsert({
            where: { tenantId_sku: { tenantId: 1, sku: 'PROD003' } },
            update: {},
            create: { tenantId: 1, sku: 'PROD003', barcode: '1234567890125', name: 'Laptop Stand', description: 'Ergonomic aluminum stand', category: 'Accessories', brand: 'ErgoTech', unit: 'pcs', pricing: { cost: 15, retail: 39.99, wholesale: 25 }, trackingSettings: { reorderLevel: 5, reorderQuantity: 20 } },
        }),
    ]);
    console.log(`  ✅ Products: ${products.length}`);

    // ─── Demo Inventory ─────────────────────────────────────
    for (const product of products) {
        await prisma.inventory.upsert({
            where: { id: product.id },
            update: {},
            create: { tenantId: 1, productId: product.id, outletId: 1, quantity: 50 + Math.floor(Math.random() * 100), costPrice: Number((product.pricing as any)?.cost || 10), sellingPrice: Number((product.pricing as any)?.retail || 20) },
        });
    }
    console.log(`  ✅ Inventory stocked`);

    // ─── Demo Customers ─────────────────────────────────────
    await Promise.all([
        prisma.customer.upsert({
            where: { tenantId_customerCode: { tenantId: 1, customerCode: 'CUST001' } },
            update: {},
            create: { tenantId: 1, customerCode: 'CUST001', name: 'Walk-in Customer', email: 'walkin@demo.company', phone: '+1-555-0200' },
        }),
        prisma.customer.upsert({
            where: { tenantId_customerCode: { tenantId: 1, customerCode: 'CUST002' } },
            update: {},
            create: { tenantId: 1, customerCode: 'CUST002', name: 'Acme Corporation', email: 'contact@acme.corp', phone: '+1-555-0300', creditLimit: 10000, paymentTerms: 30 },
        }),
    ]);
    console.log(`  ✅ Customers created`);

    // ─── Demo Suppliers ─────────────────────────────────────
    await Promise.all([
        prisma.supplier.upsert({
            where: { tenantId_supplierCode: { tenantId: 1, supplierCode: 'SUPP001' } },
            update: {},
            create: { tenantId: 1, supplierCode: 'SUPP001', name: 'ABC Distributors', email: 'sales@abc.dist', phone: '+1-555-0400', paymentTerms: 30 },
        }),
        prisma.supplier.upsert({
            where: { tenantId_supplierCode: { tenantId: 1, supplierCode: 'SUPP002' } },
            update: {},
            create: { tenantId: 1, supplierCode: 'SUPP002', name: 'XYZ Wholesale', email: 'info@xyz.wholesale', phone: '+1-555-0500', paymentTerms: 15 },
        }),
    ]);
    console.log(`  ✅ Suppliers created`);

    // ─── User Settings ──────────────────────────────────────
    await prisma.userSettings.upsert({
        where: { userId_category: { userId: user.id, category: 'general' } },
        update: {},
        create: { userId: user.id, category: 'general', settings: { companyName: 'OkeBill Demo', currency: 'INR', taxRate: 0.18, paymentTerms: 30, invoicePrefix: 'INV', proposalPrefix: 'PROP' } },
    });
    await prisma.userSettings.upsert({
        where: { userId_category: { userId: user.id, category: 'branding' } },
        update: {},
        create: { userId: user.id, category: 'branding', settings: { primaryColor: '#DC2626', secondaryColor: '#991B1B', accentColor: '#F59E0B' } },
    });
    console.log(`  ✅ Settings configured`);

    console.log('\n🎉 Seeding complete!');
    console.log('   Login: demo@okebill.com / password123');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
