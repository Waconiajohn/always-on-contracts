import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import { mainNavItems, profileDropdownItems } from "@/config/navigation";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setOpen(false);
      navigate("/");
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error("Sign out error:", error);
    }
  };

  const handleNavClick = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-ai-primary via-ai-secondary to-ai-accent flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <span className="bg-gradient-to-r from-ai-primary via-ai-secondary to-ai-accent bg-clip-text text-transparent">
              CareerIQ
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-2">
          {mainNavItems.map((item) => {
            const ItemIcon = item.icon;

            if (item.dropdown) {
              return (
                <Accordion type="single" collapsible key={item.label}>
                  <AccordionItem value={item.label} className="border-0">
                    <AccordionTrigger className="py-2 px-3 hover:bg-accent rounded-md">
                      <div className="flex items-center gap-3">
                        <ItemIcon className="h-4 w-4" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0 pt-2">
                      <div className="space-y-1 ml-4">
                        {item.dropdown.map((subItem) => {
                          const SubIcon = subItem.icon;
                          return (
                            <Link
                              key={subItem.path}
                              to={subItem.path}
                              onClick={handleNavClick}
                              className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                            >
                              <SubIcon className="h-4 w-4" />
                              <span>{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path!}
                onClick={handleNavClick}
                className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors"
              >
                <ItemIcon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <Separator className="my-4" />

          <div className="space-y-1">
            {profileDropdownItems.map((item, index) => {
              if (item.type === 'separator') {
                return <Separator key={`separator-${index}`} className="my-2" />;
              }

              const ItemIcon = item.icon;

              if (item.action === 'signout') {
                return (
                  <button
                    key={item.label}
                    onClick={handleSignOut}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors w-full text-left"
                  >
                    {ItemIcon && <ItemIcon className="h-4 w-4" />}
                    <span>{item.label}</span>
                  </button>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path!}
                  onClick={handleNavClick}
                  className="flex items-center gap-3 px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors"
                >
                  {ItemIcon && <ItemIcon className="h-4 w-4" />}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
