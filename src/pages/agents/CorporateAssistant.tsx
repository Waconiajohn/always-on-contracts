import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Upload, MessageSquare, Target, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import * as pdfjsLib from 'pdfjs-dist';

interface InterviewPhase {
  phase: 'resume_understanding' | 'skills_translation' | 'hidden_gems' | 'complete';
  title: string;
  description: string;
  questions: string[];
  currentQuestionIndex: number;
}

const CorporateAssistantContent = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string>("");
  const [warChestId, setWarChestId] = useState<string | null>(null);
  const [step, setStep] = useState<'upload' | 'analyzing' | 'interview' | 'building'>('upload');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [currentResponse, setCurrentResponse] = useState("");
  const [interviewPhase, setInterviewPhase] = useState<InterviewPhase>({
    phase: 'resume_understanding',
    title: 'Understanding Your Experience',
    description: 'Let me learn more about your background',
    questions: [],
    currentQuestionIndex: 0
  });
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [aiTyping, setAiTyping] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);

  // Configure PDF.js worker
  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    console.log('PDF.js worker configured:', pdfjsLib.GlobalWorkerOptions.workerSrc);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        checkExistingWarChest(user.id);
      }
    });
  }, []);

  const checkExistingWarChest = async (uid: string) => {
    const { data } = await supabase
      .from('career_war_chest')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (data) {
      setWarChestId(data.id);
      setCompletionPercentage(data.interview_completion_percentage || 0);
      if (data.interview_completion_percentage === 100) {
        setStep('building');
      } else if (data.resume_raw_text) {
        setStep('interview');
        loadNextQuestion(data.id);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setResumeFile(file);
    setIsParsingFile(true);
    
    try {
      const fileName = file.name.toLowerCase();
      
      // For text files, read directly
      if (fileName.endsWith('.txt')) {
        const text = await file.text();
        setResumeText(text);
        toast({
          title: "Resume loaded",
          description: "Text file loaded successfully",
        });
      } 
      // For PDF files, parse on client side using pdf.js
      else if (fileName.endsWith('.pdf')) {
        console.log('Starting PDF parsing...');
        
        try {
          const arrayBuffer = await file.arrayBuffer();
          console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);
          
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          console.log('Loading task created');
          
          const pdf = await loadingTask.promise;
          console.log('PDF loaded, pages:', pdf.numPages);
          
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            console.log(`Processing page ${i}/${pdf.numPages}`);
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item: any) => item.str)
              .join(' ');
            fullText += pageText + '\n\n';
          }
          
          console.log('Successfully extracted text from PDF, length:', fullText.length);
          
          if (fullText.trim().length < 50) {
            throw new Error('PDF appears to be empty or text could not be extracted. Please try a different file or paste your resume text directly.');
          }
          
          setResumeText(fullText);
          toast({
            title: "PDF parsed successfully",
            description: `Extracted ${fullText.length.toLocaleString()} characters from ${pdf.numPages} pages`,
          });
        } catch (pdfError: any) {
          console.error('PDF parsing error:', pdfError);
          throw new Error(`Failed to parse PDF: ${pdfError.message}. Please try pasting your resume text directly.`);
        }
      }
      // For DOC/DOCX files, use edge function
      else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        toast({
          title: "Parsing document...",
          description: "This may take a moment",
        });
        
        const arrayBuffer = await file.arrayBuffer();
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        const { data, error } = await supabase.functions.invoke('parse-resume', {
          body: {
            fileData: base64Data,
            fileName: file.name
          }
        });
        
        if (error || !data?.success) {
          throw new Error(data?.error || 'Failed to parse document');
        }
        
        setResumeText(data.text);
        toast({
          title: "Document parsed",
          description: "Resume text extracted successfully",
        });
      } else {
        throw new Error("Unsupported file type. Please use .txt, .pdf, .doc, or .docx files.");
      }
    } catch (error: any) {
      console.error('Error reading file:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to read file. Please try pasting the text instead.",
        variant: "destructive",
      });
      setResumeFile(null);
      setResumeText("");
    } finally {
      setIsParsingFile(false);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText || !userId) return;

    setStep('analyzing');
    setAiTyping(true);

    try {
      // Sanitize resume text to remove null bytes and other problematic characters
      const sanitizedText = resumeText
        .replace(/\u0000/g, '') // Remove null bytes
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove other control characters
        .trim();

      // Create or update war chest
      const { data: warChest, error: wcError } = await supabase
        .from('career_war_chest')
        .upsert({
          user_id: userId,
          resume_raw_text: sanitizedText,
          interview_completion_percentage: 0
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (wcError) throw wcError;
      setWarChestId(warChest.id);

      // Call initial analysis edge function
      const { data: analysis, error: analysisError } = await supabase.functions.invoke('analyze-resume', {
        body: { resumeText: sanitizedText }
      });

      if (analysisError) throw analysisError;

      // Update war chest with initial analysis
      await supabase
        .from('career_war_chest')
        .update({
          initial_analysis: analysis,
          overall_strength_score: analysis.strengthScore || 50
        })
        .eq('id', warChest.id);

      setAiTyping(false);
      setStep('interview');
      await loadNextQuestion(warChest.id);

      toast({
        title: "Resume Analyzed",
        description: "Let's start building your War Chest!",
      });
    } catch (error: any) {
      console.error('Error analyzing resume:', error);
      toast({
        title: "Analysis Error",
        description: error.message,
        variant: "destructive",
      });
      setAiTyping(false);
    }
  };

  const loadNextQuestion = async (wcId: string) => {
    setAiTyping(true);
    
    try {
      // Get existing responses to determine next question
      const { data: responses } = await supabase
        .from('war_chest_interview_responses')
        .select('*')
        .eq('war_chest_id', wcId)
        .order('created_at', { ascending: true });

      const totalResponses = responses?.length || 0;
      const completion = Math.min((totalResponses / 25) * 100, 100);
      setCompletionPercentage(completion);

      if (completion >= 100) {
        setStep('building');
        await buildWarChestIntelligence(wcId);
        return;
      }

      // Generate next question based on phase
      const { data: question, error } = await supabase.functions.invoke('generate-interview-question', {
        body: {
          warChestId: wcId,
          previousResponses: responses
        }
      });

      if (error) throw error;

      setInterviewPhase({
        phase: question.phase,
        title: question.phaseTitle,
        description: question.phaseDescription,
        questions: [question.question],
        currentQuestionIndex: 0
      });

      await supabase
        .from('career_war_chest')
        .update({ interview_completion_percentage: completion })
        .eq('id', wcId);

    } catch (error: any) {
      console.error('Error loading question:', error);
      toast({
        title: "Error",
        description: "Failed to load next question",
        variant: "destructive",
      });
    } finally {
      setAiTyping(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!currentResponse.trim() || !warChestId) return;

    try {
      // Save response
      await supabase
        .from('war_chest_interview_responses')
        .insert({
          war_chest_id: warChestId,
          user_id: userId,
          question: interviewPhase.questions[0],
          response: currentResponse,
          phase: interviewPhase.phase
        });

      setCurrentResponse("");
      await loadNextQuestion(warChestId);

    } catch (error: any) {
      console.error('Error submitting response:', error);
      toast({
        title: "Error",
        description: "Failed to save response",
        variant: "destructive",
      });
    }
  };

  const buildWarChestIntelligence = async (wcId: string) => {
    setAiTyping(true);
    
    try {
      // Call intelligence edge functions in parallel
      await Promise.all([
        supabase.functions.invoke('generate-power-phrases', { body: { warChestId: wcId } }),
        supabase.functions.invoke('generate-transferable-skills', { body: { warChestId: wcId } }),
        supabase.functions.invoke('discover-hidden-competencies', { body: { warChestId: wcId } })
      ]);

      // Update totals
      const [phrases, skills, competencies] = await Promise.all([
        supabase.from('war_chest_power_phrases').select('id', { count: 'exact', head: true }).eq('war_chest_id', wcId),
        supabase.from('war_chest_transferable_skills').select('id', { count: 'exact', head: true }).eq('war_chest_id', wcId),
        supabase.from('war_chest_hidden_competencies').select('id', { count: 'exact', head: true }).eq('war_chest_id', wcId)
      ]);

      await supabase
        .from('career_war_chest')
        .update({
          total_power_phrases: phrases.count || 0,
          total_transferable_skills: skills.count || 0,
          total_hidden_competencies: competencies.count || 0
        })
        .eq('id', wcId);

      toast({
        title: "War Chest Complete!",
        description: "Your career intelligence engine is ready.",
      });

    } catch (error: any) {
      console.error('Error building war chest:', error);
      toast({
        title: "Error",
        description: "Failed to build war chest intelligence",
        variant: "destructive",
      });
    } finally {
      setAiTyping(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Briefcase className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Your Corporate Assistant</h1>
        </div>
        <p className="text-muted-foreground">
          I'll help you build a comprehensive War Chest of your skills, experience, and hidden talents
        </p>
      </div>

      {/* Progress Bar */}
      {step !== 'upload' && (
        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">War Chest Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(completionPercentage)}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2" />
          <div className="flex gap-2 mt-4">
            <Badge variant={step === 'analyzing' ? 'default' : completionPercentage > 0 ? 'default' : 'outline'}>
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Resume Analyzed
            </Badge>
            <Badge variant={step === 'interview' ? 'default' : completionPercentage >= 100 ? 'default' : 'outline'}>
              <MessageSquare className="w-3 h-3 mr-1" />
              Interview {completionPercentage < 100 ? 'In Progress' : 'Complete'}
            </Badge>
            <Badge variant={step === 'building' ? 'default' : 'outline'}>
              <Target className="w-3 h-3 mr-1" />
              War Chest Built
            </Badge>
          </div>
        </Card>
      )}

      {/* Step 1: Upload Resume */}
      {step === 'upload' && (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            <Upload className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Upload Your Resume</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Upload your resume (.txt, .pdf, .doc, or .docx) or paste your resume text below.
            </p>
            
            <input
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
              id="resume-upload"
              disabled={isParsingFile}
            />
            <div className="flex gap-3 mb-4">
              <label htmlFor="resume-upload">
                <Button size="lg" variant="outline" asChild disabled={isParsingFile}>
                  <span>{isParsingFile ? "Parsing..." : "Upload Resume"}</span>
                </Button>
              </label>
            </div>
            
            {/* Parsing status */}
            {isParsingFile && (
              <div className="w-full max-w-md mb-4 p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-700 dark:border-yellow-300"></div>
                  <p className="font-medium">Extracting text from your file...</p>
                </div>
              </div>
            )}
            
            {/* Show uploaded file status */}
            {resumeFile && !isParsingFile && resumeText && (
              <>
                <div className="w-full max-w-md mb-4 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <CheckCircle2 className="w-5 h-5" />
                    <div className="flex-1 text-left">
                      <p className="font-medium">Resume parsed successfully</p>
                      <p className="text-sm">{resumeFile.name} • {resumeText.length.toLocaleString()} characters extracted</p>
                    </div>
                  </div>
                </div>
                
                {/* What Happens Next Info - Shows after successful parsing */}
                <div className="w-full max-w-md mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-left">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What happens next?</h3>
                  <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-decimal list-inside">
                    <li>I'll analyze your resume</li>
                    <li>You'll answer 25 questions about your experience</li>
                    <li>I'll build your War Chest with power phrases, skills, and hidden competencies</li>
                    <li>Use your War Chest to supercharge job applications and interviews</li>
                  </ol>
                </div>
              </>
            )}
            
            <div className="w-full max-w-md">
              <Textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Or paste your resume text here..."
                className="min-h-[200px] mb-2"
                disabled={isParsingFile}
              />
              {resumeText && (
                <p className="text-xs text-muted-foreground text-right mb-4">
                  {resumeText.length.toLocaleString()} characters
                </p>
              )}
              <Button 
                onClick={handleAnalyzeResume} 
                size="lg" 
                className="w-full"
                disabled={!resumeText || isParsingFile}
              >
                {resumeText ? "Start Building My War Chest" : "Add your resume to continue"}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2: Analyzing */}
      {step === 'analyzing' && (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            <div className="animate-pulse mb-4">
              <Briefcase className="w-16 h-16 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">Analyzing Your Resume...</h2>
            <p className="text-muted-foreground">
              I'm reading through your experience and preparing personalized questions
            </p>
          </div>
        </Card>
      )}

      {/* Step 3: Interview */}
      {step === 'interview' && (
        <Card className="p-8">
          <div className="mb-6">
            <Badge className="mb-2">{interviewPhase.title}</Badge>
            <h2 className="text-2xl font-semibold mb-2">{interviewPhase.description}</h2>
            <p className="text-muted-foreground text-sm">
              Question {Math.round((completionPercentage / 100) * 25)} of 25
            </p>
          </div>

          {aiTyping ? (
            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg mb-4">
              <div className="animate-pulse">Assistant is typing...</div>
            </div>
          ) : (
            <>
              <div className="p-4 bg-muted rounded-lg mb-4">
                <p className="text-lg">{interviewPhase.questions[0]}</p>
              </div>

              <Textarea
                value={currentResponse}
                onChange={(e) => setCurrentResponse(e.target.value)}
                placeholder="Share your experience here..."
                className="min-h-[150px] mb-4"
              />

              <div className="flex gap-3">
                <Button onClick={handleSubmitResponse} size="lg" className="flex-1">
                  Submit Answer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => loadNextQuestion(warChestId!)}
                >
                  Skip
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Step 4: Building War Chest */}
      {step === 'building' && (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            {aiTyping ? (
              <>
                <div className="animate-pulse mb-4">
                  <Target className="w-16 h-16 text-primary" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Building Your War Chest...</h2>
                <p className="text-muted-foreground">
                  Creating power phrases, mapping transferable skills, and discovering hidden competencies
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Your War Chest is Ready!</h2>
                <p className="text-muted-foreground mb-6">
                  You now have a complete career intelligence system. Let's put it to work.
                </p>
                <div className="flex gap-3">
                  <Button size="lg" onClick={() => navigate('/agents/resume-builder')}>
                    Build Custom Resume
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/war-chest-dashboard')}>
                    View War Chest
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default function CorporateAssistant() {
  return (
    <ProtectedRoute>
      <CorporateAssistantContent />
    </ProtectedRoute>
  );
}
