import { HelpCircle } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface CategoryExplainerProps {
  category: 'career_achievements' | 'skills_expertise' | 'strategic_capabilities' | 'professional_strengths';
}

const CATEGORY_INFO = {
  career_achievements: {
    title: 'Career Achievements',
    description: 'Accomplishments with numbers that demonstrate your impact.',
    examples: [
      {
        before: 'Responsible for team management',
        after: 'Led cross-functional team of 12 engineers, delivering $2M project 3 weeks ahead of schedule'
      },
      {
        before: 'Improved efficiency',
        after: 'Reduced operational costs by 40% ($500K annually) through process automation'
      },
      {
        before: 'Managed budget',
        after: 'Oversaw $5M annual budget with zero variance, optimizing resource allocation across 8 departments'
      }
    ],
    whyItMatters: 'Hiring managers scan for measurable impact. Numbers make your value immediately clear.',
    color: 'text-blue-500'
  },
  skills_expertise: {
    title: 'Skills & Expertise',
    description: 'Technical and professional abilities that apply across roles.',
    examples: [
      {
        skill: 'Strategic Planning',
        evidence: 'Developed 3-year digital transformation roadmap adopted across organization'
      },
      {
        skill: 'Data Analysis',
        evidence: 'Created executive dashboards using SQL/Tableau, enabling data-driven decision making'
      },
      {
        skill: 'Stakeholder Management',
        evidence: 'Coordinated with C-suite executives and external partners across 5 countries'
      }
    ],
    whyItMatters: 'Shows you can succeed in different environments and roles.',
    color: 'text-green-500'
  },
  strategic_capabilities: {
    title: 'Strategic Capabilities',
    description: 'High-level abilities you demonstrate through your work.',
    examples: [
      {
        action: 'Scaled system to handle 10x traffic',
        competency: '→ Capacity Planning, Performance Optimization, Infrastructure Design'
      },
      {
        action: 'Led digital transformation initiative',
        competency: '→ Change Management, Strategic Vision, Technology Leadership'
      },
      {
        action: 'Mentored 5 junior developers to senior roles',
        competency: '→ Talent Development, Leadership Pipeline Building, Knowledge Transfer'
      }
    ],
    whyItMatters: 'Your most valuable abilities are often implied, not stated directly.',
    color: 'text-purple-500'
  },
  professional_strengths: {
    title: 'Professional Strengths',
    description: 'Behavioral abilities proven through your experience.',
    examples: [
      {
        skill: 'Leadership',
        evidence: 'Built and scaled engineering team from 3 to 25 people over 2 years',
        impact: 'Team delivery velocity increased 300%'
      },
      {
        skill: 'Problem Solving',
        evidence: 'Diagnosed critical production issue affecting 100K users',
        impact: 'Implemented fix within 4 hours, preventing $2M in lost revenue'
      },
      {
        skill: 'Adaptability',
        evidence: 'Successfully pivoted product strategy when market conditions changed',
        impact: 'Maintained 95% customer retention during transition'
      }
    ],
    whyItMatters: 'These abilities differentiate top performers when backed by evidence.',
    color: 'text-orange-500'
  }
};

export default function CategoryExplainer({ category }: CategoryExplainerProps) {
  const info = CATEGORY_INFO[category];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] max-h-[600px] overflow-y-auto" align="start">
        <div className="space-y-4">
          <div>
            <h4 className={`font-bold text-lg mb-2 ${info.color}`}>{info.title}</h4>
            <p className="text-sm text-muted-foreground">{info.description}</p>
          </div>

          <div>
            <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Badge variant="secondary">Examples</Badge>
            </h5>
            <div className="space-y-3">
              {category === 'career_achievements' && (
                <>
                  {(info.examples as Array<{ before: string; after: string }>).map((example, idx) => (
                    <div key={idx} className="text-xs space-y-1 p-3 bg-muted rounded-lg">
                      <div className="text-destructive line-through">{example.before}</div>
                      <div className="text-primary font-medium">✓ {example.after}</div>
                    </div>
                  ))}
                </>
              )}

              {category === 'skills_expertise' && (
                <>
                  {(info.examples as Array<{ skill: string; evidence: string }>).map((example, idx) => (
                    <div key={idx} className="text-xs space-y-1 p-3 bg-muted rounded-lg">
                      <div className="font-semibold text-primary">{example.skill}</div>
                      <div className="text-muted-foreground">{example.evidence}</div>
                    </div>
                  ))}
                </>
              )}

              {category === 'strategic_capabilities' && (
                <>
                  {(info.examples as Array<{ action: string; competency: string }>).map((example, idx) => (
                    <div key={idx} className="text-xs space-y-1 p-3 bg-muted rounded-lg">
                      <div className="text-foreground">{example.action}</div>
                      <div className="text-primary font-medium">{example.competency}</div>
                    </div>
                  ))}
                </>
              )}

              {category === 'professional_strengths' && (
                <>
                  {(info.examples as Array<{ skill: string; evidence: string; impact: string }>).map((example, idx) => (
                    <div key={idx} className="text-xs space-y-1 p-3 bg-muted rounded-lg">
                      <div className="font-semibold text-primary">{example.skill}</div>
                      <div className="text-muted-foreground">{example.evidence}</div>
                      <div className="text-foreground">→ {example.impact}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <div className="pt-3 border-t">
            <h5 className="font-semibold text-sm mb-2">Why It Matters</h5>
            <p className="text-xs text-muted-foreground">{info.whyItMatters}</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
