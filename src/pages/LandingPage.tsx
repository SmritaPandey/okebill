import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  CheckCircle,
  BarChart3,
  FileText,
  Receipt,
  CreditCard,
  Globe,
  ShieldCheck,
  Zap,
  Menu,
  X,
  Truck,
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const handleGetStarted = () => navigate('/register');
  const handleLogin = () => navigate('/login');

  // Pricing data
  const plans = [
    {
      name: 'Starter',
      monthlyPrice: 2999,
      yearlyPrice: 2399,
      features: ['Up to 10 clients', 'Unlimited invoices', 'Basic analytics', 'E-Way Bill support', 'Help center support'],
      cta: 'Get Started',
      highlighted: false,
    },
    {
      name: 'Professional',
      monthlyPrice: 7499,
      yearlyPrice: 5999,
      features: ['Unlimited clients', 'Interactive proposals', 'Custom branding', 'E-Way Bill + E-Invoicing', 'CRM integrations', 'Priority support'],
      cta: 'Start 14-day Trial',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      monthlyPrice: 0,
      yearlyPrice: 0,
      features: ['Direct API access', 'SLA guarantees', 'Dedicated success manager', 'Custom security features', 'Multi-branch support'],
      cta: 'Talk to Sales',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-zinc-900 selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">

      {/* ─── Navigation ─── */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-2' : 'py-4'}`}>
        <div className="container mx-auto px-6">
          <div className={`mx-auto max-w-6xl px-6 py-3 rounded-2xl flex items-center justify-between transition-all duration-500 ${
            scrolled
              ? 'bg-white/80 backdrop-blur-2xl shadow-lg shadow-black/5 border border-zinc-200/50'
              : 'bg-transparent'
          }`}>
            <div
              className="flex items-center gap-2.5 cursor-pointer group"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md shadow-emerald-200 group-hover:shadow-lg group-hover:shadow-emerald-300 transition-shadow">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-zinc-900">
                OkBill
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {['Features', 'Pricing'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors duration-200"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={handleLogin}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 px-4 py-2 transition-colors"
              >
                Log in
              </button>
              <Button
                onClick={handleGetStarted}
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-sm hover:shadow-md transition-all duration-200"
              >
                Get Started
                <ArrowRight className="ml-1.5 w-4 h-4" />
              </Button>
            </div>

            {/* Mobile Toggle */}
            <button className="md:hidden text-zinc-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-white md:hidden pt-24 px-6 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-4">
            {['Features', 'Pricing'].map((item) => (
              <button key={item} onClick={() => scrollToSection(item.toLowerCase())} className="text-left py-4 border-b border-zinc-100 text-lg font-medium text-zinc-700">
                {item}
              </button>
            ))}
            <Button onClick={handleGetStarted} className="mt-6 w-full py-6 text-base bg-zinc-900">Get Started</Button>
            <Button variant="outline" onClick={handleLogin} className="w-full py-6 text-base">Log In</Button>
          </div>
        </div>
      )}

      {/* ─── Hero Section ─── */}
      <section className="relative pt-36 pb-24 overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/40 via-white to-white pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-radial from-emerald-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-700 tracking-wide">Simple · Hisab · Accurate</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight text-zinc-900 mb-6">
              Billing that moves
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                as fast as you do.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-500 mb-10 max-w-xl mx-auto leading-relaxed font-light">
              GST-compliant invoicing, e-way bills, and financial management — all in one beautifully simple platform.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={handleGetStarted}
                className="bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-6 rounded-2xl text-base group shadow-xl shadow-zinc-200 hover:shadow-2xl hover:shadow-zinc-300 transition-all duration-300"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleLogin}
                className="px-8 py-6 rounded-2xl text-base text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              >
                View Demo
              </Button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-zinc-900 rounded-2xl shadow-2xl shadow-zinc-300/50 overflow-hidden border border-zinc-800">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-5 py-3 bg-zinc-800 border-b border-zinc-700">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-zinc-600" />
                  <div className="w-3 h-3 rounded-full bg-zinc-600" />
                  <div className="w-3 h-3 rounded-full bg-zinc-600" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-zinc-700 rounded-lg px-4 py-1 text-xs text-zinc-400 font-mono">
                    app.okebill.com/dashboard
                  </div>
                </div>
              </div>
              {/* Dashboard content */}
              <div className="p-6 grid grid-cols-12 gap-4 min-h-[350px]">
                <div className="col-span-3 space-y-3">
                  <div className="h-8 bg-zinc-800 rounded-lg" />
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className={`h-9 rounded-lg ${i === 1 ? 'bg-emerald-600/20 border border-emerald-500/30' : 'bg-zinc-800/50'}`} />
                    ))}
                  </div>
                </div>
                <div className="col-span-9 space-y-4">
                  <div className="flex justify-between">
                    <div className="h-8 w-40 bg-zinc-800 rounded-lg" />
                    <div className="h-8 w-28 bg-emerald-600 rounded-lg" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['₹4,52,000', '₹1,23,400', '₹78,600'].map((val, i) => (
                      <div key={i} className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                        <div className="h-3 w-16 bg-zinc-700 rounded mb-2" />
                        <div className="text-lg font-bold text-white">{val}</div>
                      </div>
                    ))}
                  </div>
                  <div className="h-40 bg-zinc-800/30 rounded-xl border border-zinc-700/30 overflow-hidden relative">
                    <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="chartGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d="M0 70 C40 60 80 40 120 45 C160 50 200 25 240 30 C280 35 320 15 360 20 C380 22 400 25 400 25 L400 100 L0 100 Z" fill="url(#chartGrad)" />
                      <path d="M0 70 C40 60 80 40 120 45 C160 50 200 25 240 30 C280 35 320 15 360 20 C380 22 400 25 400 25" fill="none" stroke="#10b981" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-16 border-y border-zinc-100 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center max-w-3xl mx-auto">
            {[
              { value: '10,000+', label: 'Invoices Generated' },
              { value: '99.9%', label: 'Uptime Guarantee' },
              { value: '140+', label: 'Countries Supported' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-bold text-zinc-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="py-28 relative">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-20">
            <span className="text-emerald-600 font-semibold tracking-wide uppercase text-xs mb-3 block">Platform</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
              Everything you need, nothing you don't.
            </h2>
            <p className="text-zinc-500 text-lg font-light">
              A cohesive ecosystem for your complete revenue flow — from invoicing to compliance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: FileText, title: 'Smart Proposals', desc: 'Build stunning proposals that clients can sign digitally in seconds.' },
              { icon: Receipt, title: 'Automated Billing', desc: 'Recurring subscriptions or one-off invoices. Set it once, let it run.' },
              { icon: Globe, title: 'GST Compliance', desc: 'E-invoicing, GSTR-1 & 3B filing, automatic tax calculations built-in.' },
              { icon: Truck, title: 'E-Way Bills', desc: 'Generate and track e-way bills directly from your invoices.' },
              { icon: BarChart3, title: 'Revenue Analytics', desc: 'Real-time dashboards showing MRR, churn, and cash flow projections.' },
              { icon: Zap, title: 'API Integration', desc: 'Connect to 2,000+ apps via webhooks and our developer-first API.' }
            ].map((f, i) => (
              <div
                key={i}
                className="group p-7 rounded-2xl border border-zinc-100 bg-white hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-100 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-11 h-11 rounded-xl bg-zinc-50 flex items-center justify-center mb-5 group-hover:bg-emerald-50 transition-colors duration-300">
                  <f.icon className="w-5 h-5 text-zinc-400 group-hover:text-emerald-600 transition-colors duration-300" />
                </div>
                <h4 className="text-lg font-semibold mb-2 text-zinc-900">{f.title}</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ─── */}
      <section id="pricing" className="py-28 bg-zinc-50 relative">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-emerald-600 font-semibold tracking-wide uppercase text-xs mb-3 block">Pricing</span>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 mb-4">
              Scale with confidence.
            </h2>
            <p className="text-zinc-500 text-lg font-light mb-8">
              Predictable pricing for every stage of your growth.
            </p>

            {/* Monthly / Yearly Toggle */}
            <div className="inline-flex items-center bg-white border border-zinc-200 rounded-xl p-1 shadow-sm">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !isYearly ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isYearly ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-700'
                }`}
              >
                Yearly
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`rounded-2xl p-8 flex flex-col transition-all duration-300 ${
                  plan.highlighted
                    ? 'bg-zinc-900 text-white shadow-2xl shadow-zinc-300 scale-[1.02] border border-zinc-700'
                    : 'bg-white border border-zinc-200 hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-100'
                }`}
              >
                {plan.highlighted && (
                  <div className="mb-4">
                    <span className="bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                      Recommended
                    </span>
                  </div>
                )}
                <h4 className={`text-lg font-semibold mb-2 ${plan.highlighted ? 'text-white' : 'text-zinc-900'}`}>
                  {plan.name}
                </h4>
                <div className="flex items-baseline gap-1 mb-6">
                  {plan.monthlyPrice > 0 ? (
                    <>
                      <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-zinc-900'}`}>
                        ₹{(isYearly ? plan.yearlyPrice : plan.monthlyPrice).toLocaleString('en-IN')}
                      </span>
                      <span className={`text-sm ${plan.highlighted ? 'text-zinc-400' : 'text-zinc-400'}`}>/mo</span>
                      {isYearly && (
                        <span className="ml-2 text-xs line-through text-zinc-400">
                          ₹{plan.monthlyPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-zinc-900'}`}>Custom</span>
                  )}
                </div>
                {isYearly && plan.monthlyPrice > 0 && (
                  <div className={`text-xs mb-4 ${plan.highlighted ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    ₹{(plan.yearlyPrice * 12).toLocaleString('en-IN')}/year — save ₹{((plan.monthlyPrice - plan.yearlyPrice) * 12).toLocaleString('en-IN')}
                  </div>
                )}
                <ul className="space-y-3 mb-8 flex-grow">
                  {plan.features.map(feature => (
                    <li key={feature} className={`flex items-center gap-2.5 text-sm ${plan.highlighted ? 'text-zinc-300' : 'text-zinc-600'}`}>
                      <CheckCircle className={`w-4 h-4 flex-shrink-0 ${plan.highlighted ? 'text-emerald-400' : 'text-emerald-500'}`} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={plan.monthlyPrice > 0 ? handleGetStarted : undefined}
                  className={`w-full py-5 rounded-xl font-medium transition-all duration-200 ${
                    plan.highlighted
                      ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-lg'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800'
                  }`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-white pt-20 pb-10 border-t border-zinc-100">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16 max-w-5xl mx-auto">
            <div className="col-span-2 lg:col-span-2 pr-8">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <FileText className="text-white w-4 h-4" />
                </div>
                <span className="text-lg font-bold tracking-tight text-zinc-900">OkBill</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                The comprehensive GST-compliant billing and business management platform. Built in India, for the world.
              </p>
              <p className="text-zinc-400 text-xs">A Panchadharma Digital Innovation</p>
            </div>
            <div>
              <h5 className="font-semibold text-zinc-900 mb-4 text-sm">Product</h5>
              <ul className="space-y-3 text-sm text-zinc-400">
                {['Features', 'Pricing'].map(item => (
                  <li key={item} onClick={() => scrollToSection(item.toLowerCase())} className="hover:text-zinc-700 cursor-pointer transition-colors">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-zinc-900 mb-4 text-sm">Legal</h5>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="hover:text-zinc-700 cursor-pointer transition-colors" onClick={() => navigate('/refund-policy')}>Refund Policy</li>
                <li className="hover:text-zinc-700 cursor-pointer transition-colors" onClick={() => navigate('/privacy')}>Privacy Policy</li>
                <li className="hover:text-zinc-700 cursor-pointer transition-colors" onClick={() => navigate('/terms')}>Terms of Service</li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold text-zinc-900 mb-4 text-sm">Contact</h5>
              <ul className="space-y-3 text-sm text-zinc-400">
                <li className="hover:text-zinc-700 cursor-pointer transition-colors" onClick={() => navigate('/contact')}>Support</li>
                <li>demo@okebill.com</li>
                <li>okebill.com</li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
            <p className="text-zinc-400 text-xs">© 2026 OkBill. All rights reserved.</p>
            <div className="flex gap-6 text-zinc-400 text-xs">
              <span className="hover:text-zinc-600 cursor-pointer transition-colors" onClick={() => navigate('/refund-policy')}>Refund Policy</span>
              <span className="hover:text-zinc-600 cursor-pointer transition-colors" onClick={() => navigate('/privacy')}>Privacy Policy</span>
              <span className="hover:text-zinc-600 cursor-pointer transition-colors" onClick={() => navigate('/terms')}>Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
