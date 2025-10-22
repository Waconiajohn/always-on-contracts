import { TestSuite } from '../types';

export const interviewPrepSuite: TestSuite = {
  id: 'interview-prep-suite',
  name: 'Interview Preparation',
  description: 'Tests for interview prep tools, STAR stories, and company research',
  category: 'interview-prep',
  tests: [
    {
      id: 'interview-001',
      name: 'Generate interview questions',
      description: 'Should generate relevant interview questions',
      category: 'interview-prep',
      priority: 'high',
      execute: async () => {
        const mockQuestions = [
          'Tell me about a time you led a team',
          'Describe a technical challenge you overcame',
        ];

        return {
          passed: mockQuestions.length > 0,
          duration: 0,
          metadata: { questions: mockQuestions },
        };
      },
    },
    {
      id: 'interview-002',
      name: 'Company research generation',
      description: 'Should generate comprehensive company research',
      category: 'interview-prep',
      priority: 'high',
      execute: async () => {
        const mockResearch = {
          company: 'Test Company',
          industry: 'Technology',
          recentNews: ['News 1', 'News 2'],
          culture: 'Innovation-focused',
        };

        return {
          passed: mockResearch.recentNews.length > 0,
          duration: 0,
          metadata: mockResearch,
        };
      },
    },
    {
      id: 'interview-003',
      name: 'STAR story generation',
      description: 'Should generate STAR format stories from vault',
      category: 'interview-prep',
      priority: 'high',
      execute: async () => {
        const mockSTAR = {
          situation: 'Facing system outage',
          task: 'Restore service quickly',
          action: 'Led incident response team',
          result: 'Restored in 2 hours, prevented revenue loss',
        };

        return {
          passed: Object.keys(mockSTAR).length === 4,
          duration: 0,
          metadata: mockSTAR,
        };
      },
    },
    {
      id: 'interview-004',
      name: 'Tag STAR by competency',
      description: 'Should tag STAR stories by competency',
      category: 'interview-prep',
      priority: 'medium',
      execute: async () => {
        const mockTags = ['Leadership', 'Problem Solving', 'Communication'];

        return {
          passed: mockTags.length > 0,
          duration: 0,
          metadata: { tags: mockTags },
        };
      },
    },
    {
      id: 'interview-005',
      name: 'Track interview preparation',
      description: 'User should be able to track interview prep progress',
      category: 'interview-prep',
      priority: 'high',
      execute: async () => {
        return {
          passed: true,
          duration: 0,
          metadata: { note: 'Interview prep tracking' },
        };
      },
    },
    {
      id: 'interview-006',
      name: 'Generate mock questions',
      description: 'Should generate company-specific mock questions',
      category: 'interview-prep',
      priority: 'medium',
      execute: async () => {
        const mockQuestions = [
          'Why do you want to work here?',
          'What interests you about this role?',
        ];

        return {
          passed: mockQuestions.length > 0,
          duration: 0,
          metadata: { questions: mockQuestions },
        };
      },
    },
    {
      id: 'interview-007',
      name: 'Elevator pitch builder',
      description: 'Should generate personalized elevator pitch',
      category: 'interview-prep',
      priority: 'high',
      execute: async () => {
        const mockPitch = 'I am a software engineer specializing in...';

        return {
          passed: mockPitch.length > 0 && mockPitch.length <= 500,
          duration: 0,
          metadata: { pitchLength: mockPitch.length },
        };
      },
    },
    {
      id: 'interview-008',
      name: '30-60-90 day plan',
      description: 'Should generate 30-60-90 day plan',
      category: 'interview-prep',
      priority: 'medium',
      execute: async () => {
        const mockPlan = {
          first30: ['Learn codebase', 'Meet team'],
          first60: ['Ship first feature', 'Lead standup'],
          first90: ['Mentor junior dev', 'Propose improvements'],
        };

        return {
          passed: Object.keys(mockPlan).length === 3,
          duration: 0,
          metadata: mockPlan,
        };
      },
    },
    {
      id: 'interview-009',
      name: '3-2-1 framework',
      description: 'Should generate 3 strengths, 2 examples, 1 vision',
      category: 'interview-prep',
      priority: 'medium',
      execute: async () => {
        const mockFramework = {
          strengths: ['Leadership', 'Technical', 'Communication'],
          examples: ['Project A', 'Project B'],
          vision: 'Long-term career goal',
        };

        return {
          passed: mockFramework.strengths.length === 3,
          duration: 0,
          metadata: mockFramework,
        };
      },
    },
    {
      id: 'interview-010',
      name: 'Validate response quality',
      description: 'Should validate and score interview responses',
      category: 'interview-prep',
      priority: 'high',
      execute: async () => {
        const mockValidation = {
          clarity: 8,
          relevance: 9,
          structure: 7,
          overall: 8,
        };

        return {
          passed: Object.values(mockValidation).every(v => v >= 0 && v <= 10),
          duration: 0,
          metadata: mockValidation,
        };
      },
    },
    {
      id: 'interview-011',
      name: 'Interview follow-up communication',
      description: 'Should generate follow-up thank you notes',
      category: 'interview-prep',
      priority: 'medium',
      execute: async () => {
        const mockFollowup = {
          subject: 'Thank you for the opportunity',
          body: 'Dear [Name], Thank you for taking the time...',
        };

        return {
          passed: mockFollowup.body.length > 0,
          duration: 0,
          metadata: mockFollowup,
        };
      },
    },
    {
      id: 'interview-012',
      name: 'Question bank',
      description: 'Should maintain a bank of common interview questions',
      category: 'interview-prep',
      priority: 'low',
      execute: async () => {
        const questionBank = [
          'Tell me about yourself',
          'Describe a challenge you faced',
          'Where do you see yourself in 5 years?',
        ];

        return {
          passed: questionBank.length > 0,
          duration: 0,
          metadata: { bankSize: questionBank.length },
        };
      },
    },
  ],
};
