// src/lib/resumeSerialization.ts

import {
  BuilderResumeSection,
  CanonicalResume,
  CanonicalResumeHeader,
  CanonicalResumeSection,
  CanonicalSectionType,
} from "./resumeModel";

/**
 * Try to map ad-hoc builder section types to CanonicalSectionType.
 * If something doesn't map cleanly, we fall back to "other".
 */
function normalizeSectionType(rawType: string): CanonicalSectionType {
  const t = rawType.toLowerCase();

  if (t.includes("summary") || t.includes("profile")) return "summary";
  if (t.includes("experience") || t.includes("employment")) return "experience";
  if (t.includes("skill")) return "skills";
  if (t.includes("achievement") || t.includes("accomplish")) return "achievements";
  if (t.includes("leader") || t.includes("management")) return "leadership";
  if (t.includes("project")) return "projects";
  if (t.includes("education")) return "education";
  if (t.includes("cert")) return "certifications";

  return "other";
}

/**
 * Basic helper to build the header from whatever user profile
 * object you already have in your builder/wizard.
 *
 * Adjust the property names to match your actual user profile model.
 */
export function buildCanonicalHeaderFromProfile(userProfile: any): CanonicalResumeHeader {
  if (!userProfile) {
    return {
      fullName: "",
    };
  }

  const fullName =
    userProfile.full_name ||
    userProfile.name ||
    `${userProfile.first_name ?? ""} ${userProfile.last_name ?? ""}`.trim() ||
    "";

  const headline =
    userProfile.resume_headline ||
    userProfile.headline ||
    userProfile.title ||
    undefined;

  const contactParts: string[] = [];

  if (userProfile.location || userProfile.city || userProfile.region) {
    const loc =
      userProfile.location ||
      userProfile.city ||
      userProfile.region;
    if (loc) contactParts.push(loc);
  }

  if (userProfile.phone || userProfile.mobile) {
    contactParts.push(userProfile.phone ?? userProfile.mobile);
  }

  if (userProfile.email) {
    contactParts.push(userProfile.email);
  }

  if (userProfile.linkedin_url || userProfile.linkedin) {
    contactParts.push(userProfile.linkedin_url ?? userProfile.linkedin);
  }

  return {
    fullName,
    headline,
    contactLine: contactParts.filter(Boolean).join(" • "),
  };
}

/**
 * Convert your builder sections into the canonical resume structure.
 * This is the ONLY place that knows how to interpret the builder's
 * internal representation.
 */
export function builderStateToCanonicalResume(params: {
  userProfile: any;
  sections: BuilderResumeSection[];
}): CanonicalResume {
  const { userProfile, sections } = params;

  const header = buildCanonicalHeaderFromProfile(userProfile);

  const canonicalSections: CanonicalResumeSection[] = sections
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((section) => {
      const type = normalizeSectionType(section.type);
      const heading = section.title || section.type || "Section";

      // For summary-like sections, we often want a paragraph instead of bullets.
      if (type === "summary") {
        // Combine all items into a single paragraph separated by spaces.
        const paragraph = section.items
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((item) => item.content.trim())
          .filter(Boolean)
          .join(" ");

        return {
          id: section.id,
          type,
          heading,
          bullets: [],
          paragraph,
          order: section.order ?? 0,
        };
      }

      const bullets = section.items
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((item) => item.content.trim())
        .filter(content => {
          if (!content) return false;
          const lower = content.toLowerCase();
          const headingLower = heading.toLowerCase();
          const typeLower = section.type.toLowerCase().replace(/_/g, ' ');
          // Filter out bullets that match the section heading, type, or common duplicates
          return lower !== headingLower && 
                 lower !== typeLower && 
                 lower !== 'education' && 
                 lower !== 'experience' &&
                 lower !== 'professional experience' &&
                 lower !== 'work experience';
        });

      return {
        id: section.id,
        type,
        heading,
        bullets,
        order: section.order ?? 0,
      };
    });

  return {
    header,
    sections: canonicalSections,
  };
}

/**
 * Convert a canonical resume to ATS-friendly plain text.
 * This is ideal for:
 * - plain-text export
 * - feeding into ATS analyzers
 * - generating .txt output
 */
export function canonicalResumeToPlainText(resume: CanonicalResume): string {
  const lines: string[] = [];

  const { header, sections } = resume;

  if (header.fullName) {
    lines.push(header.fullName.toUpperCase());
  }
  if (header.headline) {
    lines.push(header.headline);
  }
  if (header.contactLine) {
    lines.push(header.contactLine);
  }

  if (lines.length) {
    lines.push(""); // blank line after header
  }

  sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .forEach((section) => {
      lines.push(section.heading.toUpperCase());
      if (section.paragraph) {
        lines.push(section.paragraph);
      }
      section.bullets.forEach((b) => {
        lines.push(`• ${b}`);
      });
      lines.push(""); // blank line after each section
    });

  return lines.join("\n");
}

/**
 * Simple, styling-agnostic HTML version.
 * You can wrap this HTML in a styled container for on-screen preview,
 * and feed it into a PDF/Word generator.
 */
export function canonicalResumeToHTML(resume: CanonicalResume): string {
  const { header, sections } = resume;

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const headerHtmlParts: string[] = [];

  if (header.fullName) {
    headerHtmlParts.push(`<h1 style="margin:0;">${escapeHtml(header.fullName)}</h1>`);
  }
  if (header.headline) {
    headerHtmlParts.push(
      `<h2 style="margin:4px 0 0 0;font-size:1rem;font-weight:normal;">${escapeHtml(
        header.headline
      )}</h2>`
    );
  }
  if (header.contactLine) {
    headerHtmlParts.push(
      `<p style="margin:4px 0 16px 0;font-size:0.85rem;">${escapeHtml(
        header.contactLine
      )}</p>`
    );
  }

  const sectionsHtml = sections
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((section) => {
      const bulletsHtml = section.bullets
        .map((b) => `<li>${escapeHtml(b)}</li>`)
        .join("");

      const paragraphHtml = section.paragraph
        ? `<p>${escapeHtml(section.paragraph)}</p>`
        : "";

      return `
        <section style="margin-bottom:12px;">
          <h3 style="margin:0 0 4px 0;font-size:0.95rem;text-transform:uppercase;letter-spacing:0.05em;">
            ${escapeHtml(section.heading)}
          </h3>
          ${paragraphHtml}
          ${
            bulletsHtml
              ? `<ul style="margin:4px 0 0 20px;padding:0;font-size:0.9rem;">${bulletsHtml}</ul>`
              : ""
          }
        </section>
      `;
    })
    .join("\n");

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <title>Resume</title>
      </head>
      <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;line-height:1.4;margin:24px;">
        <header>
          ${headerHtmlParts.join("\n")}
        </header>
        ${sectionsHtml}
      </body>
    </html>
  `;

  return html.trim();
}
