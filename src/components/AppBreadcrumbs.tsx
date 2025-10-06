import { useLocation, Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Home } from "lucide-react";

const routeNames: Record<string, string> = {
  home: "Home",
  dashboard: "Dashboard",
  projects: "Projects",
  "job-search": "Job Search",
  opportunities: "Opportunities",
  "application-queue": "Application Queue",
  agencies: "Agencies",
  coaching: "Coaching",
  "career-dashboard": "Career Dashboard",
  "career-vault-dashboard": "Career Vault",
  "ai-agents": "AI Agents",
  "rate-calculator": "Rate Calculator",
  profile: "Profile",
  templates: "Templates",
  "api-keys": "API Keys",
  "automation-settings": "Automation",
  "experimental-lab": "Experimental Lab",
  "resume-optimizer": "Resume Optimizer",
  "resume-upload": "Resume Upload",
  outreach: "Outreach",
  "search-profiles": "Search Profiles",
  onboarding: "Onboarding",
  agents: "Agents",
  "corporate-assistant": "Corporate Assistant",
  "resume-builder": "Resume Builder",
  "job-search-agent": "Job Search Agent",
  "interview-prep": "Interview Prep",
  "mcp-test": "MCP Test",
};

export const AppBreadcrumbs = () => {
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  if (pathSegments.length === 0 || location.pathname === "/") {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/home" className="flex items-center gap-1">
              <Home className="h-3.5 w-3.5" />
              <span className="sr-only">Home</span>
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {pathSegments.map((segment, index) => {
          const path = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;
          const name = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

          return (
            <div key={path} className="flex items-center gap-2">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link to={path}>{name}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
