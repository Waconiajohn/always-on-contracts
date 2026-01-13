// =====================================================
// PRINTABLE RESUME COMPONENT
// =====================================================
// Clean, print-optimized resume layout
// =====================================================

import { forwardRef } from "react";
import { OptimizedResume } from "@/stores/resumeBuilderV3Store";

interface PrintableResumeProps {
  resume: OptimizedResume;
}

export const PrintableResume = forwardRef<HTMLDivElement, PrintableResumeProps>(
  ({ resume }, ref) => {
    // Using inline styles for print to ensure consistent output regardless of theme
    return (
      <div
        ref={ref}
        className="print-resume p-8 max-w-[8.5in] mx-auto"
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: "11pt",
          lineHeight: "1.4",
          backgroundColor: "#ffffff",
          color: "#000000",
        }}
      >
        {/* Print-specific CSS for page breaks */}
        <style>{`
          @media print {
            .print-resume section { page-break-inside: avoid; }
            .print-resume .experience-item { page-break-inside: avoid; }
          }
        `}</style>
        {/* Header */}
        <header 
          className="text-center pb-4 mb-4"
          style={{ borderBottom: "2px solid #000000" }}
        >
          <h1 
            className="text-2xl font-bold uppercase tracking-wide mb-1"
            style={{ color: "#000000" }}
          >
            {resume.header.name}
          </h1>
          <p 
            className="text-base font-medium"
            style={{ color: "#374151" }}
          >
            {resume.header.title}
          </p>
          {resume.header.contact && (
            <p 
              className="text-sm mt-1"
              style={{ color: "#4b5563" }}
            >
              {resume.header.contact}
            </p>
          )}
        </header>

        {/* Professional Summary */}
        <section className="mb-4">
          <h2 
            className="text-sm font-bold uppercase tracking-wider pb-1 mb-2"
            style={{ borderBottom: "1px solid #9ca3af", color: "#000000" }}
          >
            Professional Summary
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "#000000" }}>{resume.summary}</p>
        </section>

        {/* Experience */}
        <section className="mb-4">
          <h2 
            className="text-sm font-bold uppercase tracking-wider pb-1 mb-2"
            style={{ borderBottom: "1px solid #9ca3af", color: "#000000" }}
          >
            Professional Experience
          </h2>
          <div className="space-y-3">
            {resume.experience.map((exp, index) => (
              <div key={`exp-${index}-${exp.company}`} className="experience-item">
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold" style={{ color: "#000000" }}>{exp.title}</span>
                    <span style={{ color: "#4b5563" }}> | {exp.company}</span>
                  </div>
                  <span className="text-sm" style={{ color: "#4b5563" }}>{exp.dates}</span>
                </div>
                <ul className="mt-1 ml-4 space-y-0.5">
                  {exp.bullets.map((bullet, bIndex) => (
                    <li key={`bullet-${bIndex}-${bullet.substring(0, 20).replace(/\s/g, '')}`} className="text-sm list-disc ml-2" style={{ color: "#000000" }}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        {resume.skills.length > 0 && (
          <section className="mb-4">
            <h2 
              className="text-sm font-bold uppercase tracking-wider pb-1 mb-2"
              style={{ borderBottom: "1px solid #9ca3af", color: "#000000" }}
            >
              Technical Skills
            </h2>
            <p className="text-sm" style={{ color: "#000000" }}>{resume.skills.join(" • ")}</p>
          </section>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <section className="mb-4">
            <h2 
              className="text-sm font-bold uppercase tracking-wider pb-1 mb-2"
              style={{ borderBottom: "1px solid #9ca3af", color: "#000000" }}
            >
              Education
            </h2>
            <div className="space-y-1">
              {resume.education.map((edu, index) => (
                <div key={`edu-${index}-${edu.institution}-${edu.degree}`} className="flex justify-between">
                  <div>
                    <span className="font-medium" style={{ color: "#000000" }}>{edu.degree}</span>
                    <span style={{ color: "#4b5563" }}> — {edu.institution}</span>
                  </div>
                  {edu.year && <span className="text-sm" style={{ color: "#4b5563" }}>{edu.year}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {resume.certifications && resume.certifications.length > 0 && (
          <section>
            <h2 
              className="text-sm font-bold uppercase tracking-wider pb-1 mb-2"
              style={{ borderBottom: "1px solid #9ca3af", color: "#000000" }}
            >
              Certifications
            </h2>
            <ul className="text-sm space-y-0.5">
              {resume.certifications.map((cert, index) => (
                <li key={`cert-${index}-${cert}`} className="list-disc ml-6" style={{ color: "#000000" }}>
                  {cert}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    );
  }
);

PrintableResume.displayName = "PrintableResume";
