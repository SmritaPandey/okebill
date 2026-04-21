import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Scale, Shield, FileText, UserCheck, CreditCard,
  AlertTriangle, Globe, Lock, Ban, Gavel, ChevronRight, Mail,
} from 'lucide-react';

const sections = [
  { id: 'acceptance', label: 'Acceptance', icon: UserCheck },
  { id: 'account', label: 'Account Terms', icon: Lock },
  { id: 'services', label: 'Service Description', icon: Globe },
  { id: 'billing', label: 'Billing & Payments', icon: CreditCard },
  { id: 'esign', label: 'Digital Signatures', icon: FileText },
  { id: 'acceptable-use', label: 'Acceptable Use', icon: Shield },
  { id: 'ip', label: 'Intellectual Property', icon: Scale },
  { id: 'limitation', label: 'Limitation of Liability', icon: AlertTriangle },
  { id: 'termination', label: 'Termination', icon: Ban },
  { id: 'governing-law', label: 'Governing Law', icon: Gavel },
];

const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-[#1E3A5F]">
      {/* Mesh Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#1E3A5F]/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/20 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/logo.png" alt="OkBill" className="w-8 h-8" />
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                OkBill
              </span>
            </div>
          </div>
          <Button onClick={() => navigate('/register')} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl">
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 pb-10 z-10">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1E3A5F]/10 border border-[#1E3A5F]/20 mb-6">
              <Scale className="w-4 h-4 text-[#1E3A5F]" />
              <span className="text-xs font-bold text-[#1E3A5F] uppercase tracking-widest">Legal Agreement</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-900 mb-4">
              Terms of <span className="text-emerald-600">Service</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              By using OkBill, you agree to the following terms and conditions.
              Please read them carefully before registering or using our services.
            </p>
            <p className="text-sm text-slate-400 mt-4">Effective: March 29, 2026 · Version 1.0</p>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="relative z-10 pb-8">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Sections</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {sections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => scrollTo(s.id)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 transition-colors text-left"
                  >
                    <s.icon className="w-4 h-4 shrink-0" />
                    {s.label}
                    <ChevronRight className="w-3 h-3 ml-auto text-slate-300" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="relative z-10 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Acceptance */}
            <div id="acceptance" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">1. Acceptance of Terms</h2>
              </div>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>By creating an account, accessing, or using OkBill (the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of a business, you represent that you have the authority to bind that business to these Terms.</p>
                <p>If you do not agree to these Terms, you must not use the Service.</p>
                <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance of the revised Terms. Material changes will be communicated via email or in-app notification at least 30 days before taking effect.</p>
              </div>
            </div>

            {/* Account Terms */}
            <div id="account" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#1E3A5F]" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">2. Account Registration & Security</h2>
              </div>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>You must be at least 18 years of age to use the Service</li>
                  <li>You must provide accurate and complete information during registration</li>
                  <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                  <li>You must notify us immediately of any unauthorized access to your account</li>
                  <li>One person or entity may not maintain multiple free accounts</li>
                  <li>You are responsible for all activities that occur under your account</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                  <p className="text-amber-800 text-sm">
                    <strong>⚠ Important:</strong> OkBill will never ask for your password via email or phone.
                    If you receive such a request, report it to <a href="mailto:security@okebill.com" className="underline">security@okebill.com</a>.
                  </p>
                </div>
              </div>
            </div>

            {/* Service Description */}
            <div id="services" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">3. Service Description</h2>
              </div>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>OkBill provides a cloud-based billing and invoicing platform that includes:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>GST-compliant invoice generation (B2B, B2C, export)</li>
                  <li>E-invoicing via NIC/IRP with IRN and QR code generation</li>
                  <li>E-Way Bill generation and management</li>
                  <li>GSTR-1 data export and filing assistance</li>
                  <li>Client, proposal, and contract management</li>
                  <li>Payment processing via Razorpay integration</li>
                  <li>Products, inventory, POS, and multi-store management</li>
                  <li>Digital signature on invoices and documents</li>
                  <li>AI-powered business insights and chatbot</li>
                  <li>PDF generation, email delivery, and document storage</li>
                </ul>
                <p>The Service is provided "as is" and may include periodic updates, maintenance, and feature changes.</p>
              </div>
            </div>

            {/* Billing & Payments */}
            <div id="billing" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-[#1E3A5F]" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">4. Billing & Subscription</h2>
              </div>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Free Trial:</strong> New accounts receive a 14-day free trial with full access to all features</li>
                  <li><strong>Subscription Plans:</strong> After the trial, choose a paid plan (Starter, Professional, Enterprise) or continue with the free tier with limited features</li>
                  <li><strong>Pay-As-You-Go:</strong> Some features may incur per-use charges (e.g., e-invoice generation, SMS OTP)</li>
                  <li><strong>Billing Cycle:</strong> Subscriptions are billed monthly or annually. Prices are listed in INR and include applicable GST</li>
                  <li><strong>Payment Methods:</strong> All payments are processed securely via Razorpay. We accept UPI, credit/debit cards, net banking, and wallets</li>
                  <li><strong>Cancellation:</strong> You may cancel your subscription at any time. Access continues until the end of the current billing period</li>
                  <li><strong>Refunds:</strong> Refer to our <a href="/refund-policy" className="text-emerald-600 underline">Refund & Cancellation Policy</a> for details</li>
                </ul>
              </div>
            </div>

            {/* Digital Signatures */}
            <div id="esign" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">5. Digital Signatures & E-Documents</h2>
              </div>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>OkBill supports electronic signatures on invoices and documents:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Legal Validity:</strong> Electronic signatures created through OkBill are recognized under <strong>Section 5 of the Information Technology Act, 2000</strong>, which grants legal validity to electronic records and signatures</li>
                  <li><strong>Signature Types:</strong> Drawn (canvas-based), typed (text rendering), or uploaded (image) — all stored securely as your authorized signatory mark</li>
                  <li><strong>Audit Trail:</strong> Each signed document includes a timestamp and the signer's identity for verification</li>
                  <li><strong>Non-Repudiation:</strong> Once applied, signatures serve as your authorized approval and cannot be disputed without proper grounds</li>
                  <li><strong>DSC Integration:</strong> For Class 2/3 Digital Signature Certificates (DSC), integration with eMudhra and NCode is available on Enterprise plans</li>
                </ul>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mt-4">
                  <p className="text-emerald-800 text-sm">
                    <strong>📜 Note:</strong> OkBill's electronic signatures are suitable for most business invoices and documents.
                    For documents requiring Class 2/3 DSC (e.g., ROC filings, government tenders), use the DSC integration feature.
                  </p>
                </div>
              </div>
            </div>

            {/* Acceptable Use */}
            <div id="acceptable-use" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">6. Acceptable Use Policy</h2>
              </div>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>You agree <strong>not</strong> to:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Use the Service for any illegal purpose or to generate fraudulent invoices</li>
                  <li>Attempt to bypass authentication, rate limits, or security measures</li>
                  <li>Upload malware, viruses, or malicious content</li>
                  <li>Share your account credentials with unauthorized parties</li>
                  <li>Use the Service to send unsolicited commercial communications (spam)</li>
                  <li>Scrape, crawl, or data-mine the Service without written permission</li>
                  <li>Resell or redistribute the Service without an authorized reseller agreement</li>
                  <li>Intentionally overload the Service (DDoS, excessive API calls)</li>
                </ul>
                <p>Violation of this policy may result in immediate suspension or termination of your account.</p>
              </div>
            </div>

            {/* IP */}
            <div id="ip" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-[#1E3A5F]" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">7. Intellectual Property</h2>
              </div>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Our IP:</strong> OkBill, its logo, UI design, code, and documentation are owned by OkBill and protected under Indian and international IP laws</li>
                  <li><strong>Your Data:</strong> You retain all rights to the data you create (invoices, client records, business data). We do not claim any ownership over your content</li>
                  <li><strong>License:</strong> You grant OkBill a limited license to process your data solely to provide the Service</li>
                  <li><strong>Feedback:</strong> Any suggestions or feedback you provide may be used to improve the Service without obligation or compensation</li>
                </ul>
              </div>
            </div>

            {/* Limitation */}
            <div id="limitation" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">8. Limitation of Liability</h2>
              </div>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <p>To the maximum extent permitted by law:</p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>OkBill is not liable for indirect, incidental, consequential, or punitive damages</li>
                  <li>Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim</li>
                  <li>We do not guarantee uninterrupted or error-free access to the Service</li>
                  <li>You are solely responsible for the accuracy of invoices, GST data, and tax calculations generated using the Service</li>
                  <li>We are not a licensed accounting or tax advisory firm — consult your CA/tax professional for compliance matters</li>
                </ul>
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-4">
                  <p className="text-amber-800 text-sm">
                    <strong>Disclaimer:</strong> While OkBill strives for accuracy in GST calculations and e-invoice generation,
                    the accuracy of tax data is your responsibility. Always verify filings with a certified Chartered Accountant.
                  </p>
                </div>
              </div>
            </div>

            {/* Termination */}
            <div id="termination" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">9. Termination</h2>
              </div>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>By You:</strong> You may terminate your account at any time via Settings → Account → Delete Account</li>
                  <li><strong>By Us:</strong> We may suspend or terminate your account for TOS violations, non-payment, or inactivity exceeding 12 months (with 30-day notice)</li>
                  <li><strong>Data on Termination:</strong> You may export your data before termination. After deletion, data is removed within 24 hours (except legally retained records)</li>
                  <li><strong>Survival:</strong> Sections regarding IP, liability, indemnification, and governing law survive termination</li>
                </ul>
              </div>
            </div>

            {/* Governing Law */}
            <div id="governing-law" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
                  <Gavel className="w-5 h-5 text-[#1E3A5F]" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">10. Governing Law & Disputes</h2>
              </div>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>These Terms are governed by the laws of <strong>India</strong></li>
                  <li>Any disputes shall be subject to the exclusive jurisdiction of the courts in <strong>New Delhi, India</strong></li>
                  <li>Before filing any legal claim, both parties agree to attempt resolution through good-faith negotiation for at least 30 days</li>
                  <li>Disputes may also be resolved through arbitration under the Arbitration and Conciliation Act, 1996</li>
                </ul>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
              <Button variant="outline" onClick={() => navigate('/privacy')} className="gap-2 rounded-xl">
                <Shield className="w-4 h-4" /> Privacy Policy
              </Button>
              <Button variant="outline" onClick={() => navigate('/refund-policy')} className="gap-2 rounded-xl">
                <CreditCard className="w-4 h-4" /> Refund Policy
              </Button>
              <Button variant="outline" onClick={() => navigate('/contact')} className="gap-2 rounded-xl">
                <Mail className="w-4 h-4" /> Contact Us
              </Button>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};

export default TermsOfServicePage;
