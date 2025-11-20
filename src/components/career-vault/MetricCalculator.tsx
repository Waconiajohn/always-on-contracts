import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, ArrowRight, Sparkles } from 'lucide-react';

interface MetricCalculatorProps {
  open: boolean;
  onClose: () => void;
  onSave: (metricText: string, metricType: string) => void;
  initialText?: string;
}

export function MetricCalculator({ open, onClose, onSave, initialText = '' }: MetricCalculatorProps) {
  const [activeTab, setActiveTab] = useState('improvement');
  
  // Improvement State
  const [beforeValue, setBeforeValue] = useState('');
  const [afterValue, setAfterValue] = useState('');
  const [metricUnit, setMetricUnit] = useState('%');
  
  // Scale State
  const [teamSize, setTeamSize] = useState('');
  const [budget, setBudget] = useState('');
  const [volume, setVolume] = useState('');
  const [frequency, setFrequency] = useState('Annual');

  // Efficiency State
  const [hoursSaved, setHoursSaved] = useState('');
  const [peopleCount, setPeopleCount] = useState('');
  const [hourlyRate, setHourlyRate] = useState('50'); // Default assume $50/hr

  const generateResult = () => {
    switch (activeTab) {
      case 'improvement':
        if (!beforeValue || !afterValue) return null;
        const before = parseFloat(beforeValue);
        const after = parseFloat(afterValue);
        if (isNaN(before) || isNaN(after)) return null;
        
        const diff = after - before;
        const percentChange = ((diff / before) * 100).toFixed(0);
        
        if (metricUnit === '%') {
            return `Improved performance by ${percentChange}% (from ${before}% to ${after}%)`;
        }
        return `Increased output by ${diff} ${metricUnit} (from ${before} to ${after})`;

      case 'scale':
        const parts = [];
        if (teamSize) parts.push(`managed a team of ${teamSize}`);
        if (budget) parts.push(`oversaw a $${budget} budget`);
        if (volume) parts.push(`handled ${volume} transactions ${frequency.toLowerCase()}`);
        
        if (parts.length === 0) return null;
        return `Scaled operations: ${parts.join(', ')}`;

      case 'efficiency':
        if (!hoursSaved || !peopleCount) return null;
        const hours = parseFloat(hoursSaved);
        const people = parseFloat(peopleCount);
        const rate = parseFloat(hourlyRate);
        
        const totalHours = hours * people * 52; // Annual
        const savings = (totalHours * rate).toLocaleString();
        
        return `Saved ${totalHours.toLocaleString()} hours annually, equivalent to $${savings} in operational costs`;
    }
    return null;
  };

  const result = generateResult();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Metric Calculator
          </DialogTitle>
          <DialogDescription>
            Quantify your impact. Numbers make your achievements up to 40% more credible.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="improvement">Improvement</TabsTrigger>
            <TabsTrigger value="scale">Scale</TabsTrigger>
            <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          </TabsList>

          <TabsContent value="improvement" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Before</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 10" 
                  value={beforeValue}
                  onChange={(e) => setBeforeValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>After</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 15" 
                  value={afterValue}
                  onChange={(e) => setAfterValue(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={metricUnit} onValueChange={setMetricUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="%">Percentage (%)</SelectItem>
                  <SelectItem value="M">Millions (M)</SelectItem>
                  <SelectItem value="k">Thousands (k)</SelectItem>
                  <SelectItem value="units">Units</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="scale" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Team Size</Label>
              <Input 
                type="number" 
                placeholder="Number of direct/indirect reports" 
                value={teamSize}
                onChange={(e) => setTeamSize(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Budget Managed</Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input 
                  className="pl-7"
                  placeholder="Annual budget amount" 
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hours Saved / Week</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 5" 
                  value={hoursSaved}
                  onChange={(e) => setHoursSaved(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>People Impacted</Label>
                <Input 
                  type="number" 
                  placeholder="e.g. 10" 
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Calculates annual savings assuming $50/hr avg cost per employee.
            </p>
          </TabsContent>
        </Tabs>

        {result && (
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 mt-4">
            <div className="flex items-center gap-2 mb-2 text-primary font-medium">
              <Sparkles className="h-4 w-4" />
              Generated Impact Statement
            </div>
            <p className="text-lg font-semibold">{result}</p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={() => result && onSave(result, activeTab)} 
            disabled={!result}
          >
            Use This Metric
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
