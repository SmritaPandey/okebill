import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  ArrowLeft, Mail, Phone, Clock, MessageSquare, HelpCircle,
  ChevronDown, ChevronUp, Send, Shield, FileText, MapPin,
} from 'lucide-react';

const faqs = [
  { q: 'How do I generate a GST-compliant invoice?', a: 'Go to Dashboard → Invoices → Create Invoice. Fill in client details, add items with HSN/SAC codes, and OkBill automatically calculates CGST/SGST or IGST based on the place of supply.' },
  { q: 'What is e-invoicing and do I need it?', a: 'E-invoicing is mandatory for businesses with turnover above ₹5 crore. OkBill integrates with the NIC/IRP portal to generate IRN and QR codes automatically on eligible invoices.' },
  { q: 'How do digital signatures work on invoices?', a: 'Go to Settings → Branding → Signature. You can draw, type, or upload your signature. Once saved, it appears on all invoices and printed documents as "Authorized Signatory".' },
  { q: 'Can I export my data?', a: 'Yes! Go to Settings → Account and click "Export My Data". You\'ll receive a JSON file containing all your account data, invoices, clients, and settings — fully portable.' },
  { q: 'How do I delete my account?', a: 'Go to Settings → Account → Danger Zone → Delete Account. You\'ll need to confirm with your email and password. This action is permanent and irreversible.' },
  { q: 'What payment methods are supported?', a: 'OkBill uses Razorpay and supports UPI, credit/debit cards, net banking, and wallets. Your clients can pay invoices directly through payment links.' },
  { q: 'Is my financial data secure?', a: 'Yes. All data is encrypted with AES-256 at rest and TLS 1.3 in transit. Passwords use bcrypt hashing. We never store card numbers — payments are handled entirely by Razorpay.' },
  { q: 'What happens when my trial expires?', a: 'After the 14-day free trial, you can choose a paid plan or continue with limited free features. Your data is never deleted due to trial expiry.' },
];

const ContactSupportPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      toast.error('Please fill in all fields');
      return;
    }
    setSending(true);
    // Simulate sending — in production, POST to /support/contact
    await new Promise(r => setTimeout(r, 1200));
    toast.success('Message sent! We\'ll respond within 24 hours.');
    setName(''); setEmail(''); setSubject(''); setMessage('');
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-emerald-100 selection:text-[#1E3A5F]">
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
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 mb-6">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">We're Here to Help</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight text-slate-900 mb-4">
              Contact & <span className="text-emerald-600">Support</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Have a question, need help, or want to share feedback? Reach out and we'll get back to you within 24 hours.
            </p>
          </div>
        </div>
      </section>

      <section className="relative z-10 pb-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">

            {/* Contact Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-12">
              {[
                { icon: Mail, title: 'Email Support', detail: 'support@okebill.com', sub: 'Response within 24 hours', color: 'emerald' },
                { icon: Phone, title: 'Phone', detail: '+91 11 4000 XXXX', sub: 'Mon-Sat 9AM – 7PM IST', color: 'navy' },
                { icon: Clock, title: 'Business Hours', detail: 'Monday – Saturday', sub: '9:00 AM – 7:00 PM IST', color: 'amber' },
              ].map(card => (
                <div key={card.title} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
                  <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-4 ${
                    card.color === 'emerald' ? 'bg-emerald-100' : card.color === 'navy' ? 'bg-[#1E3A5F]/10' : 'bg-amber-100'
                  }`}>
                    <card.icon className={`w-6 h-6 ${
                      card.color === 'emerald' ? 'text-emerald-600' : card.color === 'navy' ? 'text-[#1E3A5F]' : 'text-amber-600'
                    }`} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-1">{card.title}</h3>
                  <p className="text-emerald-600 font-semibold text-sm">{card.detail}</p>
                  <p className="text-xs text-slate-400 mt-1">{card.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Contact Form */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-600" />
                  Send a Message
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Your Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="john@company.com" className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Invoice issue, feature request..." className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Describe your question or issue in detail..."
                      className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 min-h-[120px] resize-y"
                    />
                  </div>
                  <Button type="submit" disabled={sending} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl gap-2">
                    {sending ? 'Sending...' : <><Send className="w-4 h-4" /> Send Message</>}
                  </Button>
                </form>
              </div>

              {/* FAQs */}
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-[#1E3A5F]" />
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {faqs.map((faq, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-medium text-slate-800 text-sm pr-4">{faq.q}</span>
                        {openFaq === i ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Office Address */}
            <div className="mt-12 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#1E3A5F]/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-[#1E3A5F]" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Registered Office</h2>
              </div>
              <p className="text-slate-600">OkBill Technologies Pvt. Ltd.</p>
              <p className="text-slate-500 text-sm">New Delhi, India 110001</p>
              <p className="text-slate-500 text-sm mt-2">CIN: U74110DL2025PTC123456</p>
            </div>

            {/* Footer Navigation */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
              <Button variant="outline" onClick={() => navigate('/privacy')} className="gap-2 rounded-xl">
                <Shield className="w-4 h-4" /> Privacy Policy
              </Button>
              <Button variant="outline" onClick={() => navigate('/terms')} className="gap-2 rounded-xl">
                <FileText className="w-4 h-4" /> Terms of Service
              </Button>
              <Button variant="outline" onClick={() => navigate('/refund-policy')} className="gap-2 rounded-xl">
                <Shield className="w-4 h-4" /> Refund Policy
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactSupportPage;
