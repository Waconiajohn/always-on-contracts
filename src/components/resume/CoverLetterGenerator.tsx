import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Sparkles, 
  Download,
  Copy,
  RefreshCw,
  CheckCircle2,
  Lightbulb
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CoverLetterGeneratorProps {
  resumeContent?: string;
  jobTitle?: string;
  companyName?: string;
  jobDescription?: string;
  onGenerate?: (letterContent: string, tone: string) => void;
  loading?: boolean;
}

export function CoverLetterGenerator({
  resumeContent,
  jobTitle,
  companyName,
  jobDescription,
  onGenerate,
  loading = false
}: CoverLetterGeneratorProps) {
  const [tone, setTone] = useState<string>("professional");
  const [emphasis, setEmphasis] = useState<string>("achievements");
  const [generatedLetter, setGeneratedLetter] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const toneOptions = [
    { value: "professional", label: "Professional", description: "Formal and business-appropriate" },
    { value: "enthusiastic", label: "Enthusiastic", description: "Energetic and passionate" },
    { value: "confident", label: "Confident", description: "Assertive and self-assured" },
    { value: "conversational", label: "Conversational", description: "Warm and personable" },
  ];

  const emphasisOptions = [
    { value: "achievements", label: "Achievements", description: "Focus on quantifiable results" },
    { value: "skills", label: "Skills", description: "Highlight technical capabilities" },
    { value: "leadership", label: "Leadership", description: "Emphasize management experience" },
    { value: "innovation", label: "Innovation", description: "Showcase creative problem-solving" },
  ];

  const handleGenerate = async () => {
    if (!resumeContent || !jobDescription) {
      toast.error("Please provide resume and job description");
      return;
    }

    setIsGenerating(true);
    
    // Mock generation - in production, this would call an edge function
    setTimeout(() => {
      const mockLetter = generateMockLetter();
      setGeneratedLetter(mockLetter);
      setIsGenerating(false);
      onGenerate?.(mockLetter, tone);
      toast.success("Cover letter generated successfully!");
    }, 2000);
  };

  const generateMockLetter = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    
    return `${today}

Hiring Manager
${companyName || '[Company Name]'}
[Company Address]

Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle || '[Position Title]'} position at ${companyName || '[Company Name]'}. With my extensive background in executive leadership and proven track record of driving organizational success, I am confident in my ability to make significant contributions to your team.

Throughout my career, I have consistently demonstrated the ability to transform challenges into opportunities. My experience includes:

• Leading cross-functional teams of 50+ professionals to achieve ambitious goals
• Driving revenue growth of $50M+ through strategic initiatives and market expansion
• Implementing innovative processes that improved operational efficiency by 40%
• Building and mentoring high-performing teams that consistently exceed targets

What particularly excites me about this opportunity at ${companyName || '[Company Name]'} is the chance to apply my expertise in strategic planning and organizational development to help drive your company's continued growth and success. Your commitment to innovation and excellence aligns perfectly with my professional values and leadership philosophy.

I am particularly drawn to ${companyName || '[Company Name]'}'s focus on [mention specific aspect from job description]. My background in this area includes [relevant experience], which I believe would be valuable in helping your organization achieve its strategic objectives.

I would welcome the opportunity to discuss how my experience and vision align with your needs. Thank you for considering my application. I look forward to the possibility of contributing to ${companyName || '[Company Name]'}'s continued success.

Sincerely,

[Your Name]
[Your Email]
[Your Phone]`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedLetter);
      setCopied(true);
      toast.success("Cover letter copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedLetter], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-letter-${jobTitle || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Cover letter downloaded!");
  };

  return (
    <div className="space-y-6">
      {/* Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Cover Letter Generator
          </CardTitle>
          <CardDescription>
            Generate a compelling cover letter tailored to the job description
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Info Summary */}
          {(jobTitle || companyName) && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium">
                  {jobTitle && `${jobTitle}`}
                  {jobTitle && companyName && " at "}
                  {companyName && companyName}
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Tone Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Writing Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {toneOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Emphasis Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Content Emphasis</Label>
            <Select value={emphasis} onValueChange={setEmphasis}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {emphasisOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate Button */}
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || loading || !resumeContent || !jobDescription}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Cover Letter
              </>
            )}
          </Button>

          {!resumeContent && (
            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                Please generate a resume first to create a matching cover letter
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generated Letter */}
      {generatedLetter && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  Generated Cover Letter
                </CardTitle>
                <CardDescription>
                  Review and customize before sending
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Badge>{tone}</Badge>
              <Badge variant="outline">{emphasis} focus</Badge>
            </div>

            <Textarea
              value={generatedLetter}
              onChange={(e) => setGeneratedLetter(e.target.value)}
              className="min-h-[500px] font-mono text-sm"
            />

            <Alert>
              <Lightbulb className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Pro Tips:</p>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>Personalize the opening with specific details about the company</li>
                  <li>Replace bracketed placeholders with your actual information</li>
                  <li>Add 1-2 specific examples that match job requirements</li>
                  <li>Keep it concise - aim for 3-4 paragraphs maximum</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Best Practices */}
      <Card className="bg-accent/30">
        <CardHeader>
          <CardTitle className="text-base">Cover Letter Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>Address the hiring manager by name if possible (research on LinkedIn)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>Reference specific projects or initiatives the company is working on</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>Quantify your achievements with specific metrics and numbers</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>Match keywords from the job description naturally in your letter</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>End with a clear call-to-action requesting an interview</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
