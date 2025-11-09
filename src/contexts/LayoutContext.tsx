import React, { createContext, useContext, useState, useEffect } from 'react';

interface LayoutContextType {
  leftSidebarCollapsed: boolean;
  rightSidebarCollapsed: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarCollapsed: (collapsed: boolean) => void;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

const LAYOUT_STORAGE_KEY = 'careeriq-layout-preferences';

export const LayoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.leftSidebarCollapsed ?? false;
      } catch (error) {
        console.error('Failed to parse layout preferences:', error);
        localStorage.removeItem(LAYOUT_STORAGE_KEY);
      }
    }
    return false;
  });

  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.rightSidebarCollapsed ?? false;
      } catch (error) {
        console.error('Failed to parse layout preferences:', error);
        localStorage.removeItem(LAYOUT_STORAGE_KEY);
      }
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({ leftSidebarCollapsed, rightSidebarCollapsed })
    );
  }, [leftSidebarCollapsed, rightSidebarCollapsed]);

  const toggleLeftSidebar = () => setLeftSidebarCollapsed((prev: boolean) => !prev);
  const toggleRightSidebar = () => setRightSidebarCollapsed((prev: boolean) => !prev);

  return (
    <LayoutContext.Provider
      value={{
        leftSidebarCollapsed,
        rightSidebarCollapsed,
        toggleLeftSidebar,
        toggleRightSidebar,
        setLeftSidebarCollapsed,
        setRightSidebarCollapsed,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
