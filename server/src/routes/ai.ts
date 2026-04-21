import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// ─── Deep Billing Context Builder ───────────────────────────
async function getBillingContext(userId: number) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 86400000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 86400000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
        clients,
        allInvoices,
        paymentsThisMonth,
        paymentsLastMonth,
        allPayments,
        proposals,
        contracts,
        recentPayments,
        emailLogs,
    ] = await Promise.all([
        prisma.client.findMany({ where: { userId }, select: { id: true, name: true, contactEmail: true, phone: true, address: true, createdAt: true } }),
        prisma.invoice.findMany({
            where: { userId },
            select: { id: true, invoiceNumber: true, clientId: true, status: true, total: true, subtotal: true, taxAmount: true, dueDate: true, paidDate: true, issueDate: true, items: true, notes: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 200,
        }),
        prisma.payment.aggregate({ where: { userId, paymentDate: { gte: startOfMonth } }, _sum: { amount: true }, _count: true }),
        prisma.payment.aggregate({ where: { userId, paymentDate: { gte: startOfLastMonth, lte: endOfLastMonth } }, _sum: { amount: true }, _count: true }),
        prisma.payment.aggregate({ where: { userId }, _sum: { amount: true }, _count: true }),
        prisma.proposal.findMany({
            where: { userId },
            select: { id: true, title: true, clientId: true, status: true, total: true, validUntil: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        }),
        prisma.contract.findMany({
            where: { userId },
            select: { id: true, title: true, clientId: true, status: true, value: true, startDate: true, endDate: true, billingCycle: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        }),
        prisma.payment.findMany({
            where: { userId },
            orderBy: { paymentDate: 'desc' },
            take: 10,
            select: { id: true, invoiceId: true, amount: true, paymentMethod: true, paymentDate: true, reference: true },
        }),
        prisma.emailLog.findMany({
            where: { userId },
            orderBy: { sentAt: 'desc' },
            take: 20,
            select: { id: true, toEmail: true, subject: true, entityType: true, status: true, sentAt: true },
        }),
    ]);

    // Derived analytics
    const overdueInvoices = allInvoices.filter(i => i.status === 'overdue');
    const unpaidInvoices = allInvoices.filter(i => ['sent', 'overdue', 'draft'].includes(i.status));
    const paidInvoices = allInvoices.filter(i => i.status === 'paid');
    const draftInvoices = allInvoices.filter(i => i.status === 'draft');
    const sentInvoices = allInvoices.filter(i => i.status === 'sent');
    const cancelledInvoices = allInvoices.filter(i => i.status === 'cancelled');

    const totalOutstanding = unpaidInvoices.reduce((sum, i) => sum + Number(i.total), 0);
    const totalRevenue = Number(allPayments._sum.amount || 0);
    const revenueThisMonth = Number(paymentsThisMonth._sum.amount || 0);
    const revenueLastMonth = Number(paymentsLastMonth._sum.amount || 0);
    const revenueGrowth = revenueLastMonth > 0 ? (((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1) : 'N/A';

    const invoicesThisMonth = allInvoices.filter(i => new Date(i.createdAt) >= startOfMonth).length;
    const invoicesLastMonth = allInvoices.filter(i => new Date(i.createdAt) >= startOfLastMonth && new Date(i.createdAt) <= endOfLastMonth).length;

    // Average payment time
    const paymentTimes = paidInvoices
        .filter(i => i.paidDate && i.issueDate)
        .map(i => (new Date(i.paidDate!).getTime() - new Date(i.issueDate).getTime()) / 86400000);
    const avgPaymentDays = paymentTimes.length > 0 ? (paymentTimes.reduce((a, b) => a + b, 0) / paymentTimes.length).toFixed(0) : 'N/A';

    // Client revenue ranking
    const clientRevenue: Record<number, number> = {};
    paidInvoices.forEach(i => {
        clientRevenue[i.clientId] = (clientRevenue[i.clientId] || 0) + Number(i.total);
    });
    const topClients = Object.entries(clientRevenue)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([clientId, revenue]) => ({
            name: clients.find(c => c.id === Number(clientId))?.name || 'Unknown',
            revenue: revenue.toFixed(2),
        }));

    // Client outstanding
    const clientOutstanding: Record<number, number> = {};
    unpaidInvoices.forEach(i => {
        clientOutstanding[i.clientId] = (clientOutstanding[i.clientId] || 0) + Number(i.total);
    });
    const topOwing = Object.entries(clientOutstanding)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([clientId, amount]) => ({
            name: clients.find(c => c.id === Number(clientId))?.name || 'Unknown',
            outstanding: amount.toFixed(2),
            overdueCount: overdueInvoices.filter(i => i.clientId === Number(clientId)).length,
        }));

    // Aging analysis
    const aging = {
        current: unpaidInvoices.filter(i => new Date(i.dueDate) >= now).reduce((s, i) => s + Number(i.total), 0),
        days1to30: unpaidInvoices.filter(i => { const d = new Date(i.dueDate); return d < now && d >= thirtyDaysAgo; }).reduce((s, i) => s + Number(i.total), 0),
        days31to60: unpaidInvoices.filter(i => { const d = new Date(i.dueDate); return d < thirtyDaysAgo && d >= sixtyDaysAgo; }).reduce((s, i) => s + Number(i.total), 0),
        days61to90: unpaidInvoices.filter(i => { const d = new Date(i.dueDate); return d < sixtyDaysAgo && d >= ninetyDaysAgo; }).reduce((s, i) => s + Number(i.total), 0),
        over90: unpaidInvoices.filter(i => new Date(i.dueDate) < ninetyDaysAgo).reduce((s, i) => s + Number(i.total), 0),
    };

    // Proposals analysis
    const activeProposals = proposals.filter(p => p.status === 'draft' || p.status === 'sent');
    const acceptedProposals = proposals.filter(p => p.status === 'accepted');
    const rejectedProposals = proposals.filter(p => p.status === 'rejected');
    const proposalConversionRate = (acceptedProposals.length + rejectedProposals.length) > 0
        ? ((acceptedProposals.length / (acceptedProposals.length + rejectedProposals.length)) * 100).toFixed(0)
        : 'N/A';
    const proposalPipeline = activeProposals.reduce((s, p) => s + Number(p.total), 0);

    // Contracts analysis
    const activeContracts = contracts.filter(c => c.status === 'active');
    const expiringContracts = activeContracts.filter(c => c.endDate && new Date(c.endDate).getTime() - now.getTime() < 30 * 86400000);
    const totalContractValue = activeContracts.reduce((s, c) => s + Number(c.value), 0);

    return {
        summary: {
            totalClients: clients.length,
            totalInvoices: allInvoices.length,
            overdueCount: overdueInvoices.length,
            unpaidCount: unpaidInvoices.length,
            draftCount: draftInvoices.length,
            sentCount: sentInvoices.length,
            paidCount: paidInvoices.length,
            cancelledCount: cancelledInvoices.length,
            totalOutstanding: totalOutstanding.toFixed(2),
            totalRevenue: totalRevenue.toFixed(2),
            revenueThisMonth: revenueThisMonth.toFixed(2),
            revenueLastMonth: revenueLastMonth.toFixed(2),
            revenueGrowth,
            paymentsThisMonth: paymentsThisMonth._count,
            invoicesThisMonth,
            invoicesLastMonth,
            avgPaymentDays,
            totalPayments: allPayments._count,
            proposalCount: proposals.length,
            activeProposalCount: activeProposals.length,
            proposalConversionRate,
            proposalPipeline: proposalPipeline.toFixed(2),
            contractCount: contracts.length,
            activeContractCount: activeContracts.length,
            expiringContractCount: expiringContracts.length,
            totalContractValue: totalContractValue.toFixed(2),
        },
        clients,
        overdueInvoices: overdueInvoices.map(i => ({
            ...i,
            clientName: clients.find(c => c.id === i.clientId)?.name || 'Unknown',
            total: Number(i.total).toFixed(2),
            dueDate: new Date(i.dueDate).toLocaleDateString(),
            daysOverdue: Math.floor((now.getTime() - new Date(i.dueDate).getTime()) / 86400000),
        })),
        recentInvoices: allInvoices.slice(0, 15).map(i => ({
            ...i,
            clientName: clients.find(c => c.id === i.clientId)?.name || 'Unknown',
            total: Number(i.total).toFixed(2),
        })),
        proposals: proposals.slice(0, 10).map(p => ({
            ...p,
            clientName: clients.find(c => c.id === p.clientId)?.name || 'Unknown',
            total: Number(p.total).toFixed(2),
        })),
        contracts: contracts.slice(0, 10).map(c => ({
            ...c,
            clientName: clients.find(c2 => c2.id === c.clientId)?.name || 'Unknown',
            value: Number(c.value).toFixed(2),
        })),
        expiringContracts: expiringContracts.map(c => ({
            ...c,
            clientName: clients.find(c2 => c2.id === c.clientId)?.name || 'Unknown',
            value: Number(c.value).toFixed(2),
            daysUntilExpiry: c.endDate ? Math.floor((new Date(c.endDate).getTime() - now.getTime()) / 86400000) : null,
        })),
        topClients,
        topOwing,
        aging,
        recentPayments: recentPayments.map(p => ({
            ...p,
            amount: Number(p.amount).toFixed(2),
            paymentDate: new Date(p.paymentDate).toLocaleDateString(),
        })),
        recentEmails: emailLogs.slice(0, 5).map(e => ({
            to: e.toEmail,
            subject: e.subject,
            status: e.status,
            date: new Date(e.sentAt).toLocaleDateString(),
        })),
    };
}

// ─── Comprehensive System Prompt ────────────────────────────
function buildSystemPrompt(context: any, userName: string) {
    return `You are the AI Billing Assistant for **OkBill**, a comprehensive GST-compliant billing and invoicing platform built for Indian businesses. You serve as a smart, proactive financial advisor for ${userName}.

═══════════════════════════════════════════
  REAL-TIME BILLING DATA (LIVE FROM DATABASE)
═══════════════════════════════════════════

📊 FINANCIAL OVERVIEW:
• Total Revenue (all time): $${context.summary.totalRevenue}
• Revenue This Month: $${context.summary.revenueThisMonth}
• Revenue Last Month: $${context.summary.revenueLastMonth}
• Revenue Growth: ${context.summary.revenueGrowth}%
• Total Outstanding: $${context.summary.totalOutstanding}
• Average Payment Time: ${context.summary.avgPaymentDays} days

📋 INVOICE BREAKDOWN:
• Total Invoices: ${context.summary.totalInvoices}
• Draft: ${context.summary.draftCount}
• Sent (awaiting payment): ${context.summary.sentCount}
• Overdue: ${context.summary.overdueCount}
• Paid: ${context.summary.paidCount}
• Cancelled: ${context.summary.cancelledCount}
• Invoices This Month: ${context.summary.invoicesThisMonth}

🏦 ACCOUNTS RECEIVABLE AGING:
• Current (not yet due): $${context.aging.current.toFixed(2)}
• 1-30 days overdue: $${context.aging.days1to30.toFixed(2)}
• 31-60 days overdue: $${context.aging.days31to60.toFixed(2)}
• 61-90 days overdue: $${context.aging.days61to90.toFixed(2)}
• 90+ days overdue: $${context.aging.over90.toFixed(2)}

💳 PAYMENTS:
• Total Payments: ${context.summary.totalPayments}
• Payments This Month: ${context.summary.paymentsThisMonth}

👤 CLIENTS (${context.summary.totalClients} total):
${context.clients.map((c: any) => `• ${c.name} — ${c.contactEmail}${c.phone ? `, ${c.phone}` : ''}${c.address ? ` (${c.address})` : ''}`).join('\n')}

🏆 TOP CLIENTS BY REVENUE:
${context.topClients.length > 0 ? context.topClients.map((c: any) => `• ${c.name}: $${c.revenue}`).join('\n') : '• No payments recorded yet'}

⚠️ TOP CLIENTS BY OUTSTANDING BALANCE:
${context.topOwing.length > 0 ? context.topOwing.map((c: any) => `• ${c.name}: $${c.outstanding} outstanding${c.overdueCount > 0 ? ` (${c.overdueCount} overdue)` : ''}`).join('\n') : '• All clear!'}

🔴 OVERDUE INVOICES:
${context.overdueInvoices.length > 0
            ? context.overdueInvoices.map((i: any) => `• ${i.invoiceNumber}: $${i.total} from ${i.clientName} — ${i.daysOverdue} days overdue (due ${i.dueDate})`).join('\n')
            : '• None! All invoices are on track.'}

📄 RECENT INVOICES:
${context.recentInvoices.map((i: any) => `• ${i.invoiceNumber}: $${i.total} → ${i.clientName} [${i.status}]`).join('\n')}

📝 PROPOSALS (${context.summary.proposalCount} total, ${context.summary.activeProposalCount} active):
• Conversion Rate: ${context.summary.proposalConversionRate}%
• Pipeline Value: $${context.summary.proposalPipeline}
${context.proposals.map((p: any) => `• "${p.title}" → ${p.clientName}: $${p.total} [${p.status}]`).join('\n')}

📜 CONTRACTS (${context.summary.contractCount} total, ${context.summary.activeContractCount} active):
• Total Active Value: $${context.summary.totalContractValue}
• Expiring Soon (30 days): ${context.summary.expiringContractCount}
${context.contracts.map((c: any) => `• "${c.title}" → ${c.clientName}: $${c.value} [${c.status}]`).join('\n')}

${context.expiringContracts.length > 0 ? `🔶 CONTRACTS EXPIRING SOON:\n${context.expiringContracts.map((c: any) => `• "${c.title}" → ${c.clientName}: expires in ${c.daysUntilExpiry} days`).join('\n')}` : ''}

💰 RECENT PAYMENTS:
${context.recentPayments.map((p: any) => `• $${p.amount} via ${p.paymentMethod} on ${p.paymentDate} (Ref: ${p.reference || 'N/A'})`).join('\n') || '• No recent payments'}

📧 RECENT EMAIL ACTIVITY:
${context.recentEmails.map((e: any) => `• ${e.subject} → ${e.to} [${e.status}] on ${e.date}`).join('\n') || '• No emails sent yet'}

═══════════════════════════════════════════
  YOUR CAPABILITIES & KNOWLEDGE
═══════════════════════════════════════════

You are an expert in:
1. **Invoice Management** — Creating, editing (draft only), sending, tracking, marking as paid/cancelled, downloading PDFs, generating credit notes
2. **Payment Processing** — Recording full & partial payments, tracking balances, generating receipts, overpayment protection
3. **Proposal Management** — Creating proposals, tracking status (draft/sent/accepted/rejected), converting to contracts
4. **Contract Management** — Creating from proposals, editing, renewing, tracking expiry
5. **Client Management** — Adding clients, viewing history, tracking outstanding balances per client
6. **Email Automation** — Sending invoices to clients, payment reminders (with urgency levels), payment receipts
7. **PDF Generation** — Professional invoice and proposal PDFs with branding
8. **Financial Analytics** — Revenue reports, accounts receivable aging, payment trends, client rankings, growth metrics
9. **Billing Best Practices** — Payment terms advice, follow-up strategies, cash flow optimization

═══════════════════════════════════════════
  RESPONSE GUIDELINES
═══════════════════════════════════════════

FORMAT:
• Use clear formatting with **bold** for emphasis and bullet points for lists
• Use emoji sparingly but effectively (📊📋⚠️✅💰📧🔴)
• Be concise but thorough — answer the exact question, then offer relevant follow-ups
• For numbers, always format as currency ($X,XXX.XX) or percentages
• When showing multiple items, use ordered or bulleted lists

TONE:
• Professional yet friendly — like a knowledgeable financial advisor
• Proactive — suggest actions the user should take based on the data
• Be specific — reference actual invoice numbers, client names, and amounts
• Acknowledge issues honestly and suggest solutions

ACTIONS:
When you recommend actions, include action blocks:
\`\`\`action
{"type": "createInvoice", "data": {"clientId": 1, "items": [{"description": "...", "quantity": 1, "unitPrice": 100}], "dueDate": "2026-03-15"}}
\`\`\`
\`\`\`action
{"type": "sendReminder", "data": {"invoiceId": 1}}
\`\`\`
\`\`\`action
{"type": "sendInvoice", "data": {"invoiceId": 1}}
\`\`\`
\`\`\`action
{"type": "viewInvoices", "data": {"status": "overdue"}}
\`\`\`
\`\`\`action
{"type": "recordPayment", "data": {"invoiceId": 1, "amount": 500}}
\`\`\`
\`\`\`action
{"type": "createProposal", "data": {"clientId": 1, "title": "...", "items": [...]}}
\`\`\`
\`\`\`action
{"type": "downloadPdf", "data": {"invoiceId": 1}}
\`\`\`
\`\`\`action
{"type": "navigate", "data": {"page": "/invoices"}}
\`\`\`

PROACTIVE INSIGHTS:
Always end responses with a relevant insight or suggestion based on the data, such as:
- Warning about overdue invoices that need attention
- Contracts expiring soon that need renewal
- Revenue trends
- Suggestions to follow up on unpaid invoices
- Cash flow observations`;
}

// ─── Chat Endpoint ──────────────────────────────────────────
router.post('/chat', async (req: AuthRequest, res) => {
    try {
        const { message, conversationHistory = [] } = req.body;
        if (!message) {
            res.status(400).json({ message: 'Message is required' });
            return;
        }

        const user = await prisma.user.findUnique({ where: { id: req.userId } });
        if (!user) { res.status(401).json({ message: 'User not found' }); return; }

        const context = await getBillingContext(req.userId!);
        const systemPrompt = buildSystemPrompt(context, `${user.firstName} ${user.lastName}`);

        // Save user message
        await prisma.aiChatMessage.create({
            data: { userId: req.userId!, role: 'user', content: message },
        });

        const apiKey = process.env.GEMINI_API_KEY;
        let assistantMessage: string;

        if (apiKey) {
            try {
                const { GoogleGenerativeAI } = await import('@google/generative-ai');
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

                const chatHistory = [
                    { role: 'user' as const, parts: [{ text: systemPrompt + '\n\nAcknowledge you understand and are ready.' }] },
                    { role: 'model' as const, parts: [{ text: `Understood! I'm your OkBill billing assistant for ${user.firstName}. I have full real-time access to your billing data. How can I help you today?` }] },
                    ...conversationHistory.map((msg: any) => ({
                        role: msg.role === 'assistant' ? 'model' as const : 'user' as const,
                        parts: [{ text: msg.content }],
                    })),
                ];

                const chat = model.startChat({ history: chatHistory });
                const result = await chat.sendMessage(message);
                assistantMessage = result.response.text();
            } catch (aiErr: any) {
                console.error('Gemini API error:', aiErr.message);
                assistantMessage = generateFallbackResponse(message, context);
            }
        } else {
            assistantMessage = generateFallbackResponse(message, context);
        }

        // Parse actions
        const actionMatch = assistantMessage.match(/```action\n([\s\S]*?)\n```/);
        let action = null;
        if (actionMatch) {
            try { action = JSON.parse(actionMatch[1]); } catch { /* ignore */ }
        }

        // Save assistant message
        await prisma.aiChatMessage.create({
            data: {
                userId: req.userId!,
                role: 'assistant',
                content: assistantMessage,
                action: action || undefined,
            },
        });

        res.json({
            message: assistantMessage,
            action,
            context: {
                overdueCount: context.summary.overdueCount,
                totalOutstanding: context.summary.totalOutstanding,
                revenueThisMonth: context.summary.revenueThisMonth,
            },
        });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── Comprehensive Smart Fallback ───────────────────────────
function generateFallbackResponse(message: string, context: any): string {
    const lower = message.toLowerCase().trim();

    // ── Greetings ─────────────────────────────────────────
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy|sup|what's up)\b/.test(lower)) {
        let greeting = `👋 Hello! I'm your OkBill billing assistant. Here's a quick snapshot of your billing:\n\n`;
        greeting += `📊 **Quick Overview:**\n`;
        greeting += `• Revenue this month: **$${context.summary.revenueThisMonth}**\n`;
        greeting += `• Outstanding: **$${context.summary.totalOutstanding}**\n`;
        greeting += `• Invoices: ${context.summary.totalInvoices} total (${context.summary.overdueCount} overdue)\n`;
        greeting += `• Clients: ${context.summary.totalClients}\n\n`;

        if (context.summary.overdueCount > 0) {
            greeting += `⚠️ **Heads up:** You have ${context.summary.overdueCount} overdue invoice(s) totaling $${context.overdueInvoices.reduce((s: number, i: any) => s + parseFloat(i.total), 0).toFixed(2)}. Want me to help you follow up?\n\n`;
        }
        if (context.summary.expiringContractCount > 0) {
            greeting += `📜 ${context.summary.expiringContractCount} contract(s) expiring within 30 days.\n\n`;
        }

        greeting += `How can I assist you today? Here are some things I can help with:\n`;
        greeting += `• 📝 Create or manage invoices\n`;
        greeting += `• 💰 Record payments\n`;
        greeting += `• 📧 Send invoices or reminders\n`;
        greeting += `• 📊 Financial reports & analytics\n`;
        greeting += `• 📄 Generate PDFs\n`;
        greeting += `• 📝 Manage proposals & contracts`;
        return greeting;
    }

    // ── Overdue / Late / Past Due ─────────────────────────
    if (/overdue|late|past\s*due|unpaid|outstanding|owes?|owed/.test(lower)) {
        if (context.overdueInvoices.length === 0) {
            return `✅ **Great news!** You have no overdue invoices. All ${context.summary.totalInvoices} invoices are on track.\n\n${context.summary.unpaidCount > 0 ? `📋 You do have **${context.summary.unpaidCount} unpaid** invoice(s) totaling **$${context.summary.totalOutstanding}**, but none are overdue yet.` : 'Everything is fully paid up!'}`;
        }

        let resp = `⚠️ **Overdue Invoices** (${context.overdueInvoices.length} total)\n\n`;

        context.overdueInvoices.forEach((i: any) => {
            const urgency = i.daysOverdue > 60 ? '🔴 CRITICAL' : i.daysOverdue > 30 ? '🟠 HIGH' : '🟡 MODERATE';
            resp += `${urgency} **${i.invoiceNumber}** — **$${i.total}**\n`;
            resp += `   Client: ${i.clientName} · ${i.daysOverdue} days overdue (due ${i.dueDate})\n\n`;
        });

        const totalOverdue = context.overdueInvoices.reduce((s: number, i: any) => s + parseFloat(i.total), 0);
        resp += `💰 **Total overdue: $${totalOverdue.toFixed(2)}**\n\n`;

        resp += `📊 **Aging Breakdown:**\n`;
        resp += `• 1-30 days: $${context.aging.days1to30.toFixed(2)}\n`;
        resp += `• 31-60 days: $${context.aging.days31to60.toFixed(2)}\n`;
        resp += `• 61-90 days: $${context.aging.days61to90.toFixed(2)}\n`;
        resp += `• 90+ days: $${context.aging.over90.toFixed(2)}\n\n`;

        resp += `**Recommended actions:**\n`;
        resp += `1. Send payment reminders to overdue clients\n`;
        resp += `2. Consider phone follow-up for invoices over 30 days\n`;
        resp += `3. Review credit terms for repeat late payers\n\n`;
        resp += `Would you like me to send reminders to all overdue clients?`;
        return resp;
    }

    // ── Revenue / Summary / Report / Dashboard / Analytics ─
    if (/revenue|summary|report|how much|dashboard|analytics|earnings|income|money|profit|stats|statistics|financial|performance|overview/.test(lower)) {
        let resp = `📊 **Financial Summary**\n\n`;

        resp += `**💰 Revenue:**\n`;
        resp += `• All-time: **$${context.summary.totalRevenue}**\n`;
        resp += `• This month: **$${context.summary.revenueThisMonth}**\n`;
        resp += `• Last month: $${context.summary.revenueLastMonth}\n`;
        resp += `• Month-over-month: ${context.summary.revenueGrowth === 'N/A' ? 'N/A' : (parseFloat(context.summary.revenueGrowth) >= 0 ? `📈 +${context.summary.revenueGrowth}%` : `📉 ${context.summary.revenueGrowth}%`)}\n\n`;

        resp += `**📋 Invoices:**\n`;
        resp += `• Total: ${context.summary.totalInvoices} (${context.summary.invoicesThisMonth} this month)\n`;
        resp += `• Paid: ${context.summary.paidCount} · Sent: ${context.summary.sentCount} · Draft: ${context.summary.draftCount} · Overdue: ${context.summary.overdueCount}\n`;
        resp += `• Avg payment time: ${context.summary.avgPaymentDays} days\n\n`;

        resp += `**💳 Payments:**\n`;
        resp += `• Total received: ${context.summary.totalPayments} payments\n`;
        resp += `• This month: ${context.summary.paymentsThisMonth} payments ($${context.summary.revenueThisMonth})\n\n`;

        resp += `**🏦 Outstanding:**\n`;
        resp += `• Total outstanding: **$${context.summary.totalOutstanding}**\n`;
        resp += `• Overdue amount: $${context.overdueInvoices.reduce((s: number, i: any) => s + parseFloat(i.total), 0).toFixed(2)}\n\n`;

        if (context.topClients.length > 0) {
            resp += `**🏆 Top Clients by Revenue:**\n`;
            context.topClients.forEach((c: any, i: number) => {
                resp += `${i + 1}. ${c.name}: $${c.revenue}\n`;
            });
            resp += '\n';
        }

        resp += `**📝 Proposals:** ${context.summary.proposalCount} total (${context.summary.activeProposalCount} active, ${context.summary.proposalConversionRate}% conversion rate)\n`;
        resp += `**📜 Contracts:** ${context.summary.contractCount} total (${context.summary.activeContractCount} active, $${context.summary.totalContractValue} value)\n\n`;

        if (context.summary.overdueCount > 0) {
            resp += `⚠️ **Action needed:** ${context.summary.overdueCount} overdue invoices need follow-up.`;
        } else {
            resp += `✅ All invoices are on track. Keep up the great work!`;
        }
        return resp;
    }

    // ── Create Invoice ────────────────────────────────────
    if (/(create|make|new|generate|draft)\s*(an?\s*)?(new\s*)?(invoice|bill)/.test(lower)) {
        if (context.clients.length === 0) {
            return `📝 To create an invoice, you need at least one client. Go to the **Clients** page to add a client first.\n\n\`\`\`action\n{"type": "navigate", "data": {"page": "/clients"}}\n\`\`\``;
        }
        let resp = `📝 **Let's create a new invoice!**\n\nWhich client is this invoice for?\n\n`;
        context.clients.forEach((c: any) => {
            resp += `**${c.id}.** ${c.name} (${c.contactEmail})\n`;
        });
        resp += `\nPlease tell me:\n1. The client (name or number)\n2. Items (description, quantity, unit price)\n3. Due date\n\nFor example: *"Create invoice for ${context.clients[0]?.name || 'Client'} — Web design $2000, 1 unit, due in 30 days"*`;
        return resp;
    }

    // ── Send / Email Invoice ──────────────────────────────
    if (/(send|email|mail)\s*(an?\s*)?(invoice|bill|reminder)/.test(lower) || /send\s*reminder/.test(lower)) {
        if (/reminder/.test(lower)) {
            if (context.overdueInvoices.length === 0) {
                return `✅ No overdue invoices to send reminders for! All ${context.summary.totalInvoices} invoices are on track.`;
            }
            let resp = `📧 **Payment Reminders**\n\nHere are overdue invoices you can send reminders for:\n\n`;
            context.overdueInvoices.forEach((i: any) => {
                resp += `• **${i.invoiceNumber}** — $${i.total} from ${i.clientName} (${i.daysOverdue} days overdue)\n`;
            });
            resp += `\nWould you like me to send reminders to all of them, or a specific one?\n\n`;
            resp += `\`\`\`action\n{"type": "sendReminder", "data": {"invoiceId": ${context.overdueInvoices[0]?.id}}}\n\`\`\``;
            return resp;
        }

        const unsent = context.recentInvoices.filter((i: any) => i.status === 'draft');
        if (unsent.length === 0) {
            return `📧 No draft invoices to send right now. All invoices have already been sent or are in a final state.\n\nWould you like to create a new invoice to send?`;
        }
        let resp = `📧 **Send Invoice to Client**\n\nDraft invoices ready to send:\n\n`;
        unsent.forEach((i: any) => {
            resp += `• **${i.invoiceNumber}** — $${i.total} → ${i.clientName}\n`;
        });
        resp += `\nWhich one would you like to send? I'll email it with a PDF attachment.\n\n`;
        resp += `\`\`\`action\n{"type": "sendInvoice", "data": {"invoiceId": ${unsent[0]?.id}}}\n\`\`\``;
        return resp;
    }

    // ── Record Payment ────────────────────────────────────
    if (/(record|log|add|register|receive)\s*(a?\s*)?payment/.test(lower) || /got\s*paid|received\s*payment/.test(lower)) {
        const payable = context.recentInvoices.filter((i: any) => ['sent', 'overdue', 'draft'].includes(i.status));
        if (payable.length === 0) {
            return `✅ All invoices are currently paid! No outstanding payments to record.\n\nWould you like to create a new invoice?`;
        }
        let resp = `💰 **Record a Payment**\n\nHere are invoices with outstanding balances:\n\n`;
        payable.slice(0, 10).forEach((i: any) => {
            resp += `• **${i.invoiceNumber}** — $${i.total} from ${i.clientName} [${i.status}]\n`;
        });
        resp += `\nWhich invoice received a payment? And for how much?\n\nExample: *"${payable[0]?.invoiceNumber} received $${payable[0]?.total}"*`;
        return resp;
    }

    // ── Download / PDF ────────────────────────────────────
    if (/download|pdf|export|print/.test(lower)) {
        if (/proposal/.test(lower)) {
            if (context.proposals.length === 0) return `No proposals found to download.`;
            let resp = `📄 **Download Proposal PDF**\n\n`;
            context.proposals.slice(0, 5).forEach((p: any) => {
                resp += `• "${p.title}" → ${p.clientName} ($${p.total}) [${p.status}]\n`;
            });
            resp += `\nWhich proposal would you like to download as PDF?`;
            return resp;
        }
        if (context.recentInvoices.length === 0) return `No invoices found to download.`;
        let resp = `📄 **Download Invoice PDF**\n\nRecent invoices:\n\n`;
        context.recentInvoices.slice(0, 8).forEach((i: any) => {
            resp += `• **${i.invoiceNumber}** — $${i.total} → ${i.clientName} [${i.status}]\n`;
        });
        resp += `\nWhich invoice would you like to download as PDF?\n\n`;
        resp += `\`\`\`action\n{"type": "downloadPdf", "data": {"invoiceId": ${context.recentInvoices[0]?.id}}}\n\`\`\``;
        return resp;
    }

    // ── Invoices / List ───────────────────────────────────
    if (/^(list|show|view|see|all|my)\s*(all\s*)?(recent\s*)?(invoices?|bills?)/.test(lower) || lower === 'invoices') {
        let resp = `📋 **Your Invoices** (${context.summary.totalInvoices} total)\n\n`;
        resp += `**Status Breakdown:**\n`;
        resp += `• 📝 Draft: ${context.summary.draftCount}\n`;
        resp += `• 📤 Sent: ${context.summary.sentCount}\n`;
        resp += `• 🔴 Overdue: ${context.summary.overdueCount}\n`;
        resp += `• ✅ Paid: ${context.summary.paidCount}\n`;
        resp += `• ❌ Cancelled: ${context.summary.cancelledCount}\n\n`;

        resp += `**Recent Invoices:**\n`;
        context.recentInvoices.slice(0, 10).forEach((i: any) => {
            const icon = i.status === 'paid' ? '✅' : i.status === 'overdue' ? '🔴' : i.status === 'sent' ? '📤' : '📝';
            resp += `${icon} **${i.invoiceNumber}** — $${i.total} → ${i.clientName} [${i.status}]\n`;
        });

        resp += `\n\`\`\`action\n{"type": "navigate", "data": {"page": "/invoices"}}\n\`\`\``;
        return resp;
    }

    // ── Clients ───────────────────────────────────────────
    if (/clients?|customers?|contacts?/.test(lower) && !/create|add|new/.test(lower)) {
        if (context.clients.length === 0) {
            return `👤 You don't have any clients yet. Go to the **Clients** page to add your first client!\n\n\`\`\`action\n{"type": "navigate", "data": {"page": "/clients"}}\n\`\`\``;
        }
        let resp = `👤 **Your Clients** (${context.summary.totalClients} total)\n\n`;
        context.clients.forEach((c: any) => {
            const outstanding = context.topOwing.find((o: any) => o.name === c.name);
            const topRev = context.topClients.find((t: any) => t.name === c.name);
            resp += `• **${c.name}** — ${c.contactEmail}`;
            if (topRev) resp += ` · Revenue: $${topRev.revenue}`;
            if (outstanding) resp += ` · Outstanding: $${outstanding.outstanding}`;
            resp += '\n';
        });

        resp += `\n\`\`\`action\n{"type": "navigate", "data": {"page": "/clients"}}\n\`\`\``;
        return resp;
    }

    // ── Proposals ─────────────────────────────────────────
    if (/proposals?/.test(lower)) {
        if (/create|make|new|draft/.test(lower)) {
            if (context.clients.length === 0) {
                return `📝 You need at least one client to create a proposal. Add a client first!`;
            }
            let resp = `📝 **Create a New Proposal**\n\nWhich client is this proposal for?\n\n`;
            context.clients.forEach((c: any) => {
                resp += `**${c.id}.** ${c.name}\n`;
            });
            resp += `\nPlease provide:\n1. Client name/number\n2. Proposal title\n3. Items (description, quantity, rate)\n4. Valid until date (optional)`;
            return resp;
        }

        let resp = `📝 **Your Proposals** (${context.summary.proposalCount} total)\n\n`;
        resp += `• Active: ${context.summary.activeProposalCount}\n`;
        resp += `• Pipeline Value: $${context.summary.proposalPipeline}\n`;
        resp += `• Conversion Rate: ${context.summary.proposalConversionRate}%\n\n`;

        if (context.proposals.length > 0) {
            context.proposals.forEach((p: any) => {
                const icon = p.status === 'accepted' ? '✅' : p.status === 'rejected' ? '❌' : p.status === 'sent' ? '📤' : '📝';
                resp += `${icon} **"${p.title}"** → ${p.clientName}: $${p.total} [${p.status}]\n`;
            });
        } else {
            resp += `No proposals yet. Would you like to create one?`;
        }

        resp += `\n\`\`\`action\n{"type": "navigate", "data": {"page": "/proposals"}}\n\`\`\``;
        return resp;
    }

    // ── Contracts ─────────────────────────────────────────
    if (/contracts?/.test(lower)) {
        if (/expir|renew/.test(lower)) {
            if (context.expiringContracts.length === 0) {
                return `📜 No contracts expiring within the next 30 days. You have **${context.summary.activeContractCount}** active contracts worth **$${context.summary.totalContractValue}**.`;
            }
            let resp = `📜 **Contracts Expiring Soon**\n\n`;
            context.expiringContracts.forEach((c: any) => {
                resp += `⚠️ **"${c.title}"** → ${c.clientName}: $${c.value} — expires in **${c.daysUntilExpiry} days**\n`;
            });
            resp += `\nWould you like me to help you renew any of these?`;
            return resp;
        }

        let resp = `📜 **Your Contracts** (${context.summary.contractCount} total)\n\n`;
        resp += `• Active: ${context.summary.activeContractCount}\n`;
        resp += `• Total Value: $${context.summary.totalContractValue}\n`;
        resp += `• Expiring Soon: ${context.summary.expiringContractCount}\n\n`;

        if (context.contracts.length > 0) {
            context.contracts.forEach((c: any) => {
                const icon = c.status === 'active' ? '🟢' : c.status === 'completed' ? '✅' : '📝';
                resp += `${icon} **"${c.title}"** → ${c.clientName}: $${c.value} [${c.status}]\n`;
            });
        }

        resp += `\n\`\`\`action\n{"type": "navigate", "data": {"page": "/contracts"}}\n\`\`\``;
        return resp;
    }

    // ── Payments / Payment history ────────────────────────
    if (/payments?|paid|received|transactions?|payment\s*history/.test(lower) && !/record|log|add/.test(lower)) {
        let resp = `💳 **Payment Summary**\n\n`;
        resp += `• Total payments: **${context.summary.totalPayments}**\n`;
        resp += `• This month: ${context.summary.paymentsThisMonth} payments ($${context.summary.revenueThisMonth})\n`;
        resp += `• All-time revenue: $${context.summary.totalRevenue}\n\n`;

        if (context.recentPayments.length > 0) {
            resp += `**Recent Payments:**\n`;
            context.recentPayments.forEach((p: any) => {
                resp += `• **$${p.amount}** via ${p.paymentMethod} on ${p.paymentDate} (Ref: ${p.reference || 'N/A'})\n`;
            });
        }

        resp += `\n\`\`\`action\n{"type": "navigate", "data": {"page": "/payments"}}\n\`\`\``;
        return resp;
    }

    // ── Aging / Receivables ───────────────────────────────
    if (/aging|receivable|ar\b|collection/.test(lower)) {
        let resp = `🏦 **Accounts Receivable Aging Report**\n\n`;
        resp += `| Period | Amount |\n`;
        resp += `|--------|--------|\n`;
        resp += `| Current (not due) | $${context.aging.current.toFixed(2)} |\n`;
        resp += `| 1-30 days overdue | $${context.aging.days1to30.toFixed(2)} |\n`;
        resp += `| 31-60 days overdue | $${context.aging.days31to60.toFixed(2)} |\n`;
        resp += `| 61-90 days overdue | $${context.aging.days61to90.toFixed(2)} |\n`;
        resp += `| 90+ days overdue | $${context.aging.over90.toFixed(2)} |\n`;
        resp += `| **Total Outstanding** | **$${context.summary.totalOutstanding}** |\n\n`;

        if (context.topOwing.length > 0) {
            resp += `**Clients with largest outstanding balances:**\n`;
            context.topOwing.forEach((c: any) => {
                resp += `• **${c.name}**: $${c.outstanding}${c.overdueCount > 0 ? ` (${c.overdueCount} overdue)` : ''}\n`;
            });
        }

        const totalOverdue = context.aging.days1to30 + context.aging.days31to60 + context.aging.days61to90 + context.aging.over90;
        if (totalOverdue > 0) {
            resp += `\n⚠️ **$${totalOverdue.toFixed(2)}** is past due. Consider sending reminders or escalating collection efforts for invoices over 60 days.`;
        }
        return resp;
    }

    // ── Cash flow / Forecast ──────────────────────────────
    if (/cash\s*flow|forecast|projection|predict/.test(lower)) {
        const expectedIncoming = context.aging.current;
        let resp = `💰 **Cash Flow Snapshot**\n\n`;
        resp += `**Incoming (Expected):**\n`;
        resp += `• Current invoices (not yet due): $${context.aging.current.toFixed(2)}\n`;
        resp += `• Overdue (may collect): $${(context.aging.days1to30 + context.aging.days31to60).toFixed(2)}\n`;
        resp += `• Proposal pipeline: $${context.summary.proposalPipeline}\n\n`;
        resp += `**Recent Trend:**\n`;
        resp += `• This month: $${context.summary.revenueThisMonth} received\n`;
        resp += `• Last month: $${context.summary.revenueLastMonth} received\n`;
        resp += `• Growth: ${context.summary.revenueGrowth}%\n\n`;
        resp += `**Tips to improve cash flow:**\n`;
        resp += `1. Send reminders for ${context.summary.overdueCount} overdue invoices\n`;
        resp += `2. Follow up on ${context.summary.sentCount} sent invoices\n`;
        resp += `3. Convert ${context.summary.draftCount} draft invoices to sent\n`;
        if (context.summary.activeProposalCount > 0) {
            resp += `4. Follow up on ${context.summary.activeProposalCount} active proposals ($${context.summary.proposalPipeline} pipeline)`;
        }
        return resp;
    }

    // ── Specific client lookup ────────────────────────────
    const clientMatch = context.clients.find((c: any) => lower.includes(c.name.toLowerCase()));
    if (clientMatch) {
        const clientInvoices = context.recentInvoices.filter((i: any) => i.clientId === clientMatch.id);
        const clientProposals = context.proposals.filter((p: any) => p.clientId === clientMatch.id);
        const clientContracts = context.contracts.filter((c: any) => c.clientId === clientMatch.id);
        const clientOwing = context.topOwing.find((o: any) => o.name === clientMatch.name);
        const clientRevenue = context.topClients.find((t: any) => t.name === clientMatch.name);

        let resp = `👤 **Client Profile: ${clientMatch.name}**\n\n`;
        resp += `📧 ${clientMatch.contactEmail}`;
        if (clientMatch.phone) resp += ` · 📞 ${clientMatch.phone}`;
        if (clientMatch.address) resp += `\n📍 ${clientMatch.address}`;
        resp += '\n\n';

        resp += `**Financial Overview:**\n`;
        resp += `• Revenue: ${clientRevenue ? `$${clientRevenue.revenue}` : '$0.00'}\n`;
        resp += `• Outstanding: ${clientOwing ? `$${clientOwing.outstanding}` : '$0.00'}\n\n`;

        if (clientInvoices.length > 0) {
            resp += `**Invoices (${clientInvoices.length}):**\n`;
            clientInvoices.forEach((i: any) => {
                const icon = i.status === 'paid' ? '✅' : i.status === 'overdue' ? '🔴' : '📤';
                resp += `${icon} ${i.invoiceNumber}: $${i.total} [${i.status}]\n`;
            });
            resp += '\n';
        }
        if (clientProposals.length > 0) {
            resp += `**Proposals (${clientProposals.length}):** `;
            resp += clientProposals.map((p: any) => `"${p.title}" [${p.status}]`).join(', ');
            resp += '\n\n';
        }
        if (clientContracts.length > 0) {
            resp += `**Contracts (${clientContracts.length}):** `;
            resp += clientContracts.map((c: any) => `"${c.title}" [${c.status}]`).join(', ');
            resp += '\n';
        }
        return resp;
    }

    // ── Thank you / Goodbye ───────────────────────────────
    if (/thank|thanks|great|awesome|perfect|goodbye|bye|that'?s? all/.test(lower)) {
        return `😊 You're welcome! I'm here anytime you need help with billing. Have a great day!\n\n${context.summary.overdueCount > 0 ? `💡 **Reminder:** Don't forget about the ${context.summary.overdueCount} overdue invoice(s) worth $${context.overdueInvoices.reduce((s: number, i: any) => s + parseFloat(i.total), 0).toFixed(2)}.` : '✅ Your billing is in great shape!'}`;
    }

    // ── What can you do / Help ────────────────────────────
    if (/what\s*can\s*you|help|capabilities|features|how\s*to|what\s*do\s*you/.test(lower)) {
        return `🤖 **I'm your AI Billing Assistant!** Here's everything I can help with:\n\n` +
            `**📋 Invoice Management:**\n` +
            `• Create new invoices — *"Create invoice for [client]"*\n` +
            `• View invoice list — *"Show my invoices"*\n` +
            `• Check overdue — *"Show overdue invoices"*\n` +
            `• Download PDFs — *"Download invoice PDF"*\n\n` +

            `**💰 Payments:**\n` +
            `• Record payments — *"Record a payment"*\n` +
            `• View payment history — *"Show recent payments"*\n` +
            `• Check who owes you — *"Who owes me money?"*\n\n` +

            `**📧 Communications:**\n` +
            `• Send invoices to clients — *"Send invoice to client"*\n` +
            `• Send payment reminders — *"Send reminders"*\n\n` +

            `**📊 Reports & Analytics:**\n` +
            `• Revenue summary — *"Show my revenue"*\n` +
            `• Aging report — *"Show aging report"*\n` +
            `• Cash flow analysis — *"Show cash flow"*\n` +
            `• Client analysis — *"Tell me about [client name]"*\n\n` +

            `**📝 Proposals & Contracts:**\n` +
            `• View proposals — *"Show my proposals"*\n` +
            `• View contracts — *"Show my contracts"*\n` +
            `• Check expiring contracts — *"Any contracts expiring?"*\n\n` +

            `**👤 Client Management:**\n` +
            `• View client list — *"Show my clients"*\n` +
            `• Client profile — *"Tell me about [client name]"*\n\n` +

            `Just type naturally — I understand conversational language! 💬`;
    }

    // ── Default / Unknown ─────────────────────────────────
    let resp = `I'd be happy to help! Here's what I can assist you with:\n\n`;
    resp += `📝 **"Create a new invoice"** — Start invoicing a client\n`;
    resp += `⚠️ **"Show overdue invoices"** — See what's past due\n`;
    resp += `📊 **"Revenue summary"** — Financial overview\n`;
    resp += `📧 **"Send reminders"** — Follow up on unpaid invoices\n`;
    resp += `💰 **"Record a payment"** — Log received payments\n`;
    resp += `📄 **"Download PDF"** — Get invoice/proposal PDFs\n`;
    resp += `👤 **"Show my clients"** — View client list\n`;
    resp += `📝 **"Show proposals"** — View proposals\n`;
    resp += `📜 **"Show contracts"** — View contracts\n`;
    resp += `🏦 **"Aging report"** — Accounts receivable breakdown\n`;
    resp += `💰 **"Cash flow"** — Cash flow analysis\n\n`;

    // Add proactive insight
    if (context.summary.overdueCount > 0) {
        resp += `⚠️ **Quick insight:** You have ${context.summary.overdueCount} overdue invoice(s) — want me to help with those?`;
    } else if (context.summary.draftCount > 0) {
        resp += `💡 **Tip:** You have ${context.summary.draftCount} draft invoice(s) ready to send. Say "send invoices" to email them to clients.`;
    } else if (context.summary.expiringContractCount > 0) {
        resp += `📜 **Heads up:** ${context.summary.expiringContractCount} contract(s) expiring within 30 days.`;
    } else {
        resp += `✅ Your billing is looking great! All invoices are on track.`;
    }
    return resp;
}

// ─── GET /ai/history ────────────────────────────────────────
router.get('/history', async (req: AuthRequest, res) => {
    try {
        const messages = await prisma.aiChatMessage.findMany({
            where: { userId: req.userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.json({ messages: messages.reverse() });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── DELETE /ai/history ─────────────────────────────────────
router.delete('/history', async (req: AuthRequest, res) => {
    try {
        await prisma.aiChatMessage.deleteMany({ where: { userId: req.userId } });
        res.status(204).send();
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

// ─── GET /ai/suggestions ───────────────────────────────────
router.get('/suggestions', async (req: AuthRequest, res) => {
    try {
        const context = await getBillingContext(req.userId!);
        const suggestions: Array<{ label: string; icon: string; message: string }> = [];

        // Priority suggestions based on billing state
        if (context.summary.overdueCount > 0) {
            suggestions.push({
                label: `${context.summary.overdueCount} Overdue`,
                icon: '⚠️',
                message: 'Show me overdue invoices',
            });
        }

        if (context.summary.draftCount > 0) {
            suggestions.push({
                label: `${context.summary.draftCount} Drafts`,
                icon: '📝',
                message: 'Show draft invoices ready to send',
            });
        }

        if (context.summary.expiringContractCount > 0) {
            suggestions.push({
                label: `${context.summary.expiringContractCount} Expiring`,
                icon: '📜',
                message: 'Show contracts expiring soon',
            });
        }

        // Always-available suggestions
        suggestions.push(
            { label: 'Revenue Report', icon: '📊', message: 'Show my revenue summary' },
            { label: 'Create Invoice', icon: '➕', message: 'Create a new invoice' },
            { label: 'Send Reminders', icon: '📧', message: 'Send payment reminders' },
            { label: 'Aging Report', icon: '🏦', message: 'Show aging report' },
            { label: 'Cash Flow', icon: '💰', message: 'Show cash flow analysis' },
        );

        res.json({ suggestions: suggestions.slice(0, 6) });
    } catch (err: any) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
