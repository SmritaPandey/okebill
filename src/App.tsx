import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import ErrorBoundary from "./components/common/ErrorBoundary";
import AuthCheck from "./components/auth/AuthCheck";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/AuthPages/LoginPage";
import RegisterPage from "./pages/AuthPages/RegisterPage";
import AuthCallback from "./pages/AuthPages/AuthCallback";
import OnboardingPage from "./pages/OnboardingPage";
import Index from "./pages/Index";
import ClientsPage from "./pages/ClientsPage";
import ProposalsPage from "./pages/ProposalsPage";
import ProposalPublicView from "./pages/ProposalPublicView";
import ContractsPage from "./pages/ContractsPage";
import InvoicesPage from "./pages/InvoicesPage";
import PaymentsPage from "./pages/PaymentsPage";
import CreditNotesPage from "./pages/CreditNotesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
// New multi-utility modules
import ProductsPage from "./pages/ProductsPage";
import InventoryPage from "./pages/InventoryPage";
import POSPage from "./pages/POSPage";
import SalesPage from "./pages/SalesPage";
import CustomersPage from "./pages/CustomersPage";
import SuppliersPage from "./pages/SuppliersPage";
import ReportsPage from "./pages/ReportsPage";
import BillingPage from "./pages/BillingPage";
import NotFound from "./pages/NotFound";
import RefundPolicyPage from "./pages/RefundPolicyPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import ContactSupportPage from "./pages/ContactSupportPage";
import NetworkStatus from "./components/common/NetworkStatus";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <NetworkStatus />
            <BrowserRouter>
              <Routes>
                {/* Landing page as the default route */}
                <Route
                  path="/"
                  element={
                    <AuthCheck requireAuth={false}>
                      <LandingPage />
                    </AuthCheck>
                  }
                />

                {/* Public routes */}
                <Route
                  path="/login"
                  element={
                    <AuthCheck requireAuth={false}>
                      <LoginPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <AuthCheck requireAuth={false}>
                      <RegisterPage />
                    </AuthCheck>
                  }
                />

                {/* Public proposal view (for clients to accept) */}
                <Route path="/p/:proposalId" element={<ProposalPublicView />} />

                {/* OAuth callback for Microsoft popup */}
                <Route path="/auth/callback" element={<AuthCallback />} />

                {/* Public policy pages */}
                <Route path="/refund-policy" element={<RefundPolicyPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/terms" element={<TermsOfServicePage />} />
                <Route path="/contact" element={<ContactSupportPage />} />

                {/* Onboarding */}
                <Route
                  path="/onboarding"
                  element={
                    <AuthCheck requireAuth={true}>
                      <OnboardingPage />
                    </AuthCheck>
                  }
                />

                {/* Protected routes — Billing */}
                <Route
                  path="/dashboard"
                  element={
                    <AuthCheck requireAuth={true}>
                      <Index />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/clients"
                  element={
                    <AuthCheck requireAuth={true}>
                      <ClientsPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/proposals"
                  element={
                    <AuthCheck requireAuth={true}>
                      <ProposalsPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/contracts"
                  element={
                    <AuthCheck requireAuth={true}>
                      <ContractsPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/invoices"
                  element={
                    <AuthCheck requireAuth={true}>
                      <InvoicesPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/payments"
                  element={
                    <AuthCheck requireAuth={true}>
                      <PaymentsPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/credit-notes"
                  element={
                    <AuthCheck requireAuth={true}>
                      <CreditNotesPage />
                    </AuthCheck>
                  }
                />

                {/* Protected routes — Commerce (Multi-Utility) */}
                <Route
                  path="/products"
                  element={
                    <AuthCheck requireAuth={true}>
                      <ProductsPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/inventory"
                  element={
                    <AuthCheck requireAuth={true}>
                      <InventoryPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/pos"
                  element={
                    <AuthCheck requireAuth={true}>
                      <POSPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/sales"
                  element={
                    <AuthCheck requireAuth={true}>
                      <SalesPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/customers"
                  element={
                    <AuthCheck requireAuth={true}>
                      <CustomersPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/suppliers"
                  element={
                    <AuthCheck requireAuth={true}>
                      <SuppliersPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <AuthCheck requireAuth={true}>
                      <ReportsPage />
                    </AuthCheck>
                  }
                />

                {/* Insights */}
                <Route
                  path="/analytics"
                  element={
                    <AuthCheck requireAuth={true}>
                      <AnalyticsPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <AuthCheck requireAuth={true}>
                      <SettingsPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/billing"
                  element={
                    <AuthCheck requireAuth={true}>
                      <BillingPage />
                    </AuthCheck>
                  }
                />
                <Route
                  path="/payment/callback"
                  element={
                    <AuthCheck requireAuth={true}>
                      <BillingPage />
                    </AuthCheck>
                  }
                />

                {/* 404 page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
