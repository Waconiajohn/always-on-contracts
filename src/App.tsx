import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandMenu } from "@/components/CommandMenu";
import { TopNav } from "@/components/navigation/TopNav";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutProvider } from "@/contexts/LayoutContext";

// Lazy load all pages
const Landing = lazy(() => import("./pages/Landing"));
const Home = lazy(() => import("./pages/Home"));
const Projects = lazy(() => import("./pages/Projects"));
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
const ResumeBuilderAgent = lazy(() => import("./pages/agents/ResumeBuilderAgent"));
const ResumeBuilderWizard = lazy(() => import("./pages/agents/ResumeBuilderWizard"));
const InterviewPrepAgent = lazy(() => import("./pages/agents/InterviewPrepAgent"));
const LinkedInBloggingAgent = lazy(() => import("./pages/agents/LinkedInBloggingAgent"));
const LinkedInProfileBuilder = lazy(() => import("./pages/agents/LinkedInProfileBuilder"));
const NetworkingAgent = lazy(() => import("./pages/agents/NetworkingAgentComplete"));
const CareerTrendsScout = lazy(() => import("./pages/agents/CareerTrendsScout"));
const FinancialPlanningAssistant = lazy(() => import("./pages/agents/FinancialPlanningAssistant"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AffiliatePortal = lazy(() => import("./pages/AffiliatePortal"));
const RedeemCode = lazy(() => import("./pages/RedeemCode"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const CareerVaultDashboard = lazy(() => import("./pages/CareerVaultDashboard"));
const CareerVaultOnboarding = lazy(() => import("./pages/CareerVaultOnboardingEnhanced"));
const LearningCenter = lazy(() => import("./pages/LearningCenter"));
const ResearchHub = lazy(() => import("./pages/ResearchHub"));
const ReferralProgram = lazy(() => import("./pages/ReferralProgram"));
const CommandCenter = lazy(() => import("./pages/CommandCenter"));
const DailyWorkflow = lazy(() => import("./pages/DailyWorkflow"));
const SalaryNegotiation = lazy(() => import("./pages/SalaryNegotiation"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProcessingMonitor = lazy(() => import("./pages/ProcessingMonitor"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex-1 p-8 space-y-4">
    <Skeleton className="h-12 w-64" />
    <Skeleton className="h-96 w-full" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <LayoutProvider>
        <TooltipProvider delayDuration={300} skipDelayDuration={0}>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <CommandMenu />
            <div className="flex min-h-screen w-full flex-col">
              <TopNav />
              <main className="flex-1">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/resume-upload" element={<ProtectedRoute><ResumeUpload /></ProtectedRoute>} />
          <Route path="/coaching" element={<ProtectedRoute><Coaching /></ProtectedRoute>} />
          <Route path="/resume-optimizer" element={<ProtectedRoute><ResumeOptimizer /></ProtectedRoute>} />
          <Route path="/agencies" element={<ProtectedRoute><Agencies /></ProtectedRoute>} />
          <Route path="/job-search" element={<ProtectedRoute><JobSearch /></ProtectedRoute>} />
          <Route path="/application-queue" element={<ProtectedRoute><ApplicationQueue /></ProtectedRoute>} />
          <Route path="/boolean-search" element={<ProtectedRoute><BooleanSearch /></ProtectedRoute>} />
          <Route path="/rate-calculator" element={<ProtectedRoute><RateCalculator /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/api-keys" element={<ProtectedRoute><APIKeys /></ProtectedRoute>} />
          <Route path="/ai-agents" element={<ProtectedRoute><AIAgents /></ProtectedRoute>} />
        <Route path="/agents/corporate-assistant" element={<ProtectedRoute><CorporateAssistant /></ProtectedRoute>} />
        <Route path="/agents/resume-builder" element={<ProtectedRoute><ResumeBuilderWizard /></ProtectedRoute>} />
        <Route path="/agents/resume-builder-old" element={<ProtectedRoute><ResumeBuilderAgent /></ProtectedRoute>} />
        <Route path="/agents/interview-prep" element={<ProtectedRoute><InterviewPrepAgent /></ProtectedRoute>} />
        <Route path="/agents/linkedin-blogging" element={<ProtectedRoute><LinkedInBloggingAgent /></ProtectedRoute>} />
        <Route path="/agents/linkedin-profile" element={<ProtectedRoute><LinkedInProfileBuilder /></ProtectedRoute>} />
        <Route path="/agents/networking" element={<ProtectedRoute><NetworkingAgent /></ProtectedRoute>} />
        <Route path="/agents/career-trends" element={<ProtectedRoute><CareerTrendsScout /></ProtectedRoute>} />
        <Route path="/agents/financial-planning" element={<ProtectedRoute><FinancialPlanningAssistant /></ProtectedRoute>} />
        <Route path="/career-tools" element={<Navigate to="/command-center" replace />} />
        <Route path="/command-center" element={<ProtectedRoute><CommandCenter /></ProtectedRoute>} />
        <Route path="/dashboard" element={<Navigate to="/command-center" replace />} />
        <Route path="/daily-workflow" element={<ProtectedRoute><DailyWorkflow /></ProtectedRoute>} />
        <Route path="/salary-negotiation" element={<ProtectedRoute><SalaryNegotiation /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/affiliate-portal" element={<ProtectedRoute><AffiliatePortal /></ProtectedRoute>} />
          <Route path="/redeem-code" element={<ProtectedRoute><RedeemCode /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/career-vault" element={<ProtectedRoute><CareerVaultDashboard /></ProtectedRoute>} />
            <Route path="/career-vault/onboarding" element={<ProtectedRoute><CareerVaultOnboarding /></ProtectedRoute>} />
            {/* Redirects from old War Chest routes */}
            <Route path="/war-chest" element={<Navigate to="/career-vault" replace />} />
            <Route path="/war-chest/onboarding" element={<Navigate to="/career-vault/onboarding" replace />} />
            <Route path="/learn" element={<ProtectedRoute><LearningCenter /></ProtectedRoute>} />
            <Route path="/learning-center" element={<ProtectedRoute><LearningCenter /></ProtectedRoute>} />
            <Route path="/research-hub" element={<ProtectedRoute><ResearchHub /></ProtectedRoute>} />
            <Route path="/referrals" element={<ProtectedRoute><ReferralProgram /></ProtectedRoute>} />
            <Route path="/processing-monitor" element={<ProtectedRoute><ProcessingMonitor /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </LayoutProvider>
  </QueryClientProvider>
</ErrorBoundary>
);

export default App;
