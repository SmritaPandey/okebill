import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    Crown, Zap, Rocket, Building2, Check, ArrowRight, Loader2,
    CreditCard, Calendar, Clock, AlertTriangle, Shield
} from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface Plan {
    id: string;
    name: string;
    price: number;
    duration: number;
    features: string[];
    limits: { invoicesPerMonth: number; clients: number };
}

interface SubscriptionStatus {
    hasSubscription: boolean;
    plan: string | null;
    planDetails?: Plan;
    status: string;
    startDate?: string;
    endDate?: string;
    trialEndsAt?: string;
}

interface Transaction {
    id: number;
    orderKeyId: string;
    uniqueRequestId: string;
    orderAmount: string;
    orderStatus: string | null;
    paymentStatus: number;
    paymentMethod: string | null;
    purpose: string;
    createdAt: string;
}

const planIcons: Record<string, React.ElementType> = {
    free_trial: Clock,
    starter: Zap,
    professional: Rocket,
    enterprise: Building2,
};

const planColors: Record<string, string> = {
    free_trial: 'from-gray-500 to-gray-600',
    starter: 'from-blue-500 to-blue-600',
    professional: 'from-[#1E3A5F] to-[#2C4F7C]',
    enterprise: 'from-amber-500 to-amber-600',
};

