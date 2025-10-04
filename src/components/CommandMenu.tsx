import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
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
  DollarSign,
} from "lucide-react";

interface CommandItem {
  title: string;
  path: string;
  icon: any;
  keywords?: string[];
}

const commandItems: CommandItem[] = [
  { title: "Home", path: "/home", icon: Home, keywords: ["dashboard", "main"] },
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard, keywords: ["overview", "main"] },
  { title: "Projects", path: "/projects", icon: FolderKanban, keywords: ["tasks", "work"] },
  { title: "Job Search", path: "/job-search", icon: Search, keywords: ["find", "opportunities"] },
  { title: "Opportunities", path: "/opportunities", icon: TrendingUp, keywords: ["jobs", "matches"] },
  { title: "Application Queue", path: "/application-queue", icon: ClipboardList, keywords: ["apply", "track"] },
  { title: "Agencies", path: "/agencies", icon: Building2, keywords: ["recruiters", "staffing"] },
  { title: "Coaching", path: "/coaching", icon: MessageSquare, keywords: ["mentor", "advice"] },
  { title: "Career Dashboard", path: "/career-dashboard", icon: Target, keywords: ["career", "tools"] },
  { title: "War Chest", path: "/war-chest-dashboard", icon: Briefcase, keywords: ["skills", "achievements"] },
  { title: "AI Agents", path: "/ai-agents", icon: Brain, keywords: ["artificial intelligence", "automation"] },
  { title: "Rate Calculator", path: "/rate-calculator", icon: Calculator, keywords: ["salary", "money", "pay"] },
  { title: "Profile", path: "/profile", icon: Users, keywords: ["account", "settings"] },
  { title: "Templates", path: "/templates", icon: FileText, keywords: ["email", "communication"] },
  { title: "API Keys", path: "/api-keys", icon: Key, keywords: ["integration", "mcp"] },
  { title: "Automation Settings", path: "/automation-settings", icon: Settings, keywords: ["configure", "preferences"] },
  { title: "Experimental Lab", path: "/experimental-lab", icon: TestTube, keywords: ["beta", "features"] },
  { title: "Resume Optimizer", path: "/resume-optimizer", icon: FileText, keywords: ["cv", "resume"] },
];

export const CommandMenu = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {commandItems.slice(0, 3).map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.path}
                onSelect={() => handleSelect(item.path)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Job Search">
          {commandItems.slice(3, 7).map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.path}
                onSelect={() => handleSelect(item.path)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Tools & Settings">
          {commandItems.slice(7).map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.path}
                onSelect={() => handleSelect(item.path)}
                className="cursor-pointer"
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{item.title}</span>
              </CommandItem>
            );
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
};
