import { supabase } from '@/integrations/supabase/client';

export class TestDataGenerator {
  private testRunId: string;
  private createdData: Map<string, string[]> = new Map();

  constructor(testRunId: string) {
    this.testRunId = testRunId;
  }

  async createTestUser(suffix?: string): Promise<{ email: string; password: string; userId?: string }> {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const email = `test-${timestamp}-${random}${suffix || ''}@testuser.com`;
    const password = 'TestPass123!@#';

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: `Test User ${random}`,
        },
      },
    });

    if (error) throw error;
    if (!data.user) throw new Error('User creation failed');

    await this.trackCreatedData('auth.users', data.user.id);

    return { email, password, userId: data.user.id };
  }

  async createMockResume(userId: string): Promise<string> {
    const mockResumeText = `
JOHN DOE
Software Engineer
john.doe@email.com | (555) 123-4567 | LinkedIn: linkedin.com/in/johndoe

PROFESSIONAL SUMMARY
Experienced software engineer with 5+ years of expertise in full-stack development, 
specializing in React, Node.js, and cloud technologies. Proven track record of 
delivering scalable solutions and leading cross-functional teams.

TECHNICAL SKILLS
• Languages: JavaScript, TypeScript, Python, Java
• Frontend: React, Vue.js, HTML5, CSS3, Tailwind
• Backend: Node.js, Express, Django, REST APIs
• Databases: PostgreSQL, MongoDB, Redis
• Cloud: AWS, Azure, Docker, Kubernetes
• Tools: Git, CI/CD, Jira, Agile methodologies

PROFESSIONAL EXPERIENCE

Senior Software Engineer | Tech Corp | 2021 - Present
• Led development of microservices architecture serving 1M+ users
• Reduced API response times by 40% through optimization
• Mentored team of 5 junior developers
• Implemented CI/CD pipeline reducing deployment time by 60%

Software Engineer | StartupXYZ | 2019 - 2021
• Built responsive web applications using React and Node.js
• Collaborated with product team to define technical requirements
• Increased test coverage from 30% to 85%
• Participated in code reviews and architectural decisions

EDUCATION
Bachelor of Science in Computer Science
State University | 2019

CERTIFICATIONS
• AWS Certified Solutions Architect
• Certified Scrum Master (CSM)
    `.trim();

    const { data, error } = await supabase
      .from('resumes')
      .insert({
        user_id: userId,
        file_name: 'mock-resume.txt',
        file_url: 'test://mock-resume.txt',
        parsed_content: {
          text: mockResumeText,
          sections: {
            summary: 'Experienced software engineer...',
            experience: ['Senior Software Engineer at Tech Corp', 'Software Engineer at StartupXYZ'],
            education: ['Bachelor of Science in Computer Science'],
            skills: ['JavaScript', 'TypeScript', 'React', 'Node.js'],
          },
        },
      })
      .select()
      .single();

    if (error) throw error;
    await this.trackCreatedData('resumes', data.id);

    return data.id;
  }

  async createMockMasterResume(userId: string): Promise<string> {
    const { data, error } = await supabase
      .from('career_vault')
      .insert({
        user_id: userId,
        vault_name: 'Test Resume',
        target_roles: ['Software Engineer', 'Full Stack Developer'],
        target_industries: ['Technology', 'Finance'],
        overall_strength_score: 75,
        total_power_phrases: 10,
        total_transferable_skills: 8,
      })
      .select()
      .single();

    if (error) throw error;
    await this.trackCreatedData('career_vault', data.id);

    return data.id;
  }

  async createMockJobPosting(): Promise<string> {
    const { data, error } = await supabase
      .from('job_opportunities')
      .insert({
        job_title: 'Senior React Developer',
        job_description: 'We are seeking an experienced React developer...',
        required_skills: ['React', 'TypeScript', 'Node.js'],
        location: 'Remote',
        status: 'active',
        is_external: true,
        external_source: 'test',
        external_id: `test-${Date.now()}`,
      })
      .select()
      .single();

    if (error) throw error;
    await this.trackCreatedData('job_opportunities', data.id);

    return data.id;
  }

  private async trackCreatedData(table: string, id: string) {
    if (!this.createdData.has(table)) {
      this.createdData.set(table, []);
    }
    this.createdData.get(table)!.push(id);

    await supabase.from('test_data_snapshots').insert({
      test_run_id: this.testRunId,
      data_type: table,
      data_id: id,
    });
  }

  async cleanup() {
    const tables = Array.from(this.createdData.keys()).reverse();

    for (const table of tables) {
      const ids = this.createdData.get(table)!;
      if (ids.length > 0 && table !== 'auth.users') {
        await supabase.from(table as any).delete().in('id', ids);
      }
    }

    this.createdData.clear();
  }
}
