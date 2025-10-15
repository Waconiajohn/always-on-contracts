import { SidebarTrigger } from "@/components/ui/sidebar";
import { DarkModeToggle } from "./DarkModeToggle";
import { AppBreadcrumbs } from "./AppBreadcrumbs";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";

export const AppNav = () => {
  const { subscription } = useSubscription();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6 gap-6">
        <SidebarTrigger />
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-ai-primary via-ai-secondary to-ai-accent flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">C</span>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-ai-primary via-ai-secondary to-ai-accent bg-clip-text text-transparent">
              CareerIQ
            </h1>
            <p className="text-xs text-muted-foreground font-medium">AI-Powered Career Intelligence</p>
          </div>
        </div>
        <div className="flex-1">
          <AppBreadcrumbs />
        </div>
        {subscription?.subscribed && (
          <Badge variant={subscription.is_retirement_client ? "default" : "secondary"} className="mr-2 text-sm px-3 py-1">
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
