import {
  Home,
  Package,
  Search,
  FileText,
  Linkedin,
  MessageSquare,
  Building2,
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
  Zap,
  Briefcase,
  MoreHorizontal,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  path?: string;
  icon: LucideIcon;
  dropdown?: DropdownItem[];
  highlight?: boolean;
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

// NEW NAVIGATION: Score → Build → Apply → Win
// Career Vault moves to background, Quick Score and Resume Builder front and center
export const mainNavItems: NavItem[] = [
  { 
    label: 'Home', 
    path: '/home', 
    icon: Home 
  },
  { 
    label: 'Quick Score', 
    path: '/quick-score', 
    icon: Zap,
    highlight: true // This will be styled prominently
  },
  { 
    label: 'Resume Builder', 
    path: '/agents/resume-builder-wizard', 
    icon: FileText 
  },
  { 
    label: 'Find Jobs', 
    path: '/job-search', 
    icon: Search 
  },
  { 
    label: 'My Applications', 
    path: '/active-applications', 
    icon: Briefcase 
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
    label: 'More',
    icon: MoreHorizontal,
    dropdown: [
      // Career Vault - now secondary
      { label: 'Career Vault', path: '/career-vault', icon: Package },
      { label: 'My Resumes', path: '/my-resumes', icon: FileText },
      { label: 'Resume Templates', path: '/templates', icon: FileText },
      // LinkedIn tools
      { label: 'LinkedIn Profile', path: '/agents/linkedin-profile-builder', icon: Linkedin },
      { label: 'LinkedIn Content', path: '/agents/linkedin-blogging', icon: MessageSquare },
      { label: 'Networking', path: '/agents/networking', icon: Users },
      // Other
      { label: 'Agencies', path: '/agencies', icon: Building2 },
      { label: 'AI Coach', path: '/coaching', icon: Brain },
      { label: 'Learning Center', path: '/learning-center', icon: BookOpen },
    ],
  },
  {
    label: 'Settings',
    icon: Settings,
    dropdown: [
      { label: 'Profile Settings', path: '/profile', icon: User },
      { label: 'API Keys', path: '/api-keys', icon: Key },
      { label: 'Testing Dashboard', path: '/testing-dashboard', icon: FlaskConical },
    ],
  },
];

export const profileDropdownItems: ProfileItem[] = [
  { label: 'Quick Score', path: '/quick-score', icon: Zap },
  { label: 'Career Vault', path: '/career-vault', icon: Package },
  { type: 'separator' },
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
