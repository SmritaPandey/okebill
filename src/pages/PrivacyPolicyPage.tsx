import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Shield, Eye, Database, Lock, UserCheck, Globe,
  Server, Clock, Mail, ChevronRight, FileText, Trash2,
} from 'lucide-react';

const sections = [
  { id: 'collection', label: 'Data Collection', icon: Database },
  { id: 'usage', label: 'How We Use Data', icon: Eye },
  { id: 'sharing', label: 'Data Sharing', icon: Globe },
  { id: 'storage', label: 'Storage & Security', icon: Server },
  { id: 'retention', label: 'Retention', icon: Clock },
  { id: 'rights', label: 'Your Rights', icon: UserCheck },
  { id: 'cookies', label: 'Cookies', icon: FileText },
  { id: 'deletion', label: 'Account Deletion', icon: Trash2 },
  { id: 'contact', label: 'Contact Us', icon: Mail },
];

const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-[#1E3A5F]">
      {/* Mesh Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#1E3A5F]/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/logo.png" alt="OkeBill" className="w-8 h-8" />
              <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                Ok<span className="text-emerald-500 bg-clip-padding">e</span>Bill
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
              <Shield className="w-4 h-4 text-[#1E3A5F]" />
              <span className="text-xs font-bold text-[#1E3A5F] uppercase tracking-widest">Your Data, Your Rights</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-900 mb-4">
              Privacy <span className="text-emerald-600">Policy</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We take your privacy seriously. This policy explains how OkeBill collects, uses, and protects your data in compliance with the
              <strong> Digital Personal Data Protection Act, 2023 (India)</strong> and international privacy standards.
            </p>
            <p className="text-sm text-slate-400 mt-4">Last updated: March 29, 2026</p>
          </div>
        </div>
      </section>

      {/* Quick Navigation */}
      <section className="relative z-10 pb-8">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Quick Navigation</h2>
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

            {/* 1. Data Collection */}
            <div id="collection" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
                  <Database className="w-5 h-5 text-[#1E3A5F]" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">1. Information We Collect</h2>
              </div>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <h3 className="text-lg font-semibold text-slate-800">a) Information You Provide</h3>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Account Information:</strong> Name, email address, phone number, company name, GSTIN, PAN</li>
                  <li><strong>Financial Information:</strong> Bank account details (account number, IFSC, branch), UPI ID</li>
                  <li><strong>Business Data:</strong> Client details, invoices, products, proposals, contracts, payment records</li>
                  <li><strong>Digital Signatures:</strong> Drawn, typed, or uploaded signatures for invoice authentication</li>
                  <li><strong>Communication:</strong> Support requests, feedback, and correspondence</li>
                </ul>

                <h3 className="text-lg font-semibold text-slate-800 mt-6">b) Information Collected Automatically</h3>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns</li>
                  <li><strong>Device Information:</strong> Browser type, OS, screen resolution, IP address</li>
                  <li><strong>Cookies:</strong> Session cookies for authentication and preference storage</li>
                </ul>

                <h3 className="text-lg font-semibold text-slate-800 mt-6">c) Third-Party Information</h3>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>OAuth Providers:</strong> Name and email from Google or Microsoft when you use social login</li>
                  <li><strong>Payment Processors:</strong> Transaction status from Razorpay (we never store card numbers)</li>
                  <li><strong>GST APIs:</strong> GSTIN verification data from Masters India / NIC GST portal</li>
                </ul>
              </div>
            </div>

            {/* 2. How We Use Data */}
            <div id="usage" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">2. How We Use Your Data</h2>
              </div>
              <div className="space-y-3 text-slate-600 leading-relaxed">
                <div className="grid md:grid-cols-2 gap-4">
                  {[
                    { title: 'Service Delivery', desc: 'Creating invoices, managing clients, processing payments, generating reports' },
                    { title: 'GST Compliance', desc: 'GSTR-1 filing, e-invoicing via IRP, e-Way bill generation' },
                    { title: 'Communication', desc: 'Transactional emails (invoice sent, payment received), support responses' },
                    { title: 'Security', desc: 'Fraud detection, abuse prevention, login anomaly detection' },
                    { title: 'Improvement', desc: 'Feature analytics, performance optimization, AI chatbot training' },
                    { title: 'Legal', desc: 'Compliance with tax laws, court orders, regulatory requirements' },
                  ].map(item => (
                    <div key={item.title} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <h4 className="font-semibold text-slate-800 mb-1">{item.title}</h4>
                      <p className="text-sm">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Data Sharing */}
            <div id="sharing" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">3. Data Sharing & Third Parties</h2>
              </div>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <p className="text-emerald-800 font-semibold">🔒 We never sell your data to third parties.</p>
                </div>
                <p>We share data only in these limited circumstances:</p>
                <ul className="space-y-3">
                  {[
                    { who: 'Razorpay', why: 'Payment processing — only transaction amounts and invoice references' },
                    { who: 'Masters India / NIC', why: 'GST compliance — GSTIN verification, e-invoice generation, GSTR-1 filing' },
                    { who: 'Email Service', why: 'Transactional emails — recipient email and invoice data for email delivery' },
                    { who: 'Law Enforcement', why: 'When required by court order, legal obligation, or regulatory authority' },
                  ].map(item => (
                    <li key={item.who} className="flex gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="font-semibold text-[#1E3A5F] min-w-[130px]">{item.who}</div>
                      <div className="text-sm">{item.why}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 4. Storage & Security */}
            <div id="storage" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[#1E3A5F]" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">4. Storage & Security</h2>
              </div>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
                  <li><strong>Password Hashing:</strong> Passwords are hashed using bcrypt with salt rounds, never stored in plain text</li>
                  <li><strong>Access Control:</strong> Role-based access, JWT authentication with auto-expiry</li>
                  <li><strong>Infrastructure:</strong> Data stored on secure PostgreSQL databases with daily backups</li>
                  <li><strong>Rate Limiting:</strong> API rate limiting and brute-force protection on login endpoints</li>
                  <li><strong>Monitoring:</strong> Continuous security monitoring and vulnerability scanning</li>
                </ul>
              </div>
            </div>

            {/* 5. Retention */}
            <div id="retention" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">5. Data Retention</h2>
              </div>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-4 py-3 font-semibold text-slate-700">Data Type</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700">Retention Period</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['Account Information', 'Until account deletion + 30 days grace'],
                        ['Invoice & Financial Records', '8 years (as per Indian Income Tax Act)'],
                        ['GST Records', '6 years minimum (as per GST Act)'],
                        ['Payment Transaction Logs', '7 years (RBI guidelines)'],
                        ['Support Communications', '2 years after resolution'],
                        ['Usage Analytics', '12 months (anonymized after)'],
                        ['Session/Auth Tokens', '24 hours (auto-expire)'],
                      ].map(([type, period]) => (
                        <tr key={type} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-medium text-slate-700">{type}</td>
                          <td className="px-4 py-3">{period}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 6. Your Rights */}
            <div id="rights" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">6. Your Rights (DPDP Act 2023)</h2>
              </div>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>Under the Digital Personal Data Protection Act 2023 and applicable regulations, you have the right to:</p>
                <div className="grid md:grid-cols-2 gap-3">
                  {[
                    { right: 'Access', desc: 'Request a copy of all personal data we hold about you' },
                    { right: 'Correction', desc: 'Request correction of inaccurate or incomplete data' },
                    { right: 'Deletion', desc: 'Request permanent deletion of your account and data' },
                    { right: 'Portability', desc: 'Export your data in a machine-readable format (JSON)' },
                    { right: 'Withdraw Consent', desc: 'Withdraw consent for data processing at any time' },
                    { right: 'Grievance Redressal', desc: 'File complaints with our Data Protection Officer' },
                  ].map(item => (
                    <div key={item.right} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                      <h4 className="font-bold text-emerald-800 mb-1">Right to {item.right}</h4>
                      <p className="text-sm text-emerald-700">{item.desc}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm mt-4">
                  To exercise any of these rights, go to <strong>Settings → Account</strong> or email us at{' '}
                  <a href="mailto:privacy@okebill.com" className="text-emerald-600 underline">privacy@okebill.com</a>.
                </p>
              </div>
            </div>

            {/* 7. Cookies */}
            <div id="cookies" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">7. Cookies & Local Storage</h2>
              </div>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>OkeBill uses minimal cookies and browser local storage:</p>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-4 py-3 font-semibold text-slate-700">Name</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700">Purpose</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-700">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ['auth_token', 'JWT session authentication', '24 hours'],
                        ['auth_user', 'Cached user profile for faster UI', 'Session'],
                        ['theme_preference', 'Dark/light mode preference', 'Persistent'],
                      ].map(([name, purpose, duration]) => (
                        <tr key={name} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-mono text-xs text-[#1E3A5F] font-bold">{name}</td>
                          <td className="px-4 py-3">{purpose}</td>
                          <td className="px-4 py-3">{duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm">We do <strong>not</strong> use advertising cookies, tracking pixels, or third-party analytics that identify individuals.</p>
              </div>
            </div>

            {/* 8. Account Deletion */}
            <div id="deletion" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">8. Account Deletion</h2>
              </div>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>You can permanently delete your account at any time:</p>
                <ol className="list-decimal list-inside space-y-2 ml-2">
                  <li>Go to <strong>Settings → Account → Danger Zone</strong></li>
                  <li>Click <strong>"Delete Account"</strong></li>
                  <li>Confirm by typing your email and entering your password</li>
                  <li>All data is permanently removed within 24 hours</li>
                </ol>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                  <p className="text-red-800 text-sm">
                    <strong>⚠ Warning:</strong> Account deletion is irreversible. All invoices, clients, products, payment records,
                    and settings will be permanently destroyed. Financial records required by law (GST, Income Tax Acts) may be
                    retained in anonymized form for the legally mandated period.
                  </p>
                </div>
              </div>
            </div>

            {/* 9. Contact */}
            <div id="contact" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">9. Contact & Grievance Officer</h2>
              </div>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>For privacy concerns, data requests, or grievances:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <h4 className="font-semibold text-slate-800 mb-2">Data Protection Officer</h4>
                    <p className="text-sm">Email: <a href="mailto:privacy@okebill.com" className="text-emerald-600 underline">privacy@okebill.com</a></p>
                    <p className="text-sm">Response time: Within 72 hours</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                    <h4 className="font-semibold text-slate-800 mb-2">General Support</h4>
                    <p className="text-sm">Email: <a href="mailto:support@okebill.com" className="text-emerald-600 underline">support@okebill.com</a></p>
                    <p className="text-sm">Hours: Mon–Sat, 9 AM – 7 PM IST</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
              <Button variant="outline" onClick={() => navigate('/terms')} className="gap-2 rounded-xl">
                <FileText className="w-4 h-4" /> Terms of Service
              </Button>
              <Button variant="outline" onClick={() => navigate('/refund-policy')} className="gap-2 rounded-xl">
                <Shield className="w-4 h-4" /> Refund Policy
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

export default PrivacyPolicyPage;
