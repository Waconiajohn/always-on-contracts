import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Coffee, Laptop, Users, TrendingUp } from "lucide-react";

const DailyWorkflow = () => {
  return (
    <div className="min-h-screen flex w-full">
      <div className="flex-1">
        <div className="container py-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">Your Daily Job Search Workflow</h1>
            <p className="text-muted-foreground text-lg">
              A proven daily routine to maximize results in your job search
            </p>
          </div>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <TrendingUp className="h-6 w-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Success Metrics to Track</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Applications This Week</p>
                      <Badge variant="outline">Target: 10-15</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Networking Contacts</p>
                      <Badge variant="outline">Target: 25-50</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">LinkedIn Posts</p>
                      <Badge variant="outline">Target: 4/week</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Interview Conversion</p>
                      <Badge variant="outline">Target: 15%</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <div className="flex items-center gap-2">
              <Coffee className="h-5 w-5" />
              <h2 className="text-2xl font-bold">Morning Routine (60-90 min)</h2>
            </div>
            <Separator className="flex-1" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Job Discovery</CardTitle>
                  <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />30 min</Badge>
                </div>
                <CardDescription>Find and queue new opportunities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox id="job-1" />
                  <label htmlFor="job-1" className="text-sm leading-relaxed">
                    Review AI-matched jobs on Job Board
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="job-2" />
                  <label htmlFor="job-2" className="text-sm leading-relaxed">
                    Add 5-10 interesting jobs to Active Applications
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="job-3" />
                  <label htmlFor="job-3" className="text-sm leading-relaxed">
                    AI generates custom resumes for each automatically
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Application Review</CardTitle>
                  <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />20 min</Badge>
                </div>
                <CardDescription>Review and approve applications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox id="app-1" />
                  <label htmlFor="app-1" className="text-sm leading-relaxed">
                    Review Active Applications
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="app-2" />
                  <label htmlFor="app-2" className="text-sm leading-relaxed">
                    Approve 3-5 custom resumes
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="app-3" />
                  <label htmlFor="app-3" className="text-sm leading-relaxed">
                    Submit applications
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Networking Research</CardTitle>
                  <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />10 min</Badge>
                </div>
                <CardDescription>Prepare for outreach</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox id="net-1" />
                  <label htmlFor="net-1" className="text-sm leading-relaxed">
                    For each application submitted, identify hiring manager on LinkedIn
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="net-2" />
                  <label htmlFor="net-2" className="text-sm leading-relaxed">
                    Find 2-3 decision-makers per job
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="net-3" />
                  <label htmlFor="net-3" className="text-sm leading-relaxed">
                    Save contact info in Projects
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <div className="flex items-center gap-2">
              <Laptop className="h-5 w-5" />
              <h2 className="text-2xl font-bold">Midday Content (Monday-Thursday Only)</h2>
            </div>
            <Separator className="flex-1" />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>LinkedIn Blogging</CardTitle>
                <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />30 min</Badge>
              </div>
              <CardDescription>Build thought leadership and visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2">
                <Checkbox id="blog-1" />
                <label htmlFor="blog-1" className="text-sm leading-relaxed">
                  Generate post from Career Vault insights
                </label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="blog-2" />
                <label htmlFor="blog-2" className="text-sm leading-relaxed">
                  Post to your LinkedIn profile
                </label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="blog-3" />
                <label htmlFor="blog-3" className="text-sm leading-relaxed">
                  Share in 15 relevant groups
                </label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="blog-4" />
                <label htmlFor="blog-4" className="text-sm leading-relaxed">
                  Engage with comments throughout the day
                </label>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <h2 className="text-2xl font-bold">Afternoon Networking (60 min)</h2>
            </div>
            <Separator className="flex-1" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Direct Outreach</CardTitle>
                  <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />45 min</Badge>
                </div>
                <CardDescription>Network jobs into companies</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox id="out-1" />
                  <label htmlFor="out-1" className="text-sm leading-relaxed">
                    Pull up Projects with recent applications
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="out-2" />
                  <label htmlFor="out-2" className="text-sm leading-relaxed">
                    Send LinkedIn connection requests (use Communication Templates)
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="out-3" />
                  <label htmlFor="out-3" className="text-sm leading-relaxed">
                    Send personalized emails
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="out-4" />
                  <label htmlFor="out-4" className="text-sm leading-relaxed">
                    Document outreach in Projects
                  </label>
                </div>
                <Badge className="mt-2">Target: 5-10 new contacts/day</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Follow-Up</CardTitle>
                  <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />15 min</Badge>
                </div>
                <CardDescription>Stay top of mind</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox id="follow-1" />
                  <label htmlFor="follow-1" className="text-sm leading-relaxed">
                    Review Projects for pending follow-ups
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="follow-2" />
                  <label htmlFor="follow-2" className="text-sm leading-relaxed">
                    Send follow-up messages (3-5 days after initial contact)
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="follow-3" />
                  <label htmlFor="follow-3" className="text-sm leading-relaxed">
                    Track responses and next actions
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <h2 className="text-2xl font-bold">Weekly Tasks</h2>
            <Separator className="flex-1" />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Friday: Interview Prep (if scheduled)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox id="fri-1" />
                  <label htmlFor="fri-1" className="text-sm leading-relaxed">
                    Pull job + resume from Projects
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="fri-2" />
                  <label htmlFor="fri-2" className="text-sm leading-relaxed">
                    Use Interview Prep Agent
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="fri-3" />
                  <label htmlFor="fri-3" className="text-sm leading-relaxed">
                    Practice with AI coaching
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Friday: Pipeline Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <Checkbox id="review-1" />
                  <label htmlFor="review-1" className="text-sm leading-relaxed">
                    Review all active Projects
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="review-2" />
                  <label htmlFor="review-2" className="text-sm leading-relaxed">
                    Update application statuses
                  </label>
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox id="review-3" />
                  <label htmlFor="review-3" className="text-sm leading-relaxed">
                    Plan next week's targets
                  </label>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyWorkflow;
