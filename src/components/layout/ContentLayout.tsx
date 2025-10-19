import React from 'react';
import { cn } from '@/lib/utils';

interface ContentLayoutProps {
  leftSidebar?: React.ReactNode;
  rightSidebar?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: 'full' | 'container' | 'narrow';
  className?: string;
}

export const ContentLayout: React.FC<ContentLayoutProps> = ({
  leftSidebar,
  rightSidebar,
  children,
  maxWidth = 'full',
  className,
}) => {
  return (
    <div className="flex min-h-[calc(100vh-64px)] w-full">
      {/* Left Sidebar */}
      {leftSidebar}

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 overflow-x-hidden',
          maxWidth === 'container' && 'container mx-auto px-4 py-8',
          maxWidth === 'narrow' && 'max-w-4xl mx-auto px-4 py-8',
          maxWidth === 'full' && 'w-full',
          className
        )}
      >
        {children}
      </main>

      {/* Right Sidebar */}
      {rightSidebar}
    </div>
  );
};
