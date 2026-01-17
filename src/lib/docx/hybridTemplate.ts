import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  convertInchesToTwip,
} from "docx";
import { formatResumeContent } from "../resumeFormatting";

interface ExperienceEntry {
  title: string;
  company: string;
  dates?: string;
  bullets: string[];
}

interface ResumeData {
  header: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    headline?: string;
  };
  sections: {
    title: string;
    type: string;
    content?: string;
    bullets?: string[];
    entries?: ExperienceEntry[];
  }[];
}

export class HybridDocxGenerator {
  private data: ResumeData;

  constructor(data: ResumeData) {
    this.data = data;
  }

  public generate(): Document {
    return new Document({
      styles: {
        default: {
          document: {
            run: {
              font: "Calibri",
              size: 22, // 11pt
            },
            paragraph: {
              spacing: {
                line: 276, // 1.15 line spacing
                after: 120, // 6pt after
              },
            },
          },
        },
        paragraphStyles: [
          {
            id: "Normal",
            name: "Normal",
            run: {
              font: "Calibri",
              size: 22,
            },
          },
          {
            id: "Heading1",
            name: "Heading 1",
            run: {
              font: "Calibri",
              size: 44, // 22pt
              bold: true,
              color: "2C3E50",
            },
            paragraph: {
              spacing: {
                after: 120,
              },
              alignment: AlignmentType.LEFT,
            },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            run: {
              font: "Calibri",
              size: 28, // 14pt
              bold: true,
              color: "E74C3C", // Distinctive accent color (e.g. reddish)
            },
            paragraph: {
              spacing: {
                before: 240,
                after: 120,
              },
              border: {
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 4,
                  color: "E74C3C",
                  space: 1,
                },
              },
            },
          },
        ],
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(0.75),
                bottom: convertInchesToTwip(0.75),
                left: convertInchesToTwip(0.75),
                right: convertInchesToTwip(0.75),
              },
            },
          },
          children: this.buildContent(),
        },
      ],
    });
  }

  private buildContent(): any[] {
    const children: any[] = [];

    // Header - Name Left, Contact Right (using table or tabs)
    // For simplicity using paragraphs
    children.push(
      new Paragraph({
        text: this.data.header.fullName,
        heading: HeadingLevel.HEADING_1,
      })
    );

    const contactParts = [
      this.data.header.email,
      this.data.header.phone,
      this.data.header.location,
      this.data.header.linkedin,
    ].filter(Boolean);

    children.push(
      new Paragraph({
        text: contactParts.join(" | "),
        spacing: { after: 360 },
      })
    );

    // Sections
    this.data.sections.forEach((section) => {
      // Clean section title
      const cleanTitle = this.cleanSectionTitle(section.title);
      
      children.push(
        new Paragraph({
          text: cleanTitle.toUpperCase(),
          heading: HeadingLevel.HEADING_2,
        })
      );

      if (section.type === "skills" || section.type === "key_skills" || section.type === "skills_list" || section.type === "technical_skills" || section.type === "core_competencies") {
        // Use a 2-column table for skills list
        children.push(this.createSkillsGrid(section.bullets || []));
      } else if (section.type === "experience" || section.type === "professional_experience") {
        // Use structured entries if available, otherwise fall back to bullets parsing
        if (section.entries && section.entries.length > 0) {
          children.push(...this.createExperienceFromEntries(section.entries));
        } else {
          children.push(...this.createExperienceContent(section.bullets || []));
        }
      } else {
        // Standard rendering
        if (section.content) {
          children.push(
            new Paragraph({
              text: formatResumeContent(section.content),
            })
          );
        }
        if (section.bullets) {
          // Filter out bullets that match the section title or type
          const sectionTitle = cleanTitle.toLowerCase().trim();
          const sectionType = section.type.toLowerCase().replace(/_/g, ' ').trim();
          
          const filteredBullets = section.bullets.filter(bullet => {
            const cleanBullet = formatResumeContent(bullet).toLowerCase().trim();
            return cleanBullet !== sectionTitle && cleanBullet !== sectionType && 
                   cleanBullet !== 'education' && cleanBullet !== 'experience';
          });
          
          filteredBullets.forEach((bullet) => {
            children.push(
              new Paragraph({
                text: formatResumeContent(bullet),
                bullet: {
                  level: 0,
                },
              })
            );
          });
        }
      }
      
      children.push(new Paragraph({ text: "" }));
    });

    return children;
  }

  private cleanSectionTitle(title: string): string {
    if (!title) return 'SECTION';
    
    let clean = title.trim().replace(/\s+/g, ' ');
    clean = clean.split(/[.,;]|and/i)[0].trim();
    
    if (clean.length > 30) {
      const words = clean.split(' ');
      clean = words.slice(0, 2).join(' ');
    }
    
    return clean;
  }

  private createSkillsGrid(skills: string[]): Table {
    // Filter empty skills, clean them, and split comma-separated skills
    let cleanSkills = skills
        .map(s => formatResumeContent(s).replace(/^[-•]\s*/, "").trim())
        .filter(Boolean);
    
    // If we have very few items with commas, split them
    if (cleanSkills.length < 5 && cleanSkills.some(s => s.includes(','))) {
      cleanSkills = cleanSkills
        .flatMap(s => s.split(',').map(item => item.trim()))
        .filter(Boolean);
    }
    
    // Limit to top 16 skills (2 columns x 8 rows)
    cleanSkills = cleanSkills.slice(0, 16);
        
    // Create a 2-column grid
    const rows = [];
    for (let i = 0; i < cleanSkills.length; i += 2) {
      const rowCells = [];
      for (let j = 0; j < 2; j++) {
        if (i + j < cleanSkills.length) {
            rowCells.push(
                new TableCell({
                    children: [
                        new Paragraph({
                            text: `• ${cleanSkills[i + j]}`,
                            spacing: { after: 60 }
                        })
                    ],
                    width: {
                        size: 50,
                        type: WidthType.PERCENTAGE
                    },
                    borders: {
                        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    }
                })
            );
        } else {
             rowCells.push(
                new TableCell({
                    children: [],
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    borders: {
                        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
                    }
                })
            );
        }
      }
      rows.push(new TableRow({ children: rowCells }));
    }

    return new Table({
      rows: rows,
      width: {
        size: 100,
        type: WidthType.PERCENTAGE,
      },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
      },
    });
  }

  private createExperienceContent(bullets: string[]): any[] {
    const elements: any[] = [];
    let currentJob: { title?: string; company?: string; dates?: string; bullets: string[] } | null = null;

    bullets.forEach((bullet) => {
      const cleanBullet = formatResumeContent(bullet);
      const jobMatch = cleanBullet.match(/^(.+?)\s*[|]\s*(.+?)(?:\s*[|]\s*(.+?))?$/);

      if (jobMatch && !cleanBullet.startsWith("-") && !cleanBullet.startsWith("•")) {
        if (currentJob) {
            this.renderJob(currentJob, elements);
        }
        currentJob = {
            title: jobMatch[1].trim(),
            company: jobMatch[2].trim(),
            dates: jobMatch[3] ? jobMatch[3].trim() : undefined,
            bullets: []
        };
      } else {
        const bulletText = cleanBullet.replace(/^[-•#]\s*/, "").trim();
        if (bulletText) {
            if (currentJob) {
                currentJob.bullets.push(bulletText);
            } else {
                 elements.push(
                    new Paragraph({
                        text: bulletText,
                        bullet: { level: 0 },
                    })
                 );
            }
        }
      }
    });

    if (currentJob) {
        this.renderJob(currentJob, elements);
    }

    return elements;
  }

  private renderJob(job: { title?: string; company?: string; dates?: string; bullets: string[] }, elements: any[]) {
     // Hybrid format:
     // Job Title, Company (Bold)
     // Dates (Italic)
     
     elements.push(
         new Paragraph({
             children: [
                 new TextRun({
                     text: `${job.title}, ${job.company}`,
                     bold: true,
                     size: 24, // 12pt
                 })
             ],
             spacing: { before: 120 }
         })
     );
     
     if (job.dates) {
          elements.push(
             new Paragraph({
                 children: [
                     new TextRun({
                         text: job.dates,
                         italics: true,
                     })
                 ],
                 spacing: { after: 60 }
             })
         );
     }
     
     job.bullets.forEach(b => {
         elements.push(
             new Paragraph({
                 text: b,
                 bullet: { level: 0 },
                 spacing: { after: 60 }
             })
         );
      });
  }

  private createExperienceFromEntries(entries: ExperienceEntry[]): any[] {
    const elements: any[] = [];
    
    entries.forEach((entry) => {
      this.renderJob({
        title: entry.title,
        company: entry.company,
        dates: entry.dates,
        bullets: entry.bullets || []
      }, elements);
    });
    
    return elements;
  }
}
