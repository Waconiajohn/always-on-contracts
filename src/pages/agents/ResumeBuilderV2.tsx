import { Navigate } from 'react-router-dom';

// ResumeBuilderV2 is deprecated - redirect to the main resume builder
export default function ResumeBuilderV2() {
  return <Navigate to="/resume-builder" replace />;
}
