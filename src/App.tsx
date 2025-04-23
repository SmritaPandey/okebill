
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthCheck from "./components/auth/AuthCheck";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/AuthPages/LoginPage";
import RegisterPage from "./pages/AuthPages/RegisterPage";
import OnboardingPage from "./pages/OnboardingPage";
import Index from "./pages/Index";
import ClientsPage from "./pages/ClientsPage";
import ProposalsPage from "./pages/ProposalsPage";
import ContractsPage from "./pages/ContractsPage";
import InvoicesPage from "./pages/InvoicesPage";
import PaymentsPage from "./pages/PaymentsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/landing" 
            element={
              <AuthCheck requireAuth={false} requireOnboarding={false}>
                <LandingPage />
              </AuthCheck>
            } 
          />
          <Route 
            path="/login" 
            element={
              <AuthCheck requireAuth={false} requireOnboarding={false}>
                <LoginPage />
              </AuthCheck>
            } 
          />
          <Route 
            path="/register" 
            element={
              <AuthCheck requireAuth={false} requireOnboarding={false}>
                <RegisterPage />
              </AuthCheck>
            } 
          />
          
          {/* Onboarding */}
          <Route 
            path="/onboarding" 
            element={
              <AuthCheck requireAuth={true} requireOnboarding={false}>
                <OnboardingPage />
              </AuthCheck>
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={
              <AuthCheck requireAuth={true} requireOnboarding={true}>
                <Index />
              </AuthCheck>
            } 
          />
          <Route 
            path="/clients" 
            element={
              <AuthCheck requireAuth={true} requireOnboarding={true}>
                <ClientsPage />
              </AuthCheck>
            } 
          />
          <Route 
            path="/proposals" 
            element={
              <AuthCheck requireAuth={true} requireOnboarding={true}>
                <ProposalsPage />
              </AuthCheck>
            } 
          />
          <Route 
            path="/contracts" 
            element={
              <AuthCheck requireAuth={true} requireOnboarding={true}>
                <ContractsPage />
              </AuthCheck>
            } 
          />
          <Route 
            path="/invoices" 
            element={
              <AuthCheck requireAuth={true} requireOnboarding={true}>
                <InvoicesPage />
              </AuthCheck>
            } 
          />
          <Route 
            path="/payments" 
            element={
              <AuthCheck requireAuth={true} requireOnboarding={true}>
                <PaymentsPage />
              </AuthCheck>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <AuthCheck requireAuth={true} requireOnboarding={true}>
                <AnalyticsPage />
              </AuthCheck>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <AuthCheck requireAuth={true} requireOnboarding={true}>
                <SettingsPage />
              </AuthCheck>
            } 
          />
          
          {/* Redirect to landing page for initial visit */}
          <Route 
            path="/" 
            element={
              <AuthCheck requireAuth={false} requireOnboarding={false}>
                <LandingPage />
              </AuthCheck>
            } 
          />
          
          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