const BillingPage: React.FC = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
    const [isYearly, setIsYearly] = useState(false);

    const token = localStorage.getItem('auth_token');
    const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [plansRes, statusRes, historyRes] = await Promise.all([
                fetch(`${API_URL}/subscription/plans`, { headers }),
                fetch(`${API_URL}/subscription/status`, { headers }),
                fetch(`${API_URL}/subscription/history`, { headers }),
            ]);

            if (plansRes.ok) {
                const data = await plansRes.json();
                setPlans(data.plans || []);
            }
            if (statusRes.ok) {
                const data = await statusRes.json();
                setSubscription(data);
            }
            if (historyRes.ok) {
                const data = await historyRes.json();
                setTransactions(data.transactions || []);
            }
        } catch (err) {
            console.error('Error fetching billing data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async (planId: string) => {
        setCheckoutLoading(planId);
        try {
            const res = await fetch(`${API_URL}/subscription/checkout`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ planId }),
            });
            const data = await res.json();

            if (data.success && data.paymentProcessUrl) {
                toast.success('Redirecting to payment...');
                // Redirect to PayG payment page
                window.location.href = data.paymentProcessUrl;
            } else {
                toast.error(data.message || 'Failed to initiate checkout');
            }
        } catch (err: any) {
            toast.error(err.message || 'Checkout error');
        } finally {
            setCheckoutLoading(null);
        }
    };

    const getStatusBadge = () => {
        if (!subscription?.hasSubscription) return null;
        const statusColors: Record<string, string> = {
            active: 'bg-green-100 text-green-700 border-green-200',
            expired: 'bg-red-100 text-red-700 border-red-200',
            cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
            past_due: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        };
        return (
            <Badge className={`${statusColors[subscription.status] || ''} border`}>
                {subscription.status === 'active' && <Shield className="h-3 w-3 mr-1" />}
                {subscription.status === 'expired' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </Badge>
        );
    };

    const daysRemaining = () => {
        if (!subscription?.endDate && !subscription?.trialEndsAt) return null;
        const end = new Date(subscription.endDate || subscription.trialEndsAt!);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="space-y-8 p-6 max-w-6xl mx-auto">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <Crown className="h-8 w-8 text-amber-500" />
                        Billing & Subscription
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your subscription plan and payment history</p>
                </div>

                {/* Current Plan Banner */}
                {subscription?.hasSubscription && (
                    <Card className="border-0 shadow-lg bg-gradient-to-r from-gray-900 to-gray-800 text-white overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${planColors[subscription.plan || 'free_trial']} flex items-center justify-center shadow-lg`}>
                                        {React.createElement(planIcons[subscription.plan || 'free_trial'] || Clock, { className: 'h-7 w-7 text-white' })}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-bold">
                                                {subscription.planDetails?.name || subscription.plan?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </h2>
                                            {getStatusBadge()}
                                        </div>
                                        <p className="text-gray-300 text-sm mt-0.5">
                                            {subscription.plan === 'free_trial'
                                                ? `${daysRemaining()} days remaining in your trial`
                                                : `Renews on ${new Date(subscription.endDate || '').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`
                                            }
                                        </p>
                                    </div>
                                </div>
                                {subscription.plan === 'free_trial' && (
                                    <Button className="bg-white text-gray-900 hover:bg-gray-100 font-semibold">
                                        <Zap className="h-4 w-4 mr-2" />
                                        Upgrade Now
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Plan Cards */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900">Available Plans</h2>
                        <div className="inline-flex items-center bg-gray-100 rounded-xl p-1">
                            <button
                                onClick={() => setIsYearly(false)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    !isYearly ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setIsYearly(true)}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                                    isYearly ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Yearly
                                <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">
                                    -20%
                                </span>
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {plans.map((plan) => {
                            const isCurrentPlan = subscription?.plan === plan.id;
                            const Icon = planIcons[plan.id] || Zap;

                            return (
                                <Card
                                    key={plan.id}
                                    className={`relative overflow-hidden transition-all duration-300 hover:shadow-lg ${isCurrentPlan ? 'ring-2 ring-blue-500 shadow-blue-100' : 'hover:shadow-md'
                                        } ${plan.id === 'professional' ? 'border-emerald-200' : ''}`}
                                >
                                    {plan.id === 'professional' && (
                                        <div className="absolute top-0 right-0 bg-gradient-to-r from-[#1E3A5F] to-[#2C4F7C] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                                            POPULAR
                                        </div>
                                    )}

                                    <CardHeader className="pb-3">
                                        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${planColors[plan.id]} flex items-center justify-center mb-2`}>
                                            <Icon className="h-5 w-5 text-white" />
                                        </div>
                                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                                    <CardDescription>
                                            {plan.price === 0 ? (
                                                <span className="text-2xl font-bold text-gray-900">Free</span>
                                            ) : (
                                                <span>
                                                    <span className="text-2xl font-bold text-gray-900">
                                                        ₹{isYearly ? Math.round(plan.price * 0.8) : plan.price}
                                                    </span>
                                                    <span className="text-gray-500">/mo</span>
                                                    {isYearly && plan.price > 0 && (
                                                        <span className="ml-2 text-xs line-through text-gray-400">₹{plan.price}</span>
                                                    )}
                                                </span>
                                            )}
                                            {isYearly && plan.price > 0 && (
                                                <div className="text-xs text-green-600 mt-1">
                                                    Save ₹{Math.round(plan.price * 0.2 * 12).toLocaleString('en-IN')}/year
                                                </div>
                                            )}
                                        </CardDescription>
                                    </CardHeader>

                                    <CardContent className="pb-3">
                                        <ul className="space-y-2">
                                            {plan.features.map((feature, i) => (
                                                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                                    <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>

                                    <CardFooter>
                                        {isCurrentPlan ? (
                                            <Button disabled className="w-full" variant="outline">
                                                Current Plan
                                            </Button>
                                        ) : plan.price === 0 ? (
                                            <Button disabled className="w-full" variant="outline">
                                                Free Trial
                                            </Button>
                                        ) : (
                                            <Button
                                                className={`w-full bg-gradient-to-r ${planColors[plan.id]} text-white hover:opacity-90`}
                                                onClick={() => handleCheckout(plan.id)}
                                                disabled={checkoutLoading === plan.id}
                                            >
                                                {checkoutLoading === plan.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                ) : (
                                                    <ArrowRight className="h-4 w-4 mr-2" />
                                                )}
                                                {checkoutLoading === plan.id ? 'Processing...' : 'Upgrade'}
                                            </Button>
                                        )}
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Payment History */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                        Payment History
                    </h2>
                    <Card>
                        <CardContent className="p-0">
                            {transactions.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p className="font-medium">No payment history yet</p>
                                    <p className="text-sm mt-1">Your payment transactions will appear here</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b bg-gray-50/50">
                                                <th className="text-left p-3 font-medium text-gray-600">Date</th>
                                                <th className="text-left p-3 font-medium text-gray-600">Reference</th>
                                                <th className="text-left p-3 font-medium text-gray-600">Purpose</th>
                                                <th className="text-right p-3 font-medium text-gray-600">Amount</th>
                                                <th className="text-left p-3 font-medium text-gray-600">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {transactions.map((txn) => (
                                                <tr key={txn.id} className="border-b last:border-0 hover:bg-gray-50/50">
                                                    <td className="p-3 flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                                        {new Date(txn.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="p-3 font-mono text-xs text-gray-500">{txn.orderKeyId.slice(0, 20)}...</td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className="text-xs">
                                                            {txn.purpose === 'subscription' ? 'Subscription' : 'Invoice Payment'}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-right font-semibold">₹{Number(txn.orderAmount).toLocaleString('en-IN')}</td>
                                                    <td className="p-3">
                                                        <Badge className={txn.paymentStatus === 1
                                                            ? 'bg-green-100 text-green-700'
                                                            : txn.paymentStatus === 0
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-red-100 text-red-700'
                                                        }>
                                                            {txn.paymentStatus === 1 ? 'Paid' : txn.paymentStatus === 0 ? 'Pending' : 'Failed'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
};

export default BillingPage;
