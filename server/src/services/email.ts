import nodemailer from 'nodemailer';

// ─── Email Transport ───────────────────────────────────────
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const FROM_EMAIL = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@okebill.com';

// ─── Email Templates ───────────────────────────────────────

function baseTemplate(title: string, body: string, companyName: string) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f4f7; }
            .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.06); }
            .header { background: linear-gradient(135deg, #1E3A5F, #152C48); padding: 32px 24px; text-align: center; }
            .header h1 { color: #fff; margin: 0; font-size: 24px; }
            .header p { color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px; }
            .body { padding: 32px 24px; }
            .body h2 { color: #1f2937; font-size: 20px; margin: 0 0 16px; }
            .body p { color: #4b5563; line-height: 1.6; margin: 8px 0; }
            .info-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
            .info-row { display: flex; justify-content: space-between; padding: 4px 0; }
            .info-label { color: #6b7280; font-size: 14px; }
            .info-value { color: #1f2937; font-weight: 600; font-size: 14px; }
            .total-row { border-top: 2px solid #e5e7eb; margin-top: 8px; padding-top: 8px; }
            .total-value { color: #1E3A5F; font-size: 18px; }
            .btn { display: inline-block; background: #10B981; color: #fff !important; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
            .footer { background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb; }
            .footer p { color: #9ca3af; font-size: 12px; margin: 4px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${companyName}</h1>
                <p>${title}</p>
            </div>
            <div class="body">
                ${body}
            </div>
            <div class="footer">
                <p>Sent via OkBill — Simple | Hisab | Accurate</p>
                <p>© ${new Date().getFullYear()} ${companyName}</p>
            </div>
        </div>
    </body>
    </html>`;
}

// ─── Send Functions ─────────────────────────────────────────

export interface InvoiceEmailData {
    to: string;
    clientName: string;
    companyName: string;
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    subtotal: number;
    tax: number;
    total: number;
    items: Array<{ description: string; quantity: number; unitPrice: number; amount: number }>;
    viewUrl?: string;
    pdfBuffer?: Buffer;
}

export async function sendInvoiceEmail(data: InvoiceEmailData) {
    const itemRows = data.items.map(item => `
        <div class="info-row">
            <span class="info-label">${item.description} × ${item.quantity}</span>
            <span class="info-value">₹${item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>
    `).join('');

    const body = `
        <h2>Invoice ${data.invoiceNumber}</h2>
        <p>Hi ${data.clientName},</p>
        <p>Please find your invoice details below:</p>
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Invoice #</span>
                <span class="info-value">${data.invoiceNumber}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Issue Date</span>
                <span class="info-value">${data.issueDate}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Due Date</span>
                <span class="info-value">${data.dueDate}</span>
            </div>
        </div>
        <div class="info-box">
            ${itemRows}
            <div class="info-row">
                <span class="info-label">Subtotal</span>
                <span class="info-value">₹${data.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tax</span>
                <span class="info-value">₹${data.tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="info-row total-row">
                <span class="info-label" style="font-weight:600">Total Due</span>
                <span class="total-value">₹${data.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
        </div>
        ${data.viewUrl ? `<a href="${data.viewUrl}" class="btn">View Invoice</a>` : ''}
    `;

    const attachments = data.pdfBuffer ? [{
        filename: `${data.invoiceNumber}.pdf`,
        content: data.pdfBuffer,
        contentType: 'application/pdf',
    }] : [];

    return transporter.sendMail({
        from: `"${data.companyName}" <${FROM_EMAIL}>`,
        to: data.to,
        subject: `Invoice ${data.invoiceNumber} from ${data.companyName}`,
        html: baseTemplate('Invoice', body, data.companyName),
        attachments,
    });
}

export async function sendPaymentReminderEmail(data: {
    to: string;
    clientName: string;
    companyName: string;
    invoiceNumber: string;
    dueDate: string;
    total: number;
    balanceRemaining: number;
    daysOverdue: number;
}) {
    const urgency = data.daysOverdue > 30 ? 'Final Notice' : data.daysOverdue > 0 ? 'Overdue Reminder' : 'Payment Reminder';

    const body = `
        <h2>${urgency}</h2>
        <p>Hi ${data.clientName},</p>
        <p>This is a friendly reminder regarding invoice <strong>${data.invoiceNumber}</strong>.</p>
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Invoice #</span>
                <span class="info-value">${data.invoiceNumber}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Due Date</span>
                <span class="info-value">${data.dueDate}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Total Amount</span>
                <span class="info-value">₹${data.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="info-row total-row">
                <span class="info-label" style="font-weight:600">Balance Remaining</span>
                <span class="total-value">₹${data.balanceRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
        </div>
        ${data.daysOverdue > 0
            ? `<p style="color:#1E3A5F;font-weight:600">This invoice is ${data.daysOverdue} days overdue.</p>`
            : '<p>Please arrange payment at your earliest convenience.</p>'
        }
        <p>Thank you for your business!</p>
    `;

    return transporter.sendMail({
        from: `"${data.companyName}" <${FROM_EMAIL}>`,
        to: data.to,
        subject: `${urgency}: Invoice ${data.invoiceNumber} — ₹${data.balanceRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })} due`,
        html: baseTemplate(urgency, body, data.companyName),
    });
}

export async function sendPaymentReceiptEmail(data: {
    to: string;
    clientName: string;
    companyName: string;
    invoiceNumber: string;
    amountPaid: number;
    paymentDate: string;
    paymentMethod: string;
    reference: string;
    balanceRemaining: number;
}) {
    const body = `
        <h2>Payment Receipt</h2>
        <p>Hi ${data.clientName},</p>
        <p>We have received your payment. Here are the details:</p>
        <div class="info-box">
            <div class="info-row">
                <span class="info-label">Invoice #</span>
                <span class="info-value">${data.invoiceNumber}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Payment Reference</span>
                <span class="info-value">${data.reference}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Amount Paid</span>
                <span class="info-value" style="color:#16a34a">₹${data.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Payment Date</span>
                <span class="info-value">${data.paymentDate}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Method</span>
                <span class="info-value">${data.paymentMethod}</span>
            </div>
            ${data.balanceRemaining > 0 ? `
            <div class="info-row total-row">
                <span class="info-label" style="font-weight:600">Balance Remaining</span>
                <span class="total-value">₹${data.balanceRemaining.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            ` : `
            <div class="info-row total-row">
                <span class="info-label" style="font-weight:600">Status</span>
                <span class="info-value" style="color:#16a34a">✓ Paid in Full</span>
            </div>
            `}
        </div>
        <p>Thank you for your payment!</p>
    `;

    return transporter.sendMail({
        from: `"${data.companyName}" <${FROM_EMAIL}>`,
        to: data.to,
        subject: `Payment Receipt — ₹${data.amountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })} received for ${data.invoiceNumber}`,
        html: baseTemplate('Payment Receipt', body, data.companyName),
    });
}

export function isEmailConfigured(): boolean {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}
