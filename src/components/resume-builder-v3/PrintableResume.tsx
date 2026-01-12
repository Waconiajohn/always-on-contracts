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
    return (
      <div
        ref={ref}
        className="print-resume bg-white text-black p-8 max-w-[8.5in] mx-auto"
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          fontSize: "11pt",
          lineHeight: "1.4",
        }}
      >
        {/* Header */}
        <header className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-2xl font-bold uppercase tracking-wide mb-1">
            {resume.header.name}
          </h1>
          <p className="text-base font-medium text-gray-700">
            {resume.header.title}
          </p>
          {resume.header.contact && (
            <p className="text-sm text-gray-600 mt-1">{resume.header.contact}</p>
          )}
        </header>

        {/* Professional Summary */}
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2">
            Professional Summary
          </h2>
          <p className="text-sm leading-relaxed">{resume.summary}</p>
        </section>

        {/* Experience */}
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2">
            Professional Experience
          </h2>
          <div className="space-y-3">
            {resume.experience.map((exp, index) => (
              <div key={index}>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="font-bold">{exp.title}</span>
                    <span className="text-gray-600"> | {exp.company}</span>
                  </div>
                  <span className="text-sm text-gray-600">{exp.dates}</span>
                </div>
                <ul className="mt-1 ml-4 space-y-0.5">
                  {exp.bullets.map((bullet, bIndex) => (
                    <li key={bIndex} className="text-sm list-disc ml-2">
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
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2">
              Technical Skills
            </h2>
            <p className="text-sm">{resume.skills.join(" • ")}</p>
          </section>
        )}

        {/* Education */}
        {resume.education && resume.education.length > 0 && (
          <section className="mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2">
              Education
            </h2>
            <div className="space-y-1">
              {resume.education.map((edu, index) => (
                <div key={index} className="flex justify-between">
                  <div>
                    <span className="font-medium">{edu.degree}</span>
                    <span className="text-gray-600"> — {edu.institution}</span>
                  </div>
                  {edu.year && <span className="text-sm text-gray-600">{edu.year}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certifications */}
        {resume.certifications && resume.certifications.length > 0 && (
          <section>
            <h2 className="text-sm font-bold uppercase tracking-wider border-b border-gray-400 pb-1 mb-2">
              Certifications
            </h2>
            <ul className="text-sm space-y-0.5">
              {resume.certifications.map((cert, index) => (
                <li key={index} className="list-disc ml-6">
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
