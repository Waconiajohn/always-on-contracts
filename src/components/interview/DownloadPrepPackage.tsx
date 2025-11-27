import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { saveAs } from "file-saver";
import { useToast } from "@/hooks/use-toast";

interface DownloadPrepPackageProps {
  selectedJob: any;
  companyName?: string;
  disabled?: boolean;
}

export const DownloadPrepPackage = ({
  selectedJob,
  companyName,
  disabled = false
}: DownloadPrepPackageProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateDocument = async () => {
    setIsGenerating(true);
    
    try {
      // Create document sections
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              // Title
              new Paragraph({
                text: "Interview Preparation Package",
                heading: HeadingLevel.HEADING_1,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
              }),
              
              // Job Details
              new Paragraph({
                text: "Position Details",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Position: ", bold: true }),
                  new TextRun(selectedJob?.job_title || "N/A")
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Company: ", bold: true }),
                  new TextRun(companyName || selectedJob?.company_name || "N/A")
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Location: ", bold: true }),
                  new TextRun(selectedJob?.location || "Not specified")
                ],
                spacing: { after: 400 }
              }),

              // Company Research Section
              new Paragraph({
                text: "Company Research",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
              }),
              new Paragraph({
                text: "Research the company's mission, values, recent news, and products before your interview. Key areas to focus on:",
                spacing: { after: 100 }
              }),
              new Paragraph({
                text: "• Company mission and values",
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: "• Recent company news and achievements",
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: "• Products/services and market position",
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: "• Company culture and work environment",
                spacing: { after: 400 }
              }),

              // Elevator Pitch
              new Paragraph({
                text: "Your Elevator Pitch",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
              }),
              new Paragraph({
                text: "Craft a concise 60-second introduction highlighting your unique value proposition for this role.",
                spacing: { after: 200 }
              }),
              new Paragraph({
                text: "[Use the Pitch tab in the Interview Prep Agent to generate your personalized elevator pitch]",
                spacing: { after: 400 }
              }),

              // 3-2-1 Framework
              new Paragraph({
                text: "3-2-1 Interview Framework",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "3 Key Strengths: ", bold: true }),
                  new TextRun("Your top 3 qualifications for this role")
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "2 Success Stories: ", bold: true }),
                  new TextRun("STAR format examples demonstrating impact")
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "1 Thoughtful Question: ", bold: true }),
                  new TextRun("Shows genuine interest in the role/company")
                ],
                spacing: { after: 400 }
              }),

              // 30-60-90 Day Plan
              new Paragraph({
                text: "30-60-90 Day Plan",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "First 30 Days: ", bold: true }),
                  new TextRun("Learn systems, processes, meet team, understand workflows")
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "60 Days: ", bold: true }),
                  new TextRun("Take on projects, contribute to team goals, identify improvements")
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "90 Days: ", bold: true }),
                  new TextRun("Deliver measurable results, drive initiatives, be a key contributor")
                ],
                spacing: { after: 400 }
              }),

              // Practice Questions
              new Paragraph({
                text: "Practice Questions & Tips",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "Common Interview Questions:", bold: true })
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                text: "• Tell me about yourself",
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: "• Why are you interested in this role?",
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: "• What are your greatest strengths?",
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: "• Describe a challenge you overcame",
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: "• Where do you see yourself in 5 years?",
                spacing: { after: 400 }
              }),

              // STAR Method
              new Paragraph({
                text: "STAR Method Framework",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "S - Situation: ", bold: true }),
                  new TextRun("Set the context for your story")
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "T - Task: ", bold: true }),
                  new TextRun("Describe your responsibility")
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "A - Action: ", bold: true }),
                  new TextRun("Explain the steps you took")
                ],
                spacing: { after: 100 }
              }),
              new Paragraph({
                children: [
                  new TextRun({ text: "R - Result: ", bold: true }),
                  new TextRun("Share the measurable outcomes")
                ],
                spacing: { after: 400 }
              }),

              // Follow-up
              new Paragraph({
                text: "Post-Interview Follow-up",
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 400, after: 200 }
              }),
              new Paragraph({
                text: "Send a thank-you note within 24 hours:",
                spacing: { after: 100 }
              }),
              new Paragraph({
                text: "• Thank the interviewer for their time",
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: "• Reference specific discussion points",
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: "• Reaffirm your interest in the position",
                spacing: { after: 50 }
              }),
              new Paragraph({
                text: "• Briefly reinforce your qualifications",
                spacing: { after: 400 }
              }),

              // Footer
              new Paragraph({
                text: "Generated by Interview Prep Agent",
                alignment: AlignmentType.CENTER,
                spacing: { before: 800 }
              }),
              new Paragraph({
                text: new Date().toLocaleDateString(),
                alignment: AlignmentType.CENTER,
              })
            ]
          }
        ]
      });

      // Generate and download
      const blob = await Packer.toBlob(doc);
      const fileName = `Interview_Prep_${selectedJob?.job_title?.replace(/\s+/g, '_') || 'Package'}_${new Date().toISOString().split('T')[0]}.docx`;
      saveAs(blob, fileName);

      toast({
        title: "Download Complete",
        description: `Your interview prep package has been saved as ${fileName}`,
      });
    } catch (error) {
      console.error("Error generating document:", error);
      toast({
        title: "Download Failed",
        description: "Failed to generate the prep package. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={generateDocument}
      disabled={disabled || isGenerating || !selectedJob}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Download Complete Prep Package
        </>
      )}
    </Button>
  );
};
