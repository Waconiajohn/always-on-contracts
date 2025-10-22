import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CheckCircle, AlertCircle, Sparkles, Check, HelpCircle, Star, Clock, ChevronDown } from "lucide-react";

interface RequirementFilterViewProps {
  categorizedRequirements: {
    autoHandled: any[];
    needsInput: any[];
    optionalEnhancement: any[];
  };
  onContinue: (mode: 'required' | 'all' | 'skip_to_generate') => void;
}

export const RequirementFilterView = ({ 
  categorizedRequirements, 
  onContinue 
}: RequirementFilterViewProps) => {
  const { autoHandled, needsInput, optionalEnhancement } = categorizedRequirements;
  
  const estimatedTime = needsInput.length * 2;
  const optionalTime = optionalEnhancement.length * 2;
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Smart Requirement Analysis</h2>
        <p className="text-muted-foreground">
          We've analyzed your Career Vault against this job. Here's what we found:
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Auto-Handled ({autoHandled.length} requirements)
          </CardTitle>
          <CardDescription>
            Your Career Vault has strong matches for these. We'll use them automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {autoHandled.length === 0 ? (
            <p className="text-sm text-muted-foreground">No auto-handled requirements</p>
          ) : (
            autoHandled.map((req, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800"
              >
                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                <span className="text-sm flex-1">{req.text}</span>
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                  {req.coverage}% match
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            Needs Your Input ({needsInput.length} requirements)
          </CardTitle>
          <CardDescription>
            We'll ask you a few quick questions to create the best content for these.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {needsInput.length === 0 ? (
            <p className="text-sm text-muted-foreground">No requirements need input</p>
          ) : (
            needsInput.map((req, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800"
              >
                <HelpCircle className="h-4 w-4 text-orange-600 flex-shrink-0" />
                <span className="text-sm flex-1">{req.text}</span>
                <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                  {req.coverage}% match
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      
      {optionalEnhancement.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-600">
              <Sparkles className="h-5 w-5" />
              Optional Enhancements ({optionalEnhancement.length} standards)
            </CardTitle>
            <CardDescription>
              Industry best practices. You can tackle these or skip to auto-generate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Collapsible>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm hover:underline">
                <ChevronDown className="h-4 w-4" />
                Show optional enhancements
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-3">
                {optionalEnhancement.map((req, index) => (
                  <div 
                    key={index} 
                    className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800"
                  >
                    <Star className="h-4 w-4 text-purple-600 flex-shrink-0" />
                    <span className="text-sm flex-1">{req.text}</span>
                    <Badge variant="outline" className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                      Industry standard
                    </Badge>
                  </div>
                ))}
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      )}
      
      <Alert>
        <Clock className="h-4 w-4" />
        <AlertTitle>Time Estimate</AlertTitle>
        <AlertDescription>
          <div className="space-y-1 mt-2">
            <div className="flex items-center justify-between">
              <span>Required items ({needsInput.length} requirements):</span>
              <span className="font-semibold">~{estimatedTime} minutes</span>
            </div>
            {optionalEnhancement.length > 0 && (
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Optional enhancements:</span>
                <span>+{optionalTime} minutes more</span>
              </div>
            )}
          </div>
        </AlertDescription>
      </Alert>
      
      <div className="flex gap-3">
        <Button 
          onClick={() => onContinue('required')} 
          size="lg" 
          className="flex-1"
        >
          Start with Required Items
        </Button>
        <Button 
          onClick={() => onContinue('skip_to_generate')} 
          variant="outline" 
          size="lg"
        >
          Skip & Auto-Generate
        </Button>
      </div>
    </div>
  );
};
