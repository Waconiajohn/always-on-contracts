import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ResumeProcessingMonitor } from "@/components/ResumeProcessingMonitor";

const ProcessingMonitorContent = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="lg" onClick={() => navigate('/home')}>
              <ArrowLeft className="mr-2 h-6 w-6" />
              Back to Dashboard
            </Button>
            <h1 className="text-2xl font-bold">Resume Processing Monitor</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ResumeProcessingMonitor />
      </main>
    </div>
  );
};

const ProcessingMonitor = () => {
  return (
    <ProtectedRoute>
      <ProcessingMonitorContent />
    </ProtectedRoute>
  );
};

export default ProcessingMonitor;