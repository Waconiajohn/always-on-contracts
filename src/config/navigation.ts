import {
  Home,
  Package,
  Search,
  FileText,
  Linkedin,
  MessageSquare,
  Building2,
  TrendingUp,
  LineChart,
  Users,
  DollarSign,
  Brain,
  BookOpen,
  Calendar,
  User,
  Key,
  CreditCard,
  LogOut,
  FlaskConical,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path?: string;
  icon: LucideIcon;
  dropdown?: DropdownItem[];
}

export interface DropdownItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

export interface ProfileItem {
  label?: string;
  path?: string;
  icon?: LucideIcon;
  action?: 'signout';
  type?: 'separator';
}

export const mainNavItems: NavItem[] = [
  { 
    label: 'Home', 
    path: '/home', 
    icon: Home 
  },
  { 
    label: 'Career Vault', 
    path: '/career-vault', 
    icon: Package 
  },
  {
    label: 'Job Search',
    icon: Search,
    dropdown: [
      { label: 'Search Jobs', path: '/job-search', icon: Search },
      { label: 'Active Applications', path: '/active-applications', icon: Package },
      { label: 'Boolean Search', path: '/boolean-search', icon: Search },
      { label: 'Career Trends', path: '/agents/career-trends', icon: TrendingUp },
      { label: 'Research Hub', path: '/research-hub', icon: LineChart },
    ],
  },
    {
    label: 'Resume',
    icon: FileText,
    dropdown: [
      { label: 'Resume Builder', path: '/agents/resume-builder-wizard', icon: FileText },
      { label: 'My Resumes', path: '/my-resumes', icon: FileText },
      { label: 'Templates', path: '/templates', icon: FileText },
    ],
  },
  {
    label: 'LinkedIn',
    icon: Linkedin,
    dropdown: [
      { label: 'Profile', path: '/agents/linkedin-profile', icon: Linkedin },
      { label: 'Content', path: '/agents/linkedin-blogging', icon: MessageSquare },
      { label: 'Networking', path: '/agents/networking', icon: Users },
    ],
  },
  {
    label: 'Interview',
    icon: MessageSquare,
    dropdown: [
      { label: 'Interview Prep', path: '/agents/interview-prep', icon: MessageSquare },
      { label: 'Salary Negotiation', path: '/salary-negotiation', icon: DollarSign },
    ],
  },
  { 
    label: 'Agencies', 
    path: '/agencies', 
    icon: Building2 
  },
  {
    label: 'Settings',
    icon: Settings,
    dropdown: [
      { label: 'Testing Dashboard', path: '/testing-dashboard', icon: FlaskConical },
      { label: 'Profile Settings', path: '/profile', icon: User },
      { label: 'API Keys', path: '/api-keys', icon: Key },
    ],
  },
];

export const profileDropdownItems: ProfileItem[] = [
  { label: 'Financial Planning', path: '/agents/financial-planning', icon: DollarSign },
  { label: 'AI Coach', path: '/coaching', icon: Brain },
  { label: 'Learning Center', path: '/learning-center', icon: BookOpen },
  { label: 'Daily Workflow', path: '/daily-workflow', icon: Calendar },
  { type: 'separator' },
  { label: 'Testing Dashboard', path: '/testing-dashboard', icon: FlaskConical },
  { type: 'separator' },
  { label: 'Profile Settings', path: '/profile', icon: User },
  { label: 'API Keys', path: '/api-keys', icon: Key },
  { label: 'Subscription', path: '/pricing', icon: CreditCard },
  { type: 'separator' },
  { label: 'Sign Out', action: 'signout', icon: LogOut },
];
