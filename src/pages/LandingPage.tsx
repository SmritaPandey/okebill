import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle, BarChart, FileText, Receipt, CreditCard, Users } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-brand-blue">BillWise</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/#features" className="text-sm font-medium text-gray-600 hover:text-gray-900">Features</Link>
            <Link to="/#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link to="/#testimonials" className="text-sm font-medium text-gray-600 hover:text-gray-900">Testimonials</Link>
            <Link to="/#contact" className="text-sm font-medium text-gray-600 hover:text-gray-900">Contact</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link to="/register">
              <Button>
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none text-brand-blue">
                Streamline Your Billing Process
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                From proposals to payments, manage your entire billing workflow with our comprehensive SaaS platform.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link to="/register">
                  <Button size="lg">
                    Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Book a Demo
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <img
                src="/placeholder.svg"
                alt="Dashboard Preview"
                className="rounded-lg shadow-xl"
                width={600}
                height={400}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-brand-blue">
                Powerful Features
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Everything you need to manage your billing process from end to end.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
              <div className="rounded-full bg-brand-blue-light/10 p-3">
                <FileText className="h-6 w-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-bold">Proposal Generation</h3>
              <p className="text-center text-gray-500">Create professional proposals and convert them to contracts with a single click.</p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
              <div className="rounded-full bg-brand-blue-light/10 p-3">
                <Receipt className="h-6 w-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-bold">Automated Invoicing</h3>
              <p className="text-center text-gray-500">Generate and send invoices automatically based on contracts and billing cycles.</p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
              <div className="rounded-full bg-brand-blue-light/10 p-3">
                <CreditCard className="h-6 w-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-bold">Payment Processing</h3>
              <p className="text-center text-gray-500">Secure payment gateway integration for seamless transaction processing.</p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
              <div className="rounded-full bg-brand-blue-light/10 p-3">
                <BarChart className="h-6 w-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-bold">Analytics & Reporting</h3>
              <p className="text-center text-gray-500">Comprehensive dashboards and reports to track your business performance.</p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
              <div className="rounded-full bg-brand-blue-light/10 p-3">
                <CheckCircle className="h-6 w-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-bold">Compliance Management</h3>
              <p className="text-center text-gray-500">Stay compliant with tax regulations and industry standards.</p>
            </div>
            <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
              <div className="rounded-full bg-brand-blue-light/10 p-3">
                <Users className="h-6 w-6 text-brand-blue" />
              </div>
              <h3 className="text-xl font-bold">Client Management</h3>
              <p className="text-center text-gray-500">Maintain client profiles and track all interactions in one place.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-brand-blue">
                Simple, Transparent Pricing
              </h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl">
                Choose the plan that works best for your business.
              </p>
            </div>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-3 mt-12">
            <div className="flex flex-col rounded-lg border bg-white p-6 shadow-sm">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Starter</h3>
                <p className="text-gray-500">Perfect for small businesses</p>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Up to 50 clients</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Proposal generation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Basic invoicing</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link to="/register">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
            <div className="flex flex-col rounded-lg border bg-white p-6 shadow-sm relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-brand-blue text-white px-4 py-1 rounded-full text-sm font-medium">
                Most Popular
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Professional</h3>
                <p className="text-gray-500">For growing companies</p>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-gray-500">/month</span>
              </div>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Unlimited clients</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Advanced proposal templates</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Complete invoicing system</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Analytics dashboard</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link to="/register">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </div>
            <div className="flex flex-col rounded-lg border bg-white p-6 shadow-sm">
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Enterprise</h3>
                <p className="text-gray-500">For large organizations</p>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">Custom</span>
              </div>
              <ul className="mt-6 space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Everything in Professional</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Custom integrations</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>Dedicated support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  <span>SLA guarantees</span>
                </li>
              </ul>
              <div className="mt-6">
                <Link to="/contact">
                  <Button variant="outline" className="w-full">Contact Sales</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="container px-4 py-12 md:px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Product</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/#features" className="text-sm text-gray-500 hover:text-gray-900">Features</Link>
                </li>
                <li>
                  <Link to="/#pricing" className="text-sm text-gray-500 hover:text-gray-900">Pricing</Link>
                </li>
                <li>
                  <Link to="/register" className="text-sm text-gray-500 hover:text-gray-900">Sign Up</Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Company</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-sm text-gray-500 hover:text-gray-900">About</Link>
                </li>
                <li>
                  <Link to="/contact" className="text-sm text-gray-500 hover:text-gray-900">Contact</Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Resources</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/blog" className="text-sm text-gray-500 hover:text-gray-900">Blog</Link>
                </li>
                <li>
                  <Link to="/docs" className="text-sm text-gray-500 hover:text-gray-900">Documentation</Link>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/privacy" className="text-sm text-gray-500 hover:text-gray-900">Privacy Policy</Link>
                </li>
                <li>
                  <Link to="/terms" className="text-sm text-gray-500 hover:text-gray-900">Terms of Service</Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8">
            <p className="text-center text-sm text-gray-500">
              &copy; {new Date().getFullYear()} BillWise. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
