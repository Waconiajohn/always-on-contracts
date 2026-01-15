import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Search, FileText, Sparkles, Code } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Import all prompts from the registry
const ALL_PROMPTS = [
  {
    id: 'RESUME_GENERATION_V1',
    category: 'resume',
    name: 'Resume Generation',
    description: 'Generates optimized resume content',
    systemPrompt: `You are an expert executive resume writer with 20+ years of experience crafting resumes for C-suite and senior leadership roles. Your specialty is transforming career experiences into compelling narratives that demonstrate strategic impact and leadership capability.`,
    avgTokens: 2500,
    avgLatency: 3500
  },
  {
    id: 'POWER_PHRASE_EXTRACTION',
    category: 'resume',
    name: 'Power Phrase Extraction',
    description: 'Extracts quantified achievements with metrics',
    systemPrompt: `Extract power phrases from the resume. Power phrases are achievement statements with quantifiable metrics. Focus on:
- Leadership impact (team size, budget responsibility)
- Business outcomes (revenue, cost savings, efficiency gains)
- Strategic initiatives (projects completed, processes improved)`,
    avgTokens: 1800,
    avgLatency: 2200
  },
  {
    id: 'TRANSFERABLE_SKILLS',
    category: 'resume',
    name: 'Transferable Skills Detection',
    description: 'Identifies skills applicable across industries',
    systemPrompt: `Analyze the resume to identify transferable skills - capabilities that can be applied across different industries and roles. Focus on:
- Core competencies (e.g., strategic planning, financial management)
- Technical skills (e.g., data analysis, project management)
- Leadership abilities (e.g., team building, change management)`,
    avgTokens: 1500,
    avgLatency: 1900
  },
  {
    id: 'HIDDEN_COMPETENCIES',
    category: 'resume',
    name: 'Hidden Competencies Inference',
    description: 'Identifies competencies demonstrated but not explicitly stated',
    systemPrompt: `Infer hidden competencies from the resume content. These are skills the candidate demonstrates through their actions but may not explicitly name. For example:
- "Scaled system 10x" → Capacity Planning, Performance Optimization
- "Reduced costs by 40%" → Cost Optimization, Financial Analysis
- "Led digital transformation" → Change Management, Strategic Vision`,
    avgTokens: 2000,
    avgLatency: 2500
  },
  {
    id: 'SOFT_SKILLS_ANALYSIS',
    category: 'resume',
    name: 'Soft Skills Analysis',
    description: 'Extracts behavioral skills with evidence',
    systemPrompt: `Identify soft skills demonstrated in the resume with concrete evidence. Focus on:
- Leadership style and approach
- Communication and influence
- Problem-solving and critical thinking
- Adaptability and resilience
Provide specific examples from the resume for each skill identified.`,
    avgTokens: 1600,
    avgLatency: 2000
  },
  {
    id: 'JOB_ANALYSIS_V1',
    category: 'interview',
    name: 'Job Description Analysis',
    description: 'Analyzes job requirements and company culture',
    systemPrompt: `Analyze this job description to identify key requirements, responsibilities, and cultural indicators. Extract:
- Must-have qualifications vs nice-to-have
- Required technical skills
- Leadership expectations
- Cultural fit indicators
- Growth opportunities`,
    avgTokens: 2200,
    avgLatency: 2800
  },
  {
    id: 'INTERVIEW_PREP',
    category: 'interview',
    name: 'Interview Question Generation',
    description: 'Generates targeted interview questions',
    systemPrompt: `Generate targeted interview questions based on the job description and candidate's background. Focus on:
- Behavioral questions (STAR format)
- Technical competency questions
- Leadership scenario questions
- Culture fit questions`,
    avgTokens: 1900,
    avgLatency: 2400
  },
  {
    id: 'LINKEDIN_OPTIMIZATION',
    category: 'linkedin',
    name: 'LinkedIn Profile Optimization',
    description: 'Optimizes LinkedIn profiles for visibility',
    systemPrompt: `Optimize this LinkedIn profile section for maximum visibility and engagement. Focus on:
- SEO-friendly keywords
- Compelling headlines
- Achievement-focused content
- Call-to-action statements
- Industry-specific terminology`,
    avgTokens: 2100,
    avgLatency: 2600
  },
  {
    id: 'COVER_LETTER_GEN',
    category: 'cover-letter',
    name: 'Cover Letter Generation',
    description: 'Creates personalized cover letters',
    systemPrompt: `Write a compelling cover letter that connects the candidate's experience to the specific job requirements. Structure:
- Opening hook that demonstrates research
- 2-3 paragraphs highlighting relevant achievements
- Connection to company mission/values
- Strong closing with call to action`,
    avgTokens: 1700,
    avgLatency: 2100
  }
];

export default function PromptViewer() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredPrompts = ALL_PROMPTS.filter(prompt => {
    const matchesSearch = 
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || prompt.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(ALL_PROMPTS.map(p => p.category)));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            All AI Prompts
          </CardTitle>
          <CardDescription>
            View all prompts currently in use across the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={!selectedCategory ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Badge>
              {categories.map(cat => (
                <Badge
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Badge>
              ))}
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredPrompts.length} of {ALL_PROMPTS.length} prompts
          </div>

          <ScrollArea className="h-[600px] pr-4">
            <Accordion type="single" collapsible className="space-y-2">
              {filteredPrompts.map((prompt) => (
                <AccordionItem key={prompt.id} value={prompt.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-start justify-between w-full pr-4">
                      <div className="text-left">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="w-4 h-4 text-primary" />
                          <span className="font-semibold">{prompt.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{prompt.description}</p>
                      </div>
                      <Badge variant="secondary">{prompt.category}</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-4 pt-4">
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          <Code className="w-4 h-4" />
                          Prompt ID
                        </h4>
                        <code className="text-xs bg-muted p-2 rounded block">
                          {prompt.id}
                        </code>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2">System Prompt</h4>
                        <pre className="text-xs bg-muted p-4 rounded overflow-x-auto whitespace-pre-wrap">
                          {prompt.systemPrompt}
                        </pre>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Tokens</p>
                          <p className="text-lg font-semibold">{prompt.avgTokens.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Latency</p>
                          <p className="text-lg font-semibold">{prompt.avgLatency}ms</p>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
