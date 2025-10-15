import { SidebarTrigger } from "@/components/ui/sidebar";
import { DarkModeToggle } from "./DarkModeToggle";
import { AppBreadcrumbs } from "./AppBreadcrumbs";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";

export const AppNav = () => {
  const { subscription } = useSubscription();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 gap-4">
        <SidebarTrigger />
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-ai-primary to-ai-secondary flex items-center justify-center">
            <span className="text-white font-bold">C</span>
          </div>
          <div>
            <h1 className="text-sm font-bold bg-gradient-to-r from-ai-primary to-ai-secondary bg-clip-text text-transparent">
              CareerIQ
            </h1>
          </div>
        </div>
        <div className="flex-1">
          <AppBreadcrumbs />
        </div>
        {subscription?.subscribed && (
          <Badge variant={subscription.is_retirement_client ? "default" : "secondary"} className="mr-2">
            {subscription.is_retirement_client ? "Lifetime" : 
             subscription.tier === 'concierge_elite' ? "Elite" :
             subscription.tier === 'always_ready' ? "Ready" : "Starter"}
          </Badge>
        )}
        <DarkModeToggle />
      </div>
    </header>
  );
};
