import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Shield,
  Clock,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Mail,
  ChevronRight,
  FileText,
} from 'lucide-react';

const RefundPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-[#1E3A5F]">
      {/* Mesh Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-200/20 blur-[120px]" />
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 mb-6">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Transparency First</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-900 mb-4">
              Refund & Cancellation <span className="text-emerald-600">Policy</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              We believe in fair, transparent billing. Here's everything you need to know about refunds,
              cancellations, and how we handle your subscription lifecycle.
            </p>
            <p className="text-sm text-slate-400 mt-4">Last updated: March 28, 2026</p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative z-10 pb-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto space-y-10">

            {/* ─── Quick Summary Cards ─── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass p-6 rounded-2xl border border-green-100 bg-green-50/30">
                <CheckCircle className="w-8 h-8 text-green-600 mb-3" />
                <h3 className="font-bold text-green-900 mb-1">Full Refund</h3>
                <p className="text-sm text-green-700">Cancel within 7 days for a complete refund, no questions asked.</p>
              </div>
              <div className="glass p-6 rounded-2xl border border-amber-100 bg-amber-50/30">
                <RefreshCw className="w-8 h-8 text-amber-600 mb-3" />
                <h3 className="font-bold text-amber-900 mb-1">Pro-Rata Refund</h3>
                <p className="text-sm text-amber-700">Cancel between 7–30 days and get a proportional refund for unused time.</p>
              </div>
              <div className="glass p-6 rounded-2xl border border-blue-100 bg-blue-50/30">
                <CreditCard className="w-8 h-8 text-blue-600 mb-3" />
                <h3 className="font-bold text-blue-900 mb-1">Original Payment</h3>
                <p className="text-sm text-blue-700">Refunds are processed via the same payment method used for purchase.</p>
              </div>
            </div>

            {/* ─── Refund Timeline Table ─── */}
            <div className="glass rounded-3xl border border-white/60 shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-emerald-400" />
                  <h2 className="text-xl font-bold text-white">Refund Timeline & Payment Modes</h2>
                </div>
                <p className="text-slate-400 text-sm mt-1">Complete breakdown by scenario</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left p-4 font-semibold text-slate-600 w-[40%]">Scenario</th>
                      <th className="text-left p-4 font-semibold text-slate-600 w-[25%]">Refund Amount</th>
                      <th className="text-left p-4 font-semibold text-slate-600 w-[15%]">Timeline</th>
                      <th className="text-left p-4 font-semibold text-slate-600 w-[20%]">Payment Mode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {
                        scenario: 'Cancellation within 24 hours of purchase',
                        amount: '100% (Full Refund)',
                        timeline: '5–7 business days',
                        mode: 'Original payment method',
                        color: 'green',
                      },
                      {
                        scenario: 'Cancellation within 7 days (no usage)',
                        amount: '100% (Full Refund)',
                        timeline: '7–10 business days',
                        mode: 'Original payment method',
                        color: 'green',
                      },
                      {
                        scenario: 'Cancellation within 7–30 days (partial usage)',
                        amount: 'Pro-rata refund for unused days',
                        timeline: '10–15 business days',
                        mode: 'Original method / Bank transfer',
                        color: 'amber',
                      },
                      {
                        scenario: 'Cancellation after 30 days',
                        amount: 'No cash refund — credit note issued',
                        timeline: 'Immediate credit',
                        mode: 'Platform credit',
                        color: 'red',
                      },
                      {
                        scenario: 'Annual plan cancellation (mid-cycle)',
                        amount: 'Pro-rata refund for unused full months',
                        timeline: '15 business days',
                        mode: 'Original payment method',
                        color: 'amber',
                      },
                      {
                        scenario: 'Downgrade from higher to lower plan',
                        amount: 'Credit note for price difference',
                        timeline: 'Applied to next cycle',
                        mode: 'Platform credit',
                        color: 'blue',
                      },
                      {
                        scenario: 'Service downtime exceeding 24 hours',
                        amount: 'Proportional credit for downtime period',
                        timeline: 'Within 5 business days',
                        mode: 'Platform credit',
                        color: 'blue',
                      },
                      {
                        scenario: 'Duplicate / double payment',
                        amount: '100% of duplicate amount',
                        timeline: '3–5 business days',
                        mode: 'Original payment method',
                        color: 'green',
                      },
                      {
                        scenario: 'Failed transaction reversal',
                        amount: '100% auto-refund',
                        timeline: '5–7 business days',
                        mode: 'Original payment method',
                        color: 'green',
                      },
                    ].map((row, i) => {
                      const bgMap: Record<string, string> = {
                        green: 'bg-green-50/50',
                        amber: 'bg-amber-50/50',
                        red: 'bg-red-50/50',
                        blue: 'bg-blue-50/50',
                      };
                      const badgeMap: Record<string, string> = {
                        green: 'bg-green-100 text-green-700 border-green-200',
                        amber: 'bg-amber-100 text-amber-700 border-amber-200',
                        red: 'bg-red-100 text-red-700 border-red-200',
                        blue: 'bg-blue-100 text-blue-700 border-blue-200',
                      };
                      return (
                        <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50/80 transition-colors ${i % 2 === 0 ? '' : bgMap[row.color]}`}>
                          <td className="p-4 text-slate-800 font-medium">{row.scenario}</td>
                          <td className="p-4">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeMap[row.color]}`}>
                              {row.amount}
                            </span>
                          </td>
                          <td className="p-4 text-slate-600">{row.timeline}</td>
                          <td className="p-4 text-slate-600">{row.mode}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─── Detailed Policy Sections ─── */}
            {[
              {
                icon: XCircle,
                title: 'Subscription Cancellation',
                iconColor: 'text-emerald-600',
                bgColor: 'bg-emerald-50',
                content: [
                  'You may cancel your subscription at any time from your account Settings → Billing page.',
                  'Upon cancellation, your account remains active until the end of your current billing cycle.',
                  'After the billing period ends, your account will be downgraded to a read-only mode for 30 days.',
                  'After the 30-day grace period, your data will be permanently deleted unless you reactivate.',
                  'Cancellation of annual plans is processed with a refund for remaining unused full months (partial months are not refunded).',
                ],
              },
              {
                icon: RefreshCw,
                title: 'Upgrade & Downgrade Policy',
                iconColor: 'text-emerald-600',
                bgColor: 'bg-emerald-50',
                content: [
                  'When you upgrade mid-cycle, you are charged the pro-rated difference for the remaining days in your billing period.',
                  'When you downgrade, a credit note is issued for the price difference. This credit is applied to your next billing cycle.',
                  'Plan changes take effect immediately — you gain or lose features right away.',
                  'If you upgrade and then cancel within 24 hours, the full upgrade charge is refunded.',
                ],
              },
              {
                icon: Clock,
                title: 'Free Trial Policy',
                iconColor: 'text-blue-600',
                bgColor: 'bg-blue-50',
                content: [
                  'All new accounts receive a 14-day free trial with full access to Professional plan features.',
                  'No payment information is required to start a trial.',
                  'If you do not subscribe before the trial ends, your account is automatically downgraded to read-only mode.',
                  'Trial periods cannot be extended or restarted once expired.',
                  'Data created during the trial is preserved for 30 days after trial expiry.',
                ],
              },
              {
                icon: AlertTriangle,
                title: 'Non-Refundable Items',
                iconColor: 'text-amber-600',
                bgColor: 'bg-amber-50',
                content: [
                  'One-time setup fees and custom onboarding charges are non-refundable.',
                  'Custom development and integration work billed separately is non-refundable.',
                  'Third-party add-ons and marketplace purchases are governed by the respective vendor\'s refund policy.',
                  'SMS/email notification credits once consumed cannot be refunded.',
                  'Domain registration fees (if applicable) are non-refundable.',
                ],
              },
              {
                icon: Shield,
                title: 'Dispute Resolution',
                iconColor: 'text-green-600',
                bgColor: 'bg-green-50',
                content: [
                  'If you believe you have been incorrectly charged, contact our billing team within 60 days of the charge.',
                  'We will investigate and respond within 5 business days.',
                  'If the dispute is resolved in your favor, the refund will be processed within 7–10 business days.',
                  'For unresolved disputes, you may escalate to our Grievance Officer via email.',
                  'All disputes are governed by the laws of India, with jurisdiction in Bangalore, Karnataka.',
                ],
              },
              {
                icon: FileText,
                title: 'Data Retention After Cancellation',
                iconColor: 'text-slate-600',
                bgColor: 'bg-slate-100',
                content: [
                  'After cancellation, your data is retained for 30 days in read-only mode.',
                  'During this period, you can export all invoices, reports, and customer data.',
                  'After 30 days, all data is permanently and irreversibly deleted from our servers.',
                  'We recommend exporting your data before cancellation. We cannot recover data after deletion.',
                  'Backup copies are purged from all systems within 90 days of account deletion.',
                ],
              },
            ].map((section, i) => (
              <div key={i} className="glass rounded-2xl border border-white shadow-lg p-8">
                <div className="flex items-center gap-3 mb-5">
                  <div className={`w-10 h-10 rounded-xl ${section.bgColor} flex items-center justify-center`}>
                    <section.icon className={`w-5 h-5 ${section.iconColor}`} />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, j) => (
                    <li key={j} className="flex items-start gap-3 text-slate-600 leading-relaxed">
                      <ChevronRight className="w-4 h-4 text-emerald-400 mt-1 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* ─── How to Request a Refund ─── */}
            <div className="glass rounded-3xl border border-emerald-100 shadow-xl overflow-hidden bg-gradient-to-br from-emerald-50/50 to-white">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">How to Request a Refund</h2>
                    <p className="text-sm text-slate-500">Three easy ways to reach us</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                    <div className="text-2xl mb-2">📧</div>
                    <h4 className="font-semibold text-slate-800 mb-1">Email</h4>
                    <p className="text-sm text-slate-600">Send your refund request to</p>
                    <p className="text-sm font-semibold text-emerald-600 mt-1">support@okebill.com</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                    <div className="text-2xl mb-2">💬</div>
                    <h4 className="font-semibold text-slate-800 mb-1">In-App</h4>
                    <p className="text-sm text-slate-600">Navigate to Settings → Billing → Request Refund</p>
                  </div>
                  <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
                    <div className="text-2xl mb-2">📞</div>
                    <h4 className="font-semibold text-slate-800 mb-1">Phone</h4>
                    <p className="text-sm text-slate-600">Call our support line</p>
                    <p className="text-sm font-semibold text-emerald-600 mt-1">+91 80-4567-8901</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-4">
                  Please include your registered email, invoice/transaction ID, and reason for refund in your request.
                  Our team typically responds within 24 hours on business days.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-8 relative z-10">
        <div className="container mx-auto px-6 text-center">
          <p className="text-slate-400 text-sm">© 2026 OkeBill. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-3 text-sm text-slate-500">
            <span className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate('/')}>Home</span>
            <span className="hover:text-emerald-600 cursor-pointer" onClick={() => navigate('/refund-policy')}>Refund Policy</span>
            <span className="hover:text-emerald-600 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-emerald-600 cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RefundPolicyPage;
