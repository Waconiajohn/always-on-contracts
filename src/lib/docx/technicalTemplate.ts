import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
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
      children.push(
        new Paragraph({
          text: section.title.toUpperCase(),
          heading: HeadingLevel.HEADING_2,
        })
      );

      if (section.type === "technical_skills" || section.type === "skills_list") {
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
          section.bullets.forEach((bullet) => {
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

  private createTechnicalSkills(skills: string[]): any[] {
    // Technical skills are often "Category: Skill, Skill, Skill"
    // We'll try to detect that pattern or just list them compactly
    const elements: any[] = [];
    
    skills.forEach(skillLine => {
        const cleanLine = formatResumeContent(skillLine).replace(/^[-•]\s*/, "").trim();
        const parts = cleanLine.split(':');
        
        if (parts.length > 1) {
            // Category: Skills format
            elements.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: parts[0] + ":",
                            bold: true,
                        }),
                        new TextRun({
                            text: parts.slice(1).join(':'),
                        })
                    ],
                    spacing: { after: 60 }
                })
            );
        } else {
            // Just a list item
            elements.push(
                new Paragraph({
                    text: `• ${cleanLine}`,
                    spacing: { after: 60 }
                })
            );
        }
    });
    
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
