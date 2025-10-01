import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import ResumeUpload from "./pages/ResumeUpload";
import Pricing from "./pages/Pricing";
import Auth from "./pages/Auth";
import Strategy from "./pages/Strategy";
import Agencies from "./pages/Agencies";

import Opportunities from "./pages/Opportunities";
import RateCalculator from "./pages/RateCalculator";
import Profile from "./pages/Profile";
import Templates from "./pages/Templates";
import APIKeys from "./pages/APIKeys";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/resume-upload" element={<ResumeUpload />} />
          <Route path="/strategy" element={<Strategy />} />
          <Route path="/agencies" element={<Agencies />} />
          
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/rate-calculator" element={<RateCalculator />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/api-keys" element={<APIKeys />} />
          <Route path="/pricing" element={<Pricing />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
