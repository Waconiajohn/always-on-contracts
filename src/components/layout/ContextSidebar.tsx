import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ContextSidebarProps {
  side: 'left' | 'right';
  children: React.ReactNode;
  collapsed?: boolean;
  onToggle?: () => void;
  width?: 'sm' | 'md' | 'lg'; // sm=256px, md=320px, lg=384px
  className?: string;
}

export const ContextSidebar: React.FC<ContextSidebarProps> = ({
  side,
  children,
  collapsed = false,
  onToggle,
  width = 'md',
  className,
}) => {
  const widthClasses = {
    sm: collapsed ? 'w-14' : 'w-64',
    md: collapsed ? 'w-14' : 'w-80',
    lg: collapsed ? 'w-14' : 'w-96'
  };
  return (
    <aside
      className={cn(
        'sticky top-[64px] h-[calc(100vh-64px)] bg-background overflow-y-auto transition-all duration-300',
        side === 'left' ? 'border-r' : 'border-l',
        widthClasses[width],
        className
      )}
      aria-label={`${side} sidebar`}
      aria-expanded={!collapsed}
    >
      {/* Toggle button */}
      {onToggle && (
        <div className={cn(
          'sticky top-0 z-10 bg-background border-b p-2 flex',
          side === 'left' ? 'justify-end' : 'justify-start'
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              side === 'left' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />
            ) : (
              side === 'left' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Sidebar content */}
      <div className={cn('p-4', collapsed && 'hidden')}>
        {children}
      </div>
    </aside>
  );
};
