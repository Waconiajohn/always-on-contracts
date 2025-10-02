import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import ResumeUpload from "./pages/ResumeUpload";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import Coaching from "./pages/Coaching";
import ResumeOptimizer from "./pages/ResumeOptimizer";
import Agencies from "./pages/Agencies";
import Opportunities from "./pages/Opportunities";
import RateCalculator from "./pages/RateCalculator";
import Profile from "./pages/Profile";
import Templates from "./pages/Templates";
import APIKeys from "./pages/APIKeys";
import AutomationSettings from "./pages/AutomationSettings";
import ApplicationQueue from "./pages/ApplicationQueue";
import SearchProfiles from "./pages/SearchProfiles";
import AIAgents from "./pages/AIAgents";
import JobSearch from "./pages/JobSearch";
import CorporateAssistant from "./pages/agents/CorporateAssistant";
import JobSearchAgent from "./pages/agents/JobSearchAgent";
import ResumeBuilderAgent from "./pages/agents/ResumeBuilderAgent";
import InterviewPrepAgent from "./pages/agents/InterviewPrepAgent";
import WarChestDashboard from "./pages/WarChestDashboard";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
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
          <Route path="/job-search" element={<ProtectedRoute><JobSearch /></ProtectedRoute>} />
          <Route path="/ai-agents" element={<ProtectedRoute><AIAgents /></ProtectedRoute>} />
        <Route path="/agents/corporate-assistant" element={<ProtectedRoute><CorporateAssistant /></ProtectedRoute>} />
        <Route path="/agents/job-search" element={<ProtectedRoute><JobSearchAgent /></ProtectedRoute>} />
        <Route path="/agents/resume-builder" element={<ProtectedRoute><ResumeBuilderAgent /></ProtectedRoute>} />
        <Route path="/agents/interview-prep" element={<ProtectedRoute><InterviewPrepAgent /></ProtectedRoute>} />
        <Route path="/war-chest-dashboard" element={<ProtectedRoute><WarChestDashboard /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/pricing" element={<Pricing />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
