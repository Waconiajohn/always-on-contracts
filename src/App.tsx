import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { CommandMenu } from "@/components/CommandMenu";
import { AppSidebar } from "@/components/AppSidebar";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

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
const Opportunities = lazy(() => import("./pages/Opportunities"));
const RateCalculator = lazy(() => import("./pages/RateCalculator"));
const Profile = lazy(() => import("./pages/Profile"));
const Templates = lazy(() => import("./pages/Templates"));
const APIKeys = lazy(() => import("./pages/APIKeys"));
const AutomationSettings = lazy(() => import("./pages/AutomationSettings"));
const ApplicationQueue = lazy(() => import("./pages/ApplicationQueue"));
const SearchProfiles = lazy(() => import("./pages/SearchProfiles"));
const AIAgents = lazy(() => import("./pages/AIAgents"));
const CorporateAssistant = lazy(() => import("./pages/agents/CorporateAssistant"));
const JobSearchAgent = lazy(() => import("./pages/agents/JobSearchAgent"));
const ResumeBuilderAgent = lazy(() => import("./pages/agents/ResumeBuilderAgent"));
const InterviewPrepAgent = lazy(() => import("./pages/agents/InterviewPrepAgent"));
const LinkedInBloggingAgent = lazy(() => import("./pages/agents/LinkedInBloggingAgent"));
const AutoApplyAgent = lazy(() => import("./pages/agents/AutoApplyAgentComplete"));
const LinkedInProfileBuilder = lazy(() => import("./pages/agents/LinkedInProfileBuilder"));
const NetworkingAgent = lazy(() => import("./pages/agents/NetworkingAgentComplete"));
const CareerTrendsScout = lazy(() => import("./pages/agents/CareerTrendsScout"));
const FinancialPlanningAssistant = lazy(() => import("./pages/agents/FinancialPlanningAssistant"));
const CareerDashboard = lazy(() => import("./pages/CareerDashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const AffiliatePortal = lazy(() => import("./pages/AffiliatePortal"));
const RedeemCode = lazy(() => import("./pages/RedeemCode"));
const AdminPortal = lazy(() => import("./pages/AdminPortal"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const WarChestDashboard = lazy(() => import("./pages/WarChestDashboard"));
const WarChestOnboarding = lazy(() => import("./pages/WarChestOnboarding"));
const LearningCenter = lazy(() => import("./pages/LearningCenter"));
const ReferralProgram = lazy(() => import("./pages/ReferralProgram"));
const CareerCommandCenter = lazy(() => import("./pages/CareerCommandCenter"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProcessingMonitor = lazy(() => import("./pages/ProcessingMonitor"));
const Outreach = lazy(() => import("./pages/Outreach"));
const ExperimentalLab = lazy(() => import("./pages/ExperimentalLab"));
const MCPTestDashboard = lazy(() => import("./pages/MCPTestDashboard"));

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
      <TooltipProvider delayDuration={300} skipDelayDuration={0}>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="flex min-h-screen w-full">
              <AppSidebar />
              <div className="flex-1 flex flex-col">
                <CommandMenu />
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
          <Route path="/opportunities" element={<ProtectedRoute><Opportunities /></ProtectedRoute>} />
          <Route path="/rate-calculator" element={<ProtectedRoute><RateCalculator /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><Templates /></ProtectedRoute>} />
          <Route path="/api-keys" element={<ProtectedRoute><APIKeys /></ProtectedRoute>} />
          <Route path="/automation-settings" element={<ProtectedRoute><AutomationSettings /></ProtectedRoute>} />
          <Route path="/application-queue" element={<ProtectedRoute><ApplicationQueue /></ProtectedRoute>} />
          <Route path="/search-profiles" element={<ProtectedRoute><SearchProfiles /></ProtectedRoute>} />
          <Route path="/ai-agents" element={<ProtectedRoute><AIAgents /></ProtectedRoute>} />
        <Route path="/agents/corporate-assistant" element={<ProtectedRoute><CorporateAssistant /></ProtectedRoute>} />
        <Route path="/agents/job-search" element={<ProtectedRoute><JobSearchAgent /></ProtectedRoute>} />
        <Route path="/agents/resume-builder" element={<ProtectedRoute><ResumeBuilderAgent /></ProtectedRoute>} />
        <Route path="/agents/interview-prep" element={<ProtectedRoute><InterviewPrepAgent /></ProtectedRoute>} />
        <Route path="/agents/linkedin-blogging" element={<ProtectedRoute><LinkedInBloggingAgent /></ProtectedRoute>} />
        <Route path="/agents/auto-apply" element={<ProtectedRoute><AutoApplyAgent /></ProtectedRoute>} />
        <Route path="/agents/linkedin-profile" element={<ProtectedRoute><LinkedInProfileBuilder /></ProtectedRoute>} />
        <Route path="/agents/networking" element={<ProtectedRoute><NetworkingAgent /></ProtectedRoute>} />
        <Route path="/agents/career-trends" element={<ProtectedRoute><CareerTrendsScout /></ProtectedRoute>} />
        <Route path="/agents/financial-planning" element={<ProtectedRoute><FinancialPlanningAssistant /></ProtectedRoute>} />
        <Route path="/career-tools" element={<ProtectedRoute><CareerDashboard /></ProtectedRoute>} />
        <Route path="/career-command-center" element={<ProtectedRoute><CareerCommandCenter /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/affiliate-portal" element={<ProtectedRoute><AffiliatePortal /></ProtectedRoute>} />
          <Route path="/redeem-code" element={<ProtectedRoute><RedeemCode /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
            <Route path="/admin/analytics" element={<ProtectedRoute><AdminAnalytics /></ProtectedRoute>} />
            <Route path="/war-chest" element={<ProtectedRoute><WarChestDashboard /></ProtectedRoute>} />
            <Route path="/war-chest/onboarding" element={<ProtectedRoute><WarChestOnboarding /></ProtectedRoute>} />
            <Route path="/learn" element={<ProtectedRoute><LearningCenter /></ProtectedRoute>} />
            <Route path="/referrals" element={<ProtectedRoute><ReferralProgram /></ProtectedRoute>} />
            <Route path="/processing-monitor" element={<ProtectedRoute><ProcessingMonitor /></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
