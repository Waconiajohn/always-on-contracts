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
  Mic,
  type LucideIcon,
} from "lucide-react";
import { ModuleId } from "./modules";

export interface NavItem {
  label: string;
  path?: string;
  icon: LucideIcon;
  dropdown?: DropdownItem[];
  highlight?: boolean;
  module?: ModuleId; // Which module this belongs to
}

export interface DropdownItem {
  label: string;
  path: string;
  icon: LucideIcon;
  module?: ModuleId;
}

export interface ProfileItem {
  label?: string;
  path?: string;
  icon?: LucideIcon;
  action?: 'signout';
  type?: 'separator';
}

// ==========================================
// 5-MODULE NAVIGATION STRUCTURE
// ==========================================
// Module 1: Quick Score (FREE)
// Module 2: Resume & Jobs Studio
// Module 3: Career Vault  
// Module 4: LinkedIn Pro
// Module 5: Interview Mastery
// ==========================================

export const mainNavItems: NavItem[] = [
  { 
    label: 'Home', 
    path: '/home', 
    icon: Home 
  },
  // MODULE 1: Quick Score (FREE)
  { 
    label: 'Quick Score', 
    path: '/quick-score', 
    icon: Zap,
    highlight: true,
    module: 'quick_score',
  },
  // MODULE 2: Resume & Jobs Studio
  { 
    label: 'Resume Builder', 
    path: '/resume-builder', 
    icon: FileText,
    module: 'resume_jobs_studio',
  },
  { 
    label: 'Find Jobs', 
    path: '/job-search', 
    icon: Search,
    module: 'resume_jobs_studio',
  },
  { 
    label: 'My Applications', 
    path: '/active-applications', 
    icon: Briefcase,
    module: 'resume_jobs_studio',
  },
  // MODULE 3: Career Vault
  {
    label: 'Career Vault',
    path: '/career-vault',
    icon: Package,
    module: 'career_vault',
  },
  // MODULE 4: LinkedIn Pro
  {
    label: 'LinkedIn',
    icon: Linkedin,
    module: 'linkedin_pro',
    dropdown: [
      { label: 'Profile Builder', path: '/agents/linkedin-profile-builder', icon: Linkedin, module: 'linkedin_pro' },
      { label: 'Networking', path: '/agents/networking', icon: Users, module: 'linkedin_pro' },
      { label: 'Content Creator', path: '/agents/linkedin-blogging', icon: MessageSquare, module: 'linkedin_pro' },
    ],
  },
  // MODULE 5: Interview Mastery
  {
    label: 'Interview',
    icon: Mic,
    module: 'interview_mastery',
    dropdown: [
      { label: 'Interview Prep', path: '/agents/interview-prep', icon: Mic, module: 'interview_mastery' },
      { label: 'Salary Negotiation', path: '/salary-negotiation', icon: DollarSign, module: 'interview_mastery' },
    ],
  },
  // Settings & More
  {
    label: 'Settings',
    icon: Settings,
    dropdown: [
      { label: 'My Resumes', path: '/my-resumes', icon: FileText, module: 'resume_jobs_studio' },
      { label: 'Resume Templates', path: '/templates', icon: FileText, module: 'resume_jobs_studio' },
      { label: 'AI Coach', path: '/coaching', icon: Brain, module: 'career_vault' },
      { label: 'Agencies', path: '/agencies', icon: Building2 },
      { label: 'Learning Center', path: '/learning-center', icon: BookOpen },
      { label: 'Profile Settings', path: '/profile', icon: User },
      { label: 'API Keys', path: '/api-keys', icon: Key },
      { label: 'Testing Dashboard', path: '/testing-dashboard', icon: FlaskConical },
    ],
  },
];

// Module-grouped navigation for UI rendering
export const moduleNavGroups = {
  quick_score: [
    { label: 'Quick Score', path: '/quick-score', icon: Zap }
  ],
  resume_jobs_studio: [
    { label: 'Resume Builder', path: '/resume-builder', icon: FileText },
    { label: 'My Resumes', path: '/my-resumes', icon: FileText },
    { label: 'Templates', path: '/templates', icon: FileText },
    { label: 'Find Jobs', path: '/job-search', icon: Search },
    { label: 'My Applications', path: '/active-applications', icon: Briefcase },
  ],
  career_vault: [
    { label: 'Career Vault', path: '/career-vault', icon: Package },
    { label: 'AI Coach', path: '/coaching', icon: Brain },
  ],
  linkedin_pro: [
    { label: 'Profile Builder', path: '/agents/linkedin-profile-builder', icon: Linkedin },
    { label: 'Networking', path: '/agents/networking', icon: Users },
    { label: 'Content Creator', path: '/agents/linkedin-blogging', icon: MessageSquare },
  ],
  interview_mastery: [
    { label: 'Interview Prep', path: '/agents/interview-prep', icon: Mic },
    { label: 'Salary Negotiation', path: '/salary-negotiation', icon: DollarSign },
  ],
};

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
