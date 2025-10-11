import { SidebarTrigger } from "@/components/ui/sidebar";
import { DarkModeToggle } from "./DarkModeToggle";
import { AppBreadcrumbs } from "./AppBreadcrumbs";

export const AppNav = () => {

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        <SidebarTrigger />
        <div className="flex-1">
          <AppBreadcrumbs />
        </div>
        <DarkModeToggle />
      </div>
    </header>
  );
};
