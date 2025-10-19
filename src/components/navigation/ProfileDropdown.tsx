import { Link, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { profileDropdownItems } from "@/config/navigation";
import { toast } from "sonner";

export const ProfileDropdown = () => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
      console.error("Sign out error:", error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-full">
        <Avatar className="h-9 w-9">
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px] z-[100]">
        {profileDropdownItems.map((item, index) => {
          if (item.type === 'separator') {
            return <DropdownMenuSeparator key={`separator-${index}`} />;
          }

          const ItemIcon = item.icon;

          if (item.action === 'signout') {
            return (
              <DropdownMenuItem
                key={item.label}
                onClick={handleSignOut}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer"
              >
                {ItemIcon && <ItemIcon className="h-4 w-4" />}
                <span>{item.label}</span>
              </DropdownMenuItem>
            );
          }

          return (
            <DropdownMenuItem key={item.path} asChild>
              <Link
                to={item.path!}
                className="flex items-center gap-3 px-3 py-2 w-full"
              >
                {ItemIcon && <ItemIcon className="h-4 w-4" />}
                <span>{item.label}</span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
