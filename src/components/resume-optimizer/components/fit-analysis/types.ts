import { EvidenceUnit, AtomicRequirement, FitMapEntry, BulletBankItem } from '../../types';

export type FitCategory = 'HIGHLY QUALIFIED' | 'PARTIALLY QUALIFIED' | 'EXPERIENCE GAP';

export interface CategoryConfig {
  title: string;
  description: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export const CATEGORY_CONFIG: Record<FitCategory, CategoryConfig> = {
  'HIGHLY QUALIFIED': {
    title: 'Highly Qualified',
    description: 'Strong evidence supporting your fit',
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200'
  },
  'PARTIALLY QUALIFIED': {
    title: 'Partially Qualified',
    description: 'Areas needing strategic positioning',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200'
  },
  'EXPERIENCE GAP': {
    title: 'Experience Gaps',
    description: 'Missing qualifications requiring creative addressing',
    colorClass: 'text-red-700',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200'
  }
};

export const RISK_COLORS: Record<string, string> = {
  'Low': 'bg-emerald-100 text-emerald-700',
  'Medium': 'bg-amber-100 text-amber-700',
  'High': 'bg-red-100 text-red-700'
};

export const STRENGTH_COLORS: Record<string, string> = {
  'strong': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'moderate': 'bg-blue-100 text-blue-700 border-blue-200',
  'weak': 'bg-amber-100 text-amber-700 border-amber-200',
  'inference': 'bg-gray-100 text-gray-600 border-gray-200'
};

export interface EvidenceTagProps {
  evidenceId: string;
  getEvidenceById: (id: string) => EvidenceUnit | undefined;
}

export interface RequirementCardProps {
  entry: FitMapEntry;
  getRequirementById: (id: string) => AtomicRequirement | undefined;
  getEvidenceById: (id: string) => EvidenceUnit | undefined;
}

export interface FitCategorySectionProps {
  category: FitCategory;
  entries: FitMapEntry[];
  isExpanded: boolean;
  onToggle: () => void;
  getRequirementById: (id: string) => AtomicRequirement | undefined;
  getEvidenceById: (id: string) => EvidenceUnit | undefined;
}

export interface FitSummaryCardProps {
  overallFitScore: number;
  requirementsCount: number;
  evidenceCount: number;
  highlyQualifiedCount: number;
  partiallyQualifiedCount: number;
  experienceGapsCount: number;
}

export interface EvidenceInventoryPanelProps {
  evidenceInventory: EvidenceUnit[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export interface BulletBankPanelProps {
  bulletBank: BulletBankItem[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  getEvidenceById: (id: string) => EvidenceUnit | undefined;
}

