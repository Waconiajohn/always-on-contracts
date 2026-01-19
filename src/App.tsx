import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandMenu } from "@/components/CommandMenu";
import { TopNav } from "@/components/navigation/TopNav";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ModuleGate } from "./components/ModuleGate";
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
const MyResumes = lazy(() => import("./pages/MyResumes"));
const LinkedInBloggingAgent = lazy(() => import("./pages/agents/LinkedInBloggingAgent"));
const LinkedInProfileBuilder = lazy(() => import("./pages/agents/LinkedInProfileBuilder"));
const LinkedInNetworkingAgent = lazy(() => import("./pages/agents/LinkedInNetworkingAgent"));
const NetworkingAgent = lazy(() => import("./pages/agents/NetworkingAgentComplete"));
const FinancialPlanningAssistant = lazy(() => import("./pages/agents/FinancialPlanningAssistant"));
const AffiliatePortal = lazy(() => import("./pages/AffiliatePortal"));
const RedeemCode = lazy(() => import("./pages/RedeemCode"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminPromptManager = lazy(() => import("./pages/AdminPromptManager"));
const UserRoleManagement = lazy(() => import("./pages/UserRoleManagement"));
const AdminSetup = lazy(() => import("./pages/AdminSetup"));
const MasterResume = lazy(() => import("./pages/MasterResume"));
const LearningCenter = lazy(() => import("./pages/LearningCenter"));
const ResearchHub = lazy(() => import("./pages/ResearchHub"));
const ReferralProgram = lazy(() => import("./pages/ReferralProgram"));
const SalaryNegotiation = lazy(() => import("./pages/SalaryNegotiation"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TestingDashboard = lazy(() => import("./pages/TestingDashboard"));
const ExperimentalLab = lazy(() => import("./pages/ExperimentalLab"));
const QuickScore = lazy(() => import("./pages/QuickScore"));
const ResumeBuilderV3 = lazy(() => import("./components/resume-builder-v3/ResumeBuilderV3").then(m => ({ default: m.ResumeBuilderV3 })));
const ResumeOptimizerMarketing = lazy(() => import("./pages/ResumeOptimizerMarketing"));
const ResumeTailorV2 = lazy(() => import("./components/v2/V2Page"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex-1 p-8 space-y-4">
    <Skeleton className="h-12 w-64" />
    <Skeleton className="h-96 w-full" />
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const location = useLocation();
  const publicPaths = ['/', '/auth', '/pricing', '/resume-optimizer-info'];
  const showTopNav = !publicPaths.includes(location.pathname);

  return (
    <div className="flex min-h-screen w-full flex-col">
      {showTopNav && <TopNav />}
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/quick-score" element={<ProtectedRoute><QuickScore /></ProtectedRoute>} />
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
            {/* Legacy resume builder routes - redirect to canonical */}
            <Route path="/agents/resume-builder" element={<Navigate to="/resume-builder" replace />} />
            <Route path="/agents/resume-builder-wizard" element={<Navigate to="/resume-builder" replace />} />
            <Route path="/must-interview-builder" element={<Navigate to="/resume-builder" replace />} />
            <Route path="/resume-builder-v5" element={<Navigate to="/resume-builder" replace />} />
            <Route path="/resume-builder-v4" element={<Navigate to="/resume-builder" replace />} />
            <Route path="/must-interview-builder-v3" element={<Navigate to="/resume-builder" replace />} />
            <Route path="/agents/resume-builder-legacy" element={<Navigate to="/resume-builder" replace />} />
            <Route path="/my-resumes" element={<ProtectedRoute><MyResumes /></ProtectedRoute>} />
            {/* Removed agents that depended on vault */}
            <Route path="/agents/interview-prep" element={<Navigate to="/home" replace />} />
            <Route path="/agents/corporate-assistant" element={<Navigate to="/home" replace />} />
            <Route path="/agents/linkedin-blogging" element={<ProtectedRoute><LinkedInBloggingAgent /></ProtectedRoute>} />
            <Route path="/agents/linkedin-profile-builder" element={<ProtectedRoute><LinkedInProfileBuilder /></ProtectedRoute>} />
            <Route path="/agents/linkedin-networking" element={<ProtectedRoute><LinkedInNetworkingAgent /></ProtectedRoute>} />
            <Route path="/agents/networking" element={<ProtectedRoute><NetworkingAgent /></ProtectedRoute>} />
            <Route path="/agents/career-change-scout" element={<Navigate to="/home" replace />} />
            <Route path="/agents/career-transition-scout" element={<Navigate to="/home" replace />} />
            <Route path="/agents/career-trends-scout" element={<Navigate to="/home" replace />} />
            <Route path="/agents/financial-planning-assistant" element={<ProtectedRoute><FinancialPlanningAssistant /></ProtectedRoute>} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/onboarding" element={<Navigate to="/master-resume" replace />} />
            <Route path="/affiliate" element={<ProtectedRoute><AffiliatePortal /></ProtectedRoute>} />
            <Route path="/redeem-retirement" element={<RedeemCode />} />
            <Route path="/admin" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/admin-prompt-manager" element={<ProtectedRoute><AdminRoute><AdminPromptManager /></AdminRoute></ProtectedRoute>} />
            <Route path="/admin/user-roles" element={<ProtectedRoute><AdminRoute><UserRoleManagement /></AdminRoute></ProtectedRoute>} />
            <Route path="/admin-setup" element={<ProtectedRoute><AdminSetup /></ProtectedRoute>} />
            <Route path="/master-resume" element={<ProtectedRoute><MasterResume /></ProtectedRoute>} />
            {/* Note: Legacy /career-vault routes removed - will 404 */}
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
            <Route path="/benchmark-builder" element={<Navigate to="/resume-builder" replace />} />
            <Route path="/resume-builder-v7" element={<Navigate to="/resume-builder" replace />} />
            {/* Legacy routes redirect to main builder */}
            <Route path="/resume-builder-v8" element={<Navigate to="/resume-builder" replace />} />
            <Route path="/resume-builder-v9" element={<Navigate to="/resume-builder" replace />} />
            <Route path="/resume-builder-v3" element={<Navigate to="/resume-builder" replace />} />
            {/* Resume Builder - Primary 4-step flow */}
            <Route path="/resume-builder" element={
              <ProtectedRoute>
                <ModuleGate module="resume_jobs_studio">
                  <ResumeBuilderV3 />
                </ModuleGate>
              </ProtectedRoute>
            } />
            {/* Resume Optimizer Marketing Page */}
            <Route path="/resume-optimizer-info" element={<ResumeOptimizerMarketing />} />
            {/* V2 Resume Tailoring - Benchmark-based scoring */}
            <Route path="/resume-tailor" element={<ProtectedRoute><ResumeTailorV2 /></ProtectedRoute>} />
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