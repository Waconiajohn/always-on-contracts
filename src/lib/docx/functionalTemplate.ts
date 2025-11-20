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

export class FunctionalDocxGenerator {
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
              font: "Verdana", // Clean, readable sans-serif
              size: 20, // 10pt
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
              font: "Verdana",
              size: 20,
            },
          },
          {
            id: "Heading1",
            name: "Heading 1",
            run: {
              font: "Trebuchet MS",
              size: 40, // 20pt
              bold: true,
              color: "333333",
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
              font: "Trebuchet MS",
              size: 24, // 12pt
              bold: true,
              color: "333333",
              allCaps: true,
            },
            paragraph: {
              spacing: {
                before: 240,
                after: 120,
              },
              border: {
                bottom: {
                  style: BorderStyle.SINGLE,
                  size: 6,
                  color: "333333",
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

    // Header
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
        text: contactParts.join(" • "),
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
      })
    );

    // Sections
    this.data.sections.forEach((section) => {
      // Clean section title
      const cleanTitle = this.cleanSectionTitle(section.title);
      
      children.push(
        new Paragraph({
          text: cleanTitle,
          heading: HeadingLevel.HEADING_2,
        })
      );

      if (section.type === "skills" || section.type === "skills_list" || section.type === "skills_groups" || section.type === "core_capabilities" || section.type === "technical_skills" || section.type === "core_competencies") {
        children.push(...this.createSkillGroups(section.bullets || []));
      } else if (section.type === "employment_history") {
        children.push(...this.createSimpleHistory(section.bullets || []));
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

  private createSkillGroups(bullets: string[]): any[] {
    // Convert to 3-column grid for skills
    let cleanSkills = bullets
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

  private createSimpleHistory(bullets: string[]): any[] {
    // Just Company, Title, Dates - minimal detail
    const elements: any[] = [];
    
     bullets.forEach((bullet) => {
      const cleanBullet = formatResumeContent(bullet);
      const jobMatch = cleanBullet.match(/^(.+?)\s*[|]\s*(.+?)(?:\s*[|]\s*(.+?))?$/);

      if (jobMatch) {
         // Title | Company | Dates
         // Render as: Company - Title (Dates)
         const title = jobMatch[1].trim();
         const company = jobMatch[2].trim();
         const dates = jobMatch[3] ? jobMatch[3].trim() : "";
         
         elements.push(
             new Paragraph({
                 children: [
                     new TextRun({ text: company, bold: true }),
                     new TextRun({ text: " - " + title }),
                     new TextRun({ text: dates ? ` (${dates})` : "", italics: true })
                 ],
                 spacing: { after: 60 }
             })
         );
      } else {
          // Fallback
           elements.push(
             new Paragraph({
                 text: cleanBullet.replace(/^[-•]\s*/, ""),
                 spacing: { after: 60 }
             })
         );
      }
    });
    
    return elements;
  }
}
