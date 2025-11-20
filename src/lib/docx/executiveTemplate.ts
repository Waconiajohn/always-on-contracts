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
  TabStopType,
  convertInchesToTwip,
} from "docx";
import { formatResumeContent } from "../resumeFormatting";

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
    content?: string; // For paragraph text
    bullets?: string[];
  }[];
}

export class ExecutiveDocxGenerator {
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
              font: "Georgia",
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
              font: "Georgia",
              size: 22,
            },
            paragraph: {
              spacing: {
                line: 276,
                after: 120,
              },
            },
          },
          {
            id: "Heading1",
            name: "Heading 1",
            run: {
              font: "Arial",
              size: 48, // 24pt
              bold: true,
              color: "2C3E50",
            },
            paragraph: {
              spacing: {
                after: 120,
              },
              alignment: AlignmentType.CENTER,
            },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            run: {
              font: "Arial",
              size: 24, // 12pt
              bold: true,
              smallCaps: true,
              color: "2C3E50",
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
                  color: "2C3E50",
                  space: 1,
                },
              },
            },
          },
          {
            id: "JobTitle",
            name: "Job Title",
            run: {
              font: "Arial",
              size: 22,
              bold: true,
            },
          },
          {
            id: "CompanyInfo",
            name: "Company Info",
            run: {
              font: "Georgia",
              size: 22,
              italics: true,
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

    console.log('[ExecutiveTemplate] buildContent called with:', {
      fullName: this.data.header.fullName,
      sectionsCount: this.data.sections.length,
      sections: this.data.sections.map(s => ({
        title: s.title,
        type: s.type,
        hasContent: !!s.content,
        hasBullets: !!s.bullets,
        bulletsCount: s.bullets?.length || 0,
        bulletsSample: s.bullets?.[0]?.substring(0, 50)
      }))
    });

    // Header
    children.push(
      new Paragraph({
        text: this.data.header.fullName.toUpperCase(),
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
        alignment: AlignmentType.CENTER,
        spacing: { after: 360 }, // Extra space after header
      })
    );

    // Sections
    this.data.sections.forEach((section) => {
      // Clean section title - take only the first line/word that's capitalized
      const cleanTitle = this.cleanSectionTitle(section.title);
      
      children.push(
        new Paragraph({
          text: cleanTitle.toUpperCase(),
          heading: HeadingLevel.HEADING_2,
        })
      );

      if (section.type === "skills" || section.type === "skills_list" || section.type === "core_competencies" || section.type === "technical_skills") {
        children.push(this.createSkillsGrid(section.bullets || []));
      } else if (section.type === "experience" || section.type === "professional_experience") {
        children.push(...this.createExperienceContent(section.bullets || []));
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
      
      // Add spacing after section
      children.push(new Paragraph({ text: "" }));
    });

    return children;
  }

  private cleanSectionTitle(title: string): string {
    if (!title) return 'SECTION';
    
    // Remove extra whitespace and newlines
    let clean = title.trim().replace(/\s+/g, ' ');
    
    // Take only the first sentence/clause before punctuation or "and"
    clean = clean.split(/[.,;]|and/i)[0].trim();
    
    // If it's more than 30 chars, it's probably corrupted - take first 1-2 words
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
    
    // Limit to top 18 skills (3 columns x 6 rows)
    cleanSkills = cleanSkills.slice(0, 18);
        
    // Create a 3-column grid
    const rows = [];
    for (let i = 0; i < cleanSkills.length; i += 3) {
      const rowCells = [];
      for (let j = 0; j < 3; j++) {
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
                        size: 33,
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
             // Empty cell filler
             rowCells.push(
                new TableCell({
                    children: [],
                    width: { size: 33, type: WidthType.PERCENTAGE },
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
      
      // Heuristic to detect Job Header: "Job Title | Company | Dates" or similar variations
      // Executive format often has: Job Title (Bold) tab Company (Italic) tab Dates (Right align)
      // But data often comes as flattened bullets. We look for the delimiter pattern.
      
      // Regex looks for "Title | Company" pattern common in the app's data structure
      const jobMatch = cleanBullet.match(/^(.+?)\s*[|]\s*(.+?)(?:\s*[|]\s*(.+?))?$/);

      if (jobMatch && !cleanBullet.startsWith("-") && !cleanBullet.startsWith("•")) {
        // Flush previous job
        if (currentJob) {
            this.renderJob(currentJob, elements);
        }
        
        // Start new job
        currentJob = {
            title: jobMatch[1].trim(),
            company: jobMatch[2].trim(),
            dates: jobMatch[3] ? jobMatch[3].trim() : undefined,
            bullets: []
        };
      } else {
        // It's a bullet point
        const bulletText = cleanBullet.replace(/^[-•#]\s*/, "").trim();
        if (bulletText) {
            if (currentJob) {
                currentJob.bullets.push(bulletText);
            } else {
                // Orphan bullet, render immediately
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

    // Flush last job
    if (currentJob) {
        this.renderJob(currentJob, elements);
    }

    return elements;
  }

  private renderJob(job: { title?: string; company?: string; dates?: string; bullets: string[] }, elements: any[]) {
     // Row 1: Job Title (Left) -- Dates (Right)
     // Row 2: Company (Left)
     
     if (job.title) {
         elements.push(
             new Paragraph({
                 children: [
                     new TextRun({
                         text: job.title,
                         bold: true,
                         size: 24, // 12pt
                         font: "Arial"
                     }),
                     new TextRun({
                         text: job.dates ? `\t${job.dates}` : "",
                         bold: true,
                         size: 22, // 11pt
                         font: "Arial"
                     })
                 ],
                 tabStops: [
                     {
                         type: TabStopType.RIGHT,
                         position: convertInchesToTwip(7), // Right margin approx
                     }
                 ],
                 spacing: { before: 120, after: 60 }
             })
         );
     }
     
     if (job.company) {
         elements.push(
             new Paragraph({
                 children: [
                     new TextRun({
                         text: job.company,
                         italics: true,
                         font: "Georgia"
                     })
                 ],
                 spacing: { after: 120 }
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
}
