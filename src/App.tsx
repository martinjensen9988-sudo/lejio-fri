import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { FriAuthProvider } from "@/providers/FriAuthProvider";
import { BrandProvider } from "@/providers/BrandContext";

// FORCE NEW BUILD - DO NOT REMOVE - 2026-02-05-v3-tenant-fix
const APP_VERSION = "2026.02.05.003";
import { TenantProvider } from "@/hooks/useTenant";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "./pages/NotFound";

// Lejio Fri (White-label lessor platform) - lazy loaded
const FriLandingPage = lazy(() => import("./pages/fri/landing/LandingPage").then(m => ({ default: m.FriLandingPage })));
const FriTrialPage = lazy(() => import("./pages/fri/TrialPage").then(m => ({ default: m.FriTrialPage })));
const FriFeaturesPage = lazy(() => import("./pages/fri/FeaturesPage").then(m => ({ default: m.FriFeaturesPage })));
const FriLoginPage = lazy(() => import("./pages/fri/auth/LoginPage").then(m => ({ default: m.FriLoginPage })));
const FriSignupPage = lazy(() => import("./pages/fri/auth/SignupPage").then(m => ({ default: m.FriSignupPage })));
const FriDashboard = lazy(() => import("./pages/fri/dashboard/Dashboard").then(m => ({ default: m.FriDashboard })));
const TenantSignupPage = lazy(() => import("./pages/fri/tenant/SignupPage").then(m => ({ default: m.TenantSignupPage })));

// Lejio Fri Admin - lazy loaded
const FriAdminLoginPage = lazy(() => import("./pages/fri/admin/LoginPage").then(m => ({ default: m.FriAdminLoginPage })));
const FriAdminDashboard = lazy(() => import("./pages/fri/admin/Dashboard").then(m => ({ default: m.FriAdminDashboard })));
const FriAdminLessorsPage = lazy(() => import("./pages/fri/admin/LessorsPage").then(m => ({ default: m.FriAdminLessorsPage })));
const FriAdminLessorDetailsPage = lazy(() => import("./pages/fri/admin/LessorDetailsPage").then(m => ({ default: m.FriAdminLessorDetailsPage })));
const FriAdminTicketsPage = lazy(() => import("./pages/fri/admin/TicketsPage").then(m => ({ default: m.FriAdminTicketsPage })));
const FriAdminTicketDetailsPage = lazy(() => import("./pages/fri/admin/TicketDetailsPage").then(m => ({ default: m.FriAdminTicketDetailsPage })));
const FriAdminPaymentsPage = lazy(() => import("./pages/fri/admin/PaymentsPage").then(m => ({ default: m.FriAdminPaymentsPage })));
const FriAdminLayout = lazy(() => import("./pages/fri/admin/Layout").then(m => ({ default: m.FriAdminLayout })));

// Fri Lessor Pages - lazy loaded
const FriApiKeysPage = lazy(() => import("./pages/fri/dashboard/ApiKeysPage").then(m => ({ default: m.FriApiKeysPage })));
const FriTeamManagement = lazy(() => import("./pages/fri/dashboard/FriTeamManagement").then(m => ({ default: m.default })));
const FriLessorDashboard = lazy(() => import("./pages/fri/dashboard/FriLessorDashboard").then(m => ({ default: m.default })));
const FriInvoiceManagement = lazy(() => import("./pages/fri/dashboard/FriInvoiceManagement").then(m => ({ default: m.default })));
const FriModulesPage = lazy(() => import("./pages/fri/dashboard/ModulesPage").then(m => ({ default: m.FriModulesPage })));

// Workshop Pages - lazy loaded
const GaragePlanPage = lazy(() => import("./pages/fri/workshop/GaragePlan").then(m => ({ default: m.GaragePlanPage })));
const WorkshopModulesPublic = lazy(() => import("./pages/fri/workshop/WorkshopModulesPublic").then(m => ({ default: m.WorkshopModulesPublic })));

// Page Builder - lazy loaded
const PagesDashboard = lazy(() => import("./pages/dashboard/PagesDashboard").then(m => ({ default: m.PagesDashboard })));
const PageBuilder = lazy(() => import("./pages/dashboard/PageBuilder").then(m => ({ default: m.PageBuilder })));
const PagePreview = lazy(() => import("./pages/dashboard/PagePreview").then(m => ({ default: m.PagePreview })));
const PublicSiteRenderer = lazy(() => import("./pages/PublicSite").then(m => ({ default: m.PublicSiteRenderer })));

