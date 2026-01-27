import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export default function ResumeOptimizer() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to Quick Score, preserving any state
    navigate('/quick-score', { 
      replace: true,
      state: location.state 
    });
  }, [navigate, location.state]);

  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <span className="ml-2 text-muted-foreground">Redirecting to Quick Score...</span>
    </div>
  );
}
