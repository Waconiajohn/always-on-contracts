import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandMenu } from "@/components/CommandMenu";
import { TopNav } from "@/components/navigation/TopNav";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/admin/AdminRoute";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutProvider } from "@/contexts/LayoutContext";

// Lazy load all pages
const Landing = lazy(() => import("./pages/Landing"));
const BenchmarkHomepage = lazy(() => import("./pages/BenchmarkHomepage"));
const UnifiedHomepage = lazy(() => import("./pages/UnifiedHomepage"));
const ResumeUpload = lazy(() => import("./pages/ResumeUpload"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Auth = lazy(() => import("./pages/Auth"));
const Coaching = lazy(() => import("./pages/Coaching"));
const ResumeOptimizer = lazy(() => import("./pages/ResumeOptimizer"));
const Agencies = lazy(() => import("./pages/Agencies"));
const JobSearch = lazy(() => import("./pages/JobSearch"));
const ApplicationQueue = lazy(() => import("./pages/ApplicationQueue"));
const BooleanSearch = lazy(() => import("./pages/BooleanSearch"));
const RateCalculator = lazy(() => import("./pages/RateCalculator"));
const Profile = lazy(() => import("./pages/Profile"));
const Templates = lazy(() => import("./pages/Templates"));
const APIKeys = lazy(() => import("./pages/APIKeys"));
const AIAgents = lazy(() => import("./pages/AIAgents"));
const CorporateAssistant = lazy(() => import("./pages/agents/CorporateAssistant"));
const ResumeBuilderWizard = lazy(() => import("./pages/agents/ResumeBuilderWizard"));
const MyResumes = lazy(() => import("./pages/MyResumes"));
const InterviewPrepAgent = lazy(() => import("./pages/agents/InterviewPrepAgent"));
const LinkedInBloggingAgent = lazy(() => import("./pages/agents/LinkedInBloggingAgent"));
const LinkedInProfileBuilder = lazy(() => import("./pages/agents/LinkedInProfileBuilder"));
const LinkedInNetworkingAgent = lazy(() => import("./pages/agents/LinkedInNetworkingAgent"));
const NetworkingAgent = lazy(() => import("./pages/agents/NetworkingAgentComplete"));
const CareerChangeScout = lazy(() => import("./pages/agents/CareerTransitionScout"));
const FinancialPlanningAssistant = lazy(() => import("./pages/agents/FinancialPlanningAssistant"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AffiliatePortal = lazy(() => import("./pages/AffiliatePortal"));
const RedeemCode = lazy(() => import("./pages/RedeemCode"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminPromptManager = lazy(() => import("./pages/AdminPromptManager"));
const UserRoleManagement = lazy(() => import("./pages/UserRoleManagement"));
const AdminSetup = lazy(() => import("./pages/AdminSetup"));
const V3VaultDashboard = lazy(() => import("./components/career-vault/dashboard/V3VaultDashboard").then(m => ({ default: m.V3VaultDashboard })));
const CareerIntelligenceLibrary = lazy(() => import("./pages/CareerIntelligenceLibrary"));
const VaultAdminTools = lazy(() => import("./pages/VaultAdminTools"));
const LearningCenter = lazy(() => import("./pages/LearningCenter"));
const ResearchHub = lazy(() => import("./pages/ResearchHub"));
const ReferralProgram = lazy(() => import("./pages/ReferralProgram"));
const SalaryNegotiation = lazy(() => import("./pages/SalaryNegotiation"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TestingDashboard = lazy(() => import("./pages/TestingDashboard"));
const ExperimentalLab = lazy(() => import("./pages/ExperimentalLab"));
const ResumeDataAudit = lazy(() => import("./pages/ResumeDataAudit"));
const QuickScore = lazy(() => import("./pages/QuickScore"));
const MustInterviewBuilder = lazy(() => import("./pages/MustInterviewBuilder"));
const MustInterviewBuilderV2Page = lazy(() => import("./pages/MustInterviewBuilderV2Page"));
const ResumeBuilderV2 = lazy(() => import("./pages/agents/ResumeBuilderV2"));
const ResumeBuilderV7 = lazy(() => import("./components/resume-builder/v7/ResumeBuilderV7"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex-1 p-8 space-y-4">
    <Skeleton className="h-12 w-64" />
    <Skeleton className="h-96 w-full" />
  </div>
);

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const publicPaths = ['/', '/auth', '/pricing'];
  const showTopNav = !publicPaths.includes(location.pathname);

  return (
    <div className="flex min-h-screen w-full flex-col">
      {showTopNav && <TopNav />}
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/quick-score" element={<QuickScore />} />
          <Route path="/home" element={<ProtectedRoute><BenchmarkHomepage /></ProtectedRoute>} />
          <Route path="/home-legacy" element={<ProtectedRoute><UnifiedHomepage /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/projects" element={<Navigate to="/active-applications" replace />} />
          <Route path="/resume-upload" element={<ProtectedRoute><ResumeUpload /></ProtectedRoute>} />
          <Route path="/coaching" element={<ProtectedRoute><Coaching /></ProtectedRoute>} />
          <Route path="/resume-optimizer" element={<ProtectedRoute><ResumeOptimizer /></ProtectedRoute>} />
          <Route path="/agencies" element={<ProtectedRoute><Agencies /></ProtectedRoute>} />
          <Route path="/job-search" element={<ProtectedRoute><JobSearch /></ProtectedRoute>} />
          <Route path="/active-applications" element={<ProtectedRoute><ApplicationQueue /></ProtectedRoute>} />
          <Route path="/application-queue" element={<Navigate to="/active-applications" replace />} />
          <Route path="/boolean-search" element={<ProtectedRoute><BooleanSearch /></ProtectedRoute>} />
          <Route path="/rate-calculator" element={<ProtectedRoute><RateCalculator /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/api-keys" element={<ProtectedRoute><APIKeys /></ProtectedRoute>} />
          <Route path="/ai-agents" element={<ProtectedRoute><AIAgents /></ProtectedRoute>} />
        <Route path="/agents/corporate-assistant" element={<ProtectedRoute><CorporateAssistant /></ProtectedRoute>} />
          <Route path="/agents/resume-builder" element={<ProtectedRoute><ResumeBuilderV2 /></ProtectedRoute>} />
          <Route path="/agents/resume-builder-wizard" element={<ProtectedRoute><ResumeBuilderV2 /></ProtectedRoute>} />
          <Route path="/must-interview-builder" element={<ProtectedRoute><ResumeBuilderV2 /></ProtectedRoute>} />
          <Route path="/resume-builder-v5" element={<ProtectedRoute><ResumeBuilderV2 /></ProtectedRoute>} />
        <Route path="/resume-builder-v4" element={<ProtectedRoute><MustInterviewBuilderV2Page /></ProtectedRoute>} />
        <Route path="/must-interview-builder-v3" element={<ProtectedRoute><MustInterviewBuilder /></ProtectedRoute>} />
        <Route path="/agents/resume-builder-legacy" element={<ProtectedRoute><ResumeBuilderWizard /></ProtectedRoute>} />
        <Route path="/my-resumes" element={<ProtectedRoute><MyResumes /></ProtectedRoute>} />
        <Route path="/agents/interview-prep" element={<ProtectedRoute><InterviewPrepAgent /></ProtectedRoute>} />
        <Route path="/agents/linkedin-blogging" element={<ProtectedRoute><LinkedInBloggingAgent /></ProtectedRoute>} />
        <Route path="/agents/linkedin-profile-builder" element={<ProtectedRoute><LinkedInProfileBuilder /></ProtectedRoute>} />
        <Route path="/agents/linkedin-networking" element={<ProtectedRoute><LinkedInNetworkingAgent /></ProtectedRoute>} />
        <Route path="/agents/networking" element={<ProtectedRoute><NetworkingAgent /></ProtectedRoute>} />
        <Route path="/agents/career-change-scout" element={<ProtectedRoute><CareerChangeScout /></ProtectedRoute>} />
        <Route path="/agents/career-transition-scout" element={<Navigate to="/agents/career-change-scout" replace />} />
        <Route path="/agents/career-trends-scout" element={<Navigate to="/agents/career-change-scout" replace />} />
        <Route path="/agents/financial-planning-assistant" element={<ProtectedRoute><FinancialPlanningAssistant /></ProtectedRoute>} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/affiliate" element={<ProtectedRoute><AffiliatePortal /></ProtectedRoute>} />
            <Route path="/redeem-retirement" element={<RedeemCode />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin-prompt-manager" element={<ProtectedRoute><AdminRoute><AdminPromptManager /></AdminRoute></ProtectedRoute>} />
            <Route path="/admin/user-roles" element={<ProtectedRoute><AdminRoute><UserRoleManagement /></AdminRoute></ProtectedRoute>} />
            <Route path="/admin-setup" element={<ProtectedRoute><AdminSetup /></ProtectedRoute>} />
            <Route path="/vault-admin" element={<ProtectedRoute><VaultAdminTools /></ProtectedRoute>} />
            <Route path="/career-vault" element={<ProtectedRoute><V3VaultDashboard /></ProtectedRoute>} />
            <Route path="/career-intelligence" element={<ProtectedRoute><CareerIntelligenceLibrary /></ProtectedRoute>} />
            <Route path="/career-vault-onboarding" element={<Navigate to="/career-vault" replace />} />
            {/* Legacy redirects */}
            <Route path="/career-tools" element={<Navigate to="/home" replace />} />
            <Route path="/command-center" element={<Navigate to="/home" replace />} />
            <Route path="/dashboard" element={<Navigate to="/home" replace />} />
            <Route path="/daily-workflow" element={<Navigate to="/home" replace />} />
            <Route path="/salary-negotiation" element={<ProtectedRoute><SalaryNegotiation /></ProtectedRoute>} />
            <Route path="/learn" element={<ProtectedRoute><LearningCenter /></ProtectedRoute>} />
            <Route path="/learning-center" element={<ProtectedRoute><LearningCenter /></ProtectedRoute>} />
            <Route path="/research-hub" element={<ProtectedRoute><ResearchHub /></ProtectedRoute>} />
            <Route path="/referrals" element={<ProtectedRoute><ReferralProgram /></ProtectedRoute>} />
            <Route path="/testing-dashboard" element={<ProtectedRoute><TestingDashboard /></ProtectedRoute>} />
            <Route path="/experimental-lab" element={<ProtectedRoute><ExperimentalLab /></ProtectedRoute>} />
            <Route path="/resume-data-audit" element={<ProtectedRoute><ResumeDataAudit /></ProtectedRoute>} />
            <Route path="/benchmark-builder" element={<ProtectedRoute><ResumeBuilderV7 /></ProtectedRoute>} />
            <Route path="/resume-builder-v7" element={<ProtectedRoute><ResumeBuilderV7 /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LayoutProvider>
        <TooltipProvider delayDuration={300} skipDelayDuration={0}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CommandMenu />
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </LayoutProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
