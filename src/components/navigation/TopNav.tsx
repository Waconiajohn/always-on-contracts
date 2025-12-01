import { Link, useLocation } from "react-router-dom";
import { Search, Shield, Code, Users, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { NavDropdown } from "./NavDropdown";
import { ProfileDropdown } from "./ProfileDropdown";
import { MobileNav } from "./MobileNav";
import { mainNavItems } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { getSeasonalIconColor } from "@/lib/seasonalColors";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const TopNav = () => {
  const { subscription } = useSubscription();
  const location = useLocation();

  // Check if user has admin role
  const { data: isAdmin } = useQuery({
    queryKey: ['admin-check'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error) {
        console.error('Admin check error:', error);
        return false;
      }

      return data;
    }
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6 gap-6">
        {/* Mobile Menu */}
        <MobileNav />

        {/* Logo */}
        <Link to="/home" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-ai-primary via-ai-secondary to-ai-accent flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-lg">C</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold bg-gradient-to-r from-ai-primary via-ai-secondary to-ai-accent bg-clip-text text-transparent">
              CareerIQ
            </h1>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {mainNavItems.map((item, index) => {
            const ItemIcon = item.icon;
            const iconColor = getSeasonalIconColor(index);

            if (item.dropdown) {
              return (
                <NavDropdown
                  key={item.label}
                  trigger={item.label}
                  icon={item.icon}
                  items={item.dropdown}
                  iconColor={iconColor}
                />
              );
            }

            const isActive = location.pathname === item.path;
            const isHighlighted = (item as any).highlight;

            return (
              <Link
                key={item.path}
                to={item.path!}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive && "bg-accent text-accent-foreground",
                  isHighlighted && !isActive && "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30"
                )}
              >
                <ItemIcon className={cn(
                  "h-4 w-4 transition-colors duration-500", 
                  isHighlighted ? "text-primary" : iconColor
                )} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Admin Links */}
          {isAdmin && (
            <NavDropdown
              trigger="Admin"
              icon={Shield}
              items={[
                { label: 'Prompt Manager', path: '/admin-prompt-manager', icon: Code },
                { label: 'User Roles', path: '/admin/user-roles', icon: Users },
                { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
              ]}
              iconColor="text-destructive"
            />
          )}
        </nav>

        {/* Right Side Utilities */}
        <div className="flex items-center gap-3 ml-auto">
          {/* Quick Search Button */}
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:flex items-center gap-2"
            onClick={() => {
              const event = new KeyboardEvent('keydown', {
                key: 'k',
                metaKey: true,
                bubbles: true
              });
              document.dispatchEvent(event);
            }}
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Quick Search</span>
            <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {/* Subscription Badge */}
          {subscription?.subscribed && (
            <Link to="/pricing">
              <Badge variant={subscription.is_retirement_client ? "default" : "secondary"} className="text-xs px-2 py-1">
                {subscription.is_retirement_client ? "Lifetime" : 
                 subscription.tier === 'concierge_elite' ? "Elite" :
                 subscription.tier === 'always_ready' ? "Ready" : "Starter"}
              </Badge>
            </Link>
          )}

          {/* Dark Mode Toggle */}
          <DarkModeToggle />

          {/* Profile Dropdown */}
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
};