// Optimized QueryClient configuration for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for reuse
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
      refetchOnReconnect: true, // Refetch if connection lost
      refetchOnMount: true, // Refetch if component remounts
      networkMode: 'always', // Try offline queries
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
      networkMode: 'always',
    }
  }
});

// Minimal loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TenantProvider apiBaseUrl="/api">
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                <Routes>
                {/* Debug route */}
        <Route path="/debug" element={<div className="p-8"><h1>Debug: App is working! (v2)</h1><p>This is the NEW compiled version</p></div>} />
                {/* Lejio Fri - Main Platform */}
                <Route path="/" element={<FriLandingPage />} />
                <Route path="/fri" element={<Navigate to="/" replace />} />
                <Route path="/trial" element={<FriTrialPage />} />
                <Route path="/fri/trial" element={<Navigate to="/trial" replace />} />
                <Route path="/features" element={<FriFeaturesPage />} />
                <Route path="/fri/features" element={<Navigate to="/features" replace />} />
                <Route path="/login" element={<FriLoginPage />} />
                <Route path="/fri/login" element={<Navigate to="/login" replace />} />
                <Route path="/signup" element={<FriSignupPage />} />
                <Route path="/fri/signup" element={<Navigate to="/signup" replace />} />
                <Route path="/fri/tenant/signup" element={<TenantSignupPage />} />
                <Route path="/fri/dashboard" element={
                  <BrandProvider branding={{ primary_color: '#0066cc', secondary_color: '#00cc99', company_name: 'Lejio Fri' }} domain="fri">
                    <FriAuthProvider>
                      <FriDashboard />
                    </FriAuthProvider>
                  </BrandProvider>
                } />
                <Route path="/fri/dashboard/team" element={
                  <BrandProvider branding={{ primary_color: '#0066cc', secondary_color: '#00cc99', company_name: 'Lejio Fri' }} domain="fri">
                    <FriAuthProvider>
                      <FriTeamManagement />
                    </FriAuthProvider>
                  </BrandProvider>
                } />
                <Route path="/fri/dashboard/analytics" element={
                  <BrandProvider branding={{ primary_color: '#0066cc', secondary_color: '#00cc99', company_name: 'Lejio Fri' }} domain="fri">
                    <FriAuthProvider>
                      <FriLessorDashboard />
                    </FriAuthProvider>
                  </BrandProvider>
                } />
                <Route path="/fri/dashboard/invoices" element={
                  <BrandProvider branding={{ primary_color: '#0066cc', secondary_color: '#00cc99', company_name: 'Lejio Fri' }} domain="fri">
                    <FriAuthProvider>
                      <FriInvoiceManagement />
                    </FriAuthProvider>
                  </BrandProvider>
                } />
                
                {/* Workshop Pages */}
                <Route path="/fri/workshop/garageplan" element={<GaragePlanPage />} />
                <Route path="/fri/workshop/modules" element={<WorkshopModulesPublic />} />
                <Route path="/fri/dashboard/modules" element={<WorkshopModulesPublic />} />
                
                {/* Lejio Fri Admin */}
                <Route path="/fri/admin/login" element={<FriAdminLoginPage />} />
                <Route path="/fri/admin/*" element={
                  <FriAdminLayout>
                    <Routes>
                      <Route path="/dashboard" element={<FriAdminDashboard />} />
                      <Route path="/lessors" element={<FriAdminLessorsPage />} />
                      <Route path="/lessors/:lessorId" element={<FriAdminLessorDetailsPage />} />
                      <Route path="/support" element={<FriAdminTicketsPage />} />
                      <Route path="/support/:ticketId" element={<FriAdminTicketDetailsPage />} />
                      <Route path="/payments" element={<FriAdminPaymentsPage />} />
                      <Route path="/" element={<Navigate to="/fri/admin/dashboard" replace />} />
                    </Routes>
                  </FriAdminLayout>
                } />

                {/* Page Builder - Lejio Fri Dashboard */}
                <Route path="/dashboard/pages" element={
                  <FriAuthProvider>
                    <PagesDashboard />
                  </FriAuthProvider>
                } />
                <Route path="/dashboard/pages/:id/preview" element={
                  <FriAuthProvider>
                    <PagePreview />
                  </FriAuthProvider>
                } />
                <Route path="/dashboard/pages/:id/edit" element={
                  <FriAuthProvider>
                    <PageBuilder />
                  </FriAuthProvider>
                } />

                {/* Page Renderer for published sites */}
                <Route path="/site/:lessorId/*" element={<PublicSiteRenderer />} />
                
                {/* Catch all - 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
      </TenantProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
}
