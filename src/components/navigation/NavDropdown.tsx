import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, type LucideIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface DropdownItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface NavDropdownProps {
  trigger: string;
  icon: LucideIcon;
  items: DropdownItem[];
}

export const NavDropdown = ({ trigger, icon: Icon, items }: NavDropdownProps) => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const isChildActive = items.some(item => location.pathname === item.path);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isChildActive && "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{trigger}</span>
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[220px] z-[100]">
        {items.map((item) => {
          const ItemIcon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <DropdownMenuItem key={item.path} asChild>
              <Link
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 w-full",
                  isActive && "bg-accent text-accent-foreground font-medium"
                )}
              >
                <ItemIcon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
