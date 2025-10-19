import { TemplateCustomization } from "@/components/resume/TemplateCustomizer";

export function applyCustomizationToHTML(
  htmlContent: string,
  customization: TemplateCustomization
): string {
  // Create a style block with custom CSS
  const customStyles = `
    <style>
      :root {
        --primary-color: ${customization.primaryColor};
        --secondary-color: ${customization.secondaryColor};
        --accent-color: ${customization.accentColor};
        --font-family: ${customization.fontFamily}, sans-serif;
        --font-size: ${customization.fontSize}pt;
        --line-height: ${customization.lineHeight};
        --section-spacing: ${customization.sectionSpacing}px;
      }
      
      body {
        font-family: var(--font-family);
        font-size: var(--font-size);
        line-height: var(--line-height);
        color: #1a1a1a;
      }
      
      h1, h2, h3 {
        color: var(--primary-color);
        margin-top: var(--section-spacing);
        margin-bottom: calc(var(--section-spacing) * 0.5);
      }
      
      ${customization.headerStyle === 'modern' ? `
        h1 {
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        h2 {
          font-weight: 600;
          border-bottom: 2px solid var(--primary-color);
          padding-bottom: 4px;
        }
      ` : ''}
      
      ${customization.headerStyle === 'classic' ? `
        h1 {
          font-weight: 600;
          text-align: center;
          border-bottom: 1px solid var(--primary-color);
          padding-bottom: 8px;
        }
        h2 {
          font-weight: 500;
          font-style: italic;
        }
      ` : ''}
      
      ${customization.headerStyle === 'minimal' ? `
        h1 {
          font-weight: 500;
          font-size: calc(var(--font-size) * 1.3);
        }
        h2 {
          font-weight: 400;
          font-size: calc(var(--font-size) * 1.1);
          color: var(--secondary-color);
        }
      ` : ''}
      
      .section {
        margin-bottom: var(--section-spacing);
      }
      
      ${customization.borderStyle === 'subtle' ? `
        .section {
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: calc(var(--section-spacing) * 0.75);
        }
      ` : ''}
      
      ${customization.borderStyle === 'bold' ? `
        .section {
          border-left: 4px solid var(--accent-color);
          padding-left: 12px;
        }
      ` : ''}
      
      a {
        color: var(--accent-color);
        text-decoration: none;
      }
      
      a:hover {
        text-decoration: underline;
      }
      
      .contact-info {
        color: var(--secondary-color);
      }
      
      .job-title, .company-name {
        color: var(--primary-color);
        font-weight: 600;
      }
      
      .date-range {
        color: var(--secondary-color);
        font-style: italic;
      }
      
      ul {
        margin-left: 20px;
      }
      
      li {
        margin-bottom: calc(var(--section-spacing) * 0.25);
      }
      
      strong {
        color: var(--primary-color);
      }
    </style>
  `;
  
  // Insert custom styles into the HTML
  if (htmlContent.includes('</head>')) {
    return htmlContent.replace('</head>', `${customStyles}</head>`);
  } else if (htmlContent.includes('<body')) {
    return htmlContent.replace('<body', `${customStyles}<body`);
  } else {
    return `${customStyles}${htmlContent}`;
  }
}

export function generateCustomizedCSS(customization: TemplateCustomization): string {
  return `
/* Template Customization */
:root {
  --primary-color: ${customization.primaryColor};
  --secondary-color: ${customization.secondaryColor};
  --accent-color: ${customization.accentColor};
  --font-family: ${customization.fontFamily}, sans-serif;
  --font-size: ${customization.fontSize}pt;
  --line-height: ${customization.lineHeight};
  --section-spacing: ${customization.sectionSpacing}px;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: var(--line-height);
}

h1, h2, h3 {
  color: var(--primary-color);
}
`.trim();
}
