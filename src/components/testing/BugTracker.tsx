import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Bug, AlertCircle } from 'lucide-react';

interface BugReport {
  id: string;
  title: string;
  description: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  category: string;
  status: 'open' | 'in-progress' | 'fixed' | 'wontfix';
  createdAt: Date;
}

export function BugTracker() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBug, setNewBug] = useState({
    title: '',
    description: '',
    severity: 'P2' as const,
    category: 'master-resume'
  });

  const addBug = () => {
    const bug: BugReport = {
      id: Date.now().toString(),
      ...newBug,
      status: 'open',
      createdAt: new Date()
    };
    setBugs([bug, ...bugs]);
    setNewBug({
      title: '',
      description: '',
      severity: 'P2',
      category: 'master-resume'
    });
    setDialogOpen(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'P0': return 'destructive';
      case 'P1': return 'default';
      case 'P2': return 'secondary';
      case 'P3': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'P0': return 'Blocker';
      case 'P1': return 'High';
      case 'P2': return 'Medium';
      case 'P3': return 'Low';
      default: return severity;
    }
  };

  const updateBugStatus = (id: string, status: BugReport['status']) => {
    setBugs(bugs.map(bug => bug.id === id ? { ...bug, status } : bug));
  };

  const p0Count = bugs.filter(b => b.severity === 'P0' && b.status === 'open').length;
  const p1Count = bugs.filter(b => b.severity === 'P1' && b.status === 'open').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5" />
              Bug Tracker
            </CardTitle>
            <CardDescription>
              Track and manage bugs found during QA testing
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Report Bug
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report New Bug</DialogTitle>
                <DialogDescription>
                  Document a bug found during testing
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bug-title">Title</Label>
                  <Input
                    id="bug-title"
                    value={newBug.title}
                    onChange={(e) => setNewBug({ ...newBug, title: e.target.value })}
                    placeholder="Brief description of the bug"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bug-severity">Severity</Label>
                  <Select
                    value={newBug.severity}
                    onValueChange={(value: any) => setNewBug({ ...newBug, severity: value })}
                  >
                    <SelectTrigger id="bug-severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P0">P0 - Blocker (prevents core functionality)</SelectItem>
                      <SelectItem value="P1">P1 - High (major feature broken)</SelectItem>
                      <SelectItem value="P2">P2 - Medium (minor issue)</SelectItem>
                      <SelectItem value="P3">P3 - Low (cosmetic)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bug-category">Category</Label>
                  <Select
                    value={newBug.category}
                    onValueChange={(value) => setNewBug({ ...newBug, category: value })}
                  >
                    <SelectTrigger id="bug-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="master-resume">Master Resume</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="search">Search</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="performance">Performance</SelectItem>
                      <SelectItem value="ui">UI/UX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bug-description">Description</Label>
                  <Textarea
                    id="bug-description"
                    value={newBug.description}
                    onChange={(e) => setNewBug({ ...newBug, description: e.target.value })}
                    placeholder="Steps to reproduce, expected vs actual behavior..."
                    rows={6}
                  />
                </div>

                <Button onClick={addBug} className="w-full">
                  Submit Bug Report
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bug Summary */}
        {bugs.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium">{p0Count} P0 Blockers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{p1Count} P1 High Priority</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {bugs.filter(b => b.status === 'fixed').length} Fixed
              </span>
            </div>
          </div>
        )}

        {/* Bug List */}
        <div className="space-y-3">
          {bugs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bug className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>No bugs reported yet</p>
              <p className="text-sm">Click "Report Bug" to document issues</p>
            </div>
          ) : (
            bugs.map((bug) => (
              <Card key={bug.id} className="hover:bg-accent transition-colors">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant={getSeverityColor(bug.severity)}>
                            {getSeverityLabel(bug.severity)}
                          </Badge>
                          <Badge variant="outline">{bug.category}</Badge>
                          <Badge
                            variant={bug.status === 'fixed' ? 'default' : 'secondary'}
                          >
                            {bug.status}
                          </Badge>
                        </div>
                        <h4 className="font-medium">{bug.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {bug.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Reported {bug.createdAt.toLocaleString()}
                        </p>
                      </div>
                      <Select
                        value={bug.status}
                        onValueChange={(value: any) => updateBugStatus(bug.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="fixed">Fixed</SelectItem>
                          <SelectItem value="wontfix">Won't Fix</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
