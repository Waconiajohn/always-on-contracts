import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, FileText, Target, Briefcase, ListChecks, Settings, LogOut, Menu, Brain, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export const AppNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/auth");
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const navItems = [
    { path: "/home", label: "Home", icon: Home },
    { path: "/onboarding", label: "Getting Started", icon: Target },
    { path: "/agents/corporate-assistant", label: "Corporate Assistant", icon: Sparkles },
    { path: "/war-chest-dashboard", label: "War Chest", icon: FileText },
    { path: "/agents/interview-prep", label: "Interview Prep", icon: Brain },
    { path: "/projects", label: "Projects", icon: Briefcase },
    { path: "/application-queue", label: "Queue", icon: ListChecks },
  ];

  const NavButton = ({ item, onClick }: { item: typeof navItems[0]; onClick?: () => void }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;
    
    return (
      <Button
        variant={isActive ? "default" : "ghost"}
        onClick={() => {
          navigate(item.path);
          onClick?.();
        }}
        className="w-full justify-start"
      >
        <Icon className="mr-2 h-4 w-4" />
        {item.label}
      </Button>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="font-bold text-xl hover:text-primary transition-colors"
          >
            Max Job Offers
          </button>
          <p className="text-xs text-muted-foreground hidden md:block">Your AI powered career assistant</p>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <NavButton key={item.path} item={item} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
          </Button>

          {/* Mobile Navigation */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-4">
                {navItems.map((item) => (
                  <NavButton key={item.path} item={item} onClick={() => setOpen(false)} />
                ))}
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleSignOut();
                    setOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
