import { NavLink, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Home,
  LayoutDashboard,
  FolderKanban,
  Search,
  Building2,
  ClipboardList,
  MessageSquare,
  Settings,
  Calculator,
  Users,
  FileText,
  Key,
  TestTube,
  TrendingUp,
  Briefcase,
  Target,
  Brain,
  LogOut,
  Command,
  DollarSign,
  Shield,
  Package,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";
import logo from "@/assets/logo.png";

const navItems = [
  { path: "/career-vault", label: "Career Vault", icon: Package },
  { path: "/home", label: "Home", icon: Home },
  { path: "/projects", label: "Projects", icon: FolderKanban },
];

const jobSearchItems = [
  { path: "/agents/job-search", label: "Job Search", icon: Search },
  { path: "/opportunities", label: "Job Board", icon: TrendingUp },
  { path: "/application-queue", label: "Application Queue", icon: ClipboardList },
  { path: "/agencies", label: "Agencies", icon: Building2 },
];

const toolsItems = [
  { path: "/coaching", label: "Coaching", icon: MessageSquare },
  { path: "/career-command-center", label: "Command Center", icon: Target },
  { path: "/ai-agents", label: "AI Agents", icon: Brain },
  { path: "/rate-calculator", label: "Rate Calculator", icon: Calculator },
];

const settingsItems = [
  { path: "/profile", label: "Profile", icon: Users },
  { path: "/templates", label: "Templates", icon: FileText },
  { path: "/api-keys", label: "API Keys", icon: Key },
  { path: "/automation-settings", label: "Automation", icon: Settings },
];

const businessItems = [
  { path: "/pricing", label: "Pricing", icon: DollarSign },
  { path: "/affiliate-portal", label: "Affiliate Portal", icon: TrendingUp },
  { path: "/admin", label: "Admin Portal", icon: Shield },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { subscription } = useSubscription();
  const isCollapsed = state === "collapsed";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast({
      title: "Signed out",
      description: "You've been successfully signed out.",
    });
  };

  const NavGroup = ({ items, label }: { items: typeof navItems; label: string }) => (
    <SidebarGroup>
      {!isCollapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild tooltip={item.label}>
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <img src={logo} alt="CareerIQ" className="h-8 w-8" />
            {!isCollapsed && (
              <div>
                <div className="font-semibold text-sm">CareerIQ</div>
                <div className="text-xs text-muted-foreground">Command Center</div>
              </div>
            )}
          </div>
          
          {!isCollapsed && subscription?.subscribed && (
            <Badge variant={subscription.is_retirement_client ? "default" : "secondary"} className="text-xs">
              {subscription.is_retirement_client ? "Lifetime Access" : 
               subscription.tier === 'career_starter' ? "Career Starter" :
               subscription.tier === 'always_ready' ? "Always Ready" :
               subscription.tier === 'concierge_elite' ? "Concierge Elite" : "Active"}
            </Badge>
          )}
        </div>
        
        <Separator />

        <div className="px-3 py-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            size={isCollapsed ? "icon" : "sm"}
            onClick={() => {
              const event = new KeyboardEvent("keydown", {
                key: "k",
                metaKey: true,
                bubbles: true,
              });
              document.dispatchEvent(event);
            }}
          >
            <Command className="h-4 w-4" />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">Quick Search</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘K
                </kbd>
              </>
            )}
          </Button>
        </div>

        <Separator />

        <NavGroup items={navItems} label="Main" />
        <NavGroup items={jobSearchItems} label="Job Search" />
        <NavGroup items={toolsItems} label="Tools" />
        <NavGroup items={settingsItems} label="Settings" />
        <NavGroup items={businessItems} label="Business" />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out">
              <LogOut className="h-4 w-4" />
              {!isCollapsed && <span>Sign Out</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
