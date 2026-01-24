import { ReactNode } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ResumeBuilderShellProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showBreadcrumb?: boolean;
}

// Breadcrumb path mapping
const pathLabels: Record<string, string> = {
  'upload': 'Upload Resume',
  'jd': 'Job Description',
  'target': 'Target Role',
  'processing': 'Analyzing...',
  'report': 'Match Report',
  'fix': 'Fix Issues',
  'studio': 'Rewrite Studio',
  'summary': 'Summary',
  'skills': 'Skills',
  'experience': 'Experience',
  'education': 'Education',
  'review': 'Final Review',
  'export': 'Export',
};

export function ResumeBuilderShell({ 
  children, 
  title, 
  subtitle,
  showBreadcrumb = true 
}: ResumeBuilderShellProps) {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const location = useLocation();

  // Parse current path for breadcrumb
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = buildBreadcrumb(pathParts, projectId);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        {showBreadcrumb && breadcrumbItems.length > 0 && (
          <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
            <button
              onClick={() => navigate('/resume-builder')}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Projects</span>
            </button>
            {breadcrumbItems.map((item, index) => (
              <div key={index} className="flex items-center gap-1">
                <ChevronRight className="h-4 w-4" />
                {item.path ? (
                  <button
                    onClick={() => navigate(item.path!)}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-foreground font-medium">{item.label}</span>
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Page Header */}
        {(title || subtitle) && (
          <header className="mb-8">
            {title && (
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">
                {subtitle}
              </p>
            )}
          </header>
        )}

        {/* Main Content */}
        <main>{children}</main>
      </div>
    </div>
  );
}

interface BreadcrumbItem {
  label: string;
  path?: string;
}

function buildBreadcrumb(pathParts: string[], projectId?: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];
  
  // Skip 'resume-builder' prefix
  const relevantParts = pathParts.slice(1);
  
  if (!relevantParts.length) return items;
  
  // If we have a project ID, it's the first relevant part
  if (projectId && relevantParts[0] === projectId) {
    // Don't show project ID in breadcrumb, start from the step
    const stepParts = relevantParts.slice(1);
    
    stepParts.forEach((part, index) => {
      const label = pathLabels[part] || part;
      const isLast = index === stepParts.length - 1;
      
      if (isLast) {
        items.push({ label });
      } else {
        // Build path up to this point
        const pathUpToHere = `/resume-builder/${projectId}/${stepParts.slice(0, index + 1).join('/')}`;
        items.push({ label, path: pathUpToHere });
      }
    });
  }
  
  return items;
}

// Page container with consistent padding
interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {children}
    </div>
  );
}

export default ResumeBuilderShell;
