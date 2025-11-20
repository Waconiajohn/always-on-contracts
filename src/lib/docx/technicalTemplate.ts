import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  TabStopType,
  Table,
  TableRow,
  TableCell,
  WidthType,
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
    content?: string;
    bullets?: string[];
  }[];
}

export class TechnicalDocxGenerator {
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
              font: "Calibri", // Clean, modern font for technical resumes
              size: 22, // 11pt
            },
            paragraph: {
              spacing: {
                line: 240, // Single spacing
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
              size: 36, // 18pt
              bold: true,
              color: "000000",
            },
            paragraph: {
              spacing: {
                after: 120,
              },
            },
          },
          {
            id: "Heading2",
            name: "Heading 2",
            run: {
              font: "Calibri",
              size: 24, // 12pt
              bold: true,
              color: "2E74B5", // Subtle blue for headers
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
                  color: "2E74B5",
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
                top: convertInchesToTwip(0.5),
                bottom: convertInchesToTwip(0.5),
                left: convertInchesToTwip(0.5),
                right: convertInchesToTwip(0.5),
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

    // Header
    children.push(
      new Paragraph({
        text: this.data.header.fullName,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.LEFT, // Technical often prefers left align
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
        alignment: AlignmentType.LEFT,
        spacing: { after: 240 },
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

      if (section.type === "skills" || section.type === "technical_skills" || section.type === "skills_list" || section.type === "core_competencies") {
        // Render as compact list or grouped if possible
        children.push(...this.createTechnicalSkills(section.bullets || []));
      } else if (section.type === "experience" || section.type === "professional_experience" || section.type === "projects") {
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

  private createTechnicalSkills(skills: string[]): any[] {
    // Convert to 3-column grid for technical skills
    let cleanSkills = skills
        .map(s => formatResumeContent(s).replace(/^[-•]\s*/, "").trim())
        .filter(Boolean);
    
    // Split comma-separated if needed
    if (cleanSkills.length < 5 && cleanSkills.some(s => s.includes(','))) {
      cleanSkills = cleanSkills
        .flatMap(s => s.split(',').map(item => item.trim()))
        .filter(Boolean);
    }
    
    // Limit to top 18 skills (3 columns x 6 rows)
    cleanSkills = cleanSkills.slice(0, 18);
    
    // Create 3-column grid
    const elements: any[] = [];
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
              width: { size: 33, type: WidthType.PERCENTAGE },
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
    
    elements.push(
      new Table({
        rows: rows,
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
          right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        },
      })
    );
    
    return elements;
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
     // Technical format:
     // Job Title at Company (Dates)
     // Or: Job Title, Company -- Dates
     
     elements.push(
         new Paragraph({
             children: [
                 new TextRun({
                     text: job.title,
                     bold: true,
                     size: 24, // 12pt
                 }),
                 new TextRun({
                     text: " at ",
                 }),
                 new TextRun({
                     text: job.company,
                     bold: true,
                 }),
                 new TextRun({
                     text: job.dates ? `\t${job.dates}` : "",
                 })
             ],
             tabStops: [
                 {
                     type: TabStopType.RIGHT,
                     position: convertInchesToTwip(7.5),
                 }
             ],
             spacing: { before: 120, after: 60 }
         })
     );
     
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
