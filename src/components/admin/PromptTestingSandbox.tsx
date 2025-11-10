import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { TestTube, Play, Clock, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function PromptTestingSandbox() {
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testMetrics, setTestMetrics] = useState<{
    tokens: number;
    latency: number;
    cost: number;
  } | null>(null);
  const { toast } = useToast();

  const handleTest = async () => {
    setIsTesting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock response
    setTestOutput('This is a test response from the AI model based on your input.');
    setTestMetrics({
      tokens: 250,
      latency: 1850,
      cost: 0.0025
    });
    
    setIsTesting(false);
    
    toast({
      title: 'Test completed',
      description: 'Check the output below for results.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="w-5 h-5" />
          Prompt Testing Sandbox
        </CardTitle>
        <CardDescription>
          Test prompt changes before deploying them
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="test-input">Test Input</Label>
          <Textarea
            id="test-input"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Enter test data or scenario..."
            className="min-h-[150px]"
          />
        </div>

        <Button
          onClick={handleTest}
          disabled={!testInput || isTesting}
          className="w-full"
        >
          <Play className="w-4 h-4 mr-2" />
          {isTesting ? 'Testing...' : 'Run Test'}
        </Button>

        {testMetrics && (
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <TestTube className="w-3 h-3" />
                Tokens Used
              </p>
              <p className="text-lg font-semibold">{testMetrics.tokens}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Latency
              </p>
              <p className="text-lg font-semibold">{testMetrics.latency}ms</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Cost
              </p>
              <p className="text-lg font-semibold">${testMetrics.cost.toFixed(4)}</p>
            </div>
          </div>
        )}

        {testOutput && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Test Output</Label>
              <Badge variant="secondary">Success</Badge>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <pre className="text-sm whitespace-pre-wrap">{testOutput}</pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
