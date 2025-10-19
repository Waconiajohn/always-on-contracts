import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, FileText, Target, Award, Zap, Eye, Download } from "lucide-react";

interface AnalyticsData {
  totalResumes: number;
  totalApplications: number;
  responseRate: number;
  interviewRate: number;
  avgATSScore: number;
  topTemplate: string;
  topPersona: string;
  recentActivity: Array<{
    date: string;
    action: string;
    details: string;
  }>;
  templatePerformance: Array<{
    name: string;
    usage: number;
    successRate: number;
  }>;
  keywordEffectiveness: Array<{
    keyword: string;
    frequency: number;
    impact: number;
  }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
  loading?: boolean;
}

export function AnalyticsDashboard({ data, loading }: AnalyticsDashboardProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (value: number) => {
    if (value >= 50) return <TrendingUp className="w-4 h-4 text-success" />;
    return <TrendingDown className="w-4 h-4 text-destructive" />;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resumes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalResumes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Versions created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalApplications}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Jobs applied to
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {data.responseRate}%
              {getTrendIcon(data.responseRate)}
            </div>
            <Progress value={data.responseRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Rate</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {data.interviewRate}%
              {getTrendIcon(data.interviewRate)}
            </div>
            <Progress value={data.interviewRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          {/* ATS Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Average ATS Score</CardTitle>
              <CardDescription>
                How well your resumes match job requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-bold">{data.avgATSScore}%</span>
                  <Badge variant={data.avgATSScore >= 80 ? "default" : "secondary"}>
                    {data.avgATSScore >= 80 ? "Excellent" : data.avgATSScore >= 60 ? "Good" : "Needs Work"}
                  </Badge>
                </div>
                <Progress value={data.avgATSScore} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {data.avgATSScore >= 80
                    ? "Your resumes are highly optimized for ATS systems"
                    : data.avgATSScore >= 60
                    ? "Good optimization, but there's room for improvement"
                    : "Consider optimizing keywords and formatting"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Template Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Template Performance</CardTitle>
              <CardDescription>
                Success rates by template
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.templatePerformance.map((template, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{template.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{template.usage} uses</span>
                      <Badge variant="outline">{template.successRate}% success</Badge>
                    </div>
                  </div>
                  <Progress value={template.successRate} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Keyword Effectiveness */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Keyword Effectiveness</CardTitle>
              <CardDescription>
                Most impactful keywords in your resumes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.keywordEffectiveness.map((keyword, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-medium">{keyword.keyword}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {keyword.frequency}× used
                    </span>
                    <Badge variant={keyword.impact >= 80 ? "default" : "secondary"}>
                      {keyword.impact}% impact
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI-Driven Insights</CardTitle>
              <CardDescription>
                Personalized recommendations to improve your success rate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <TrendingUp className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Top Performing Template</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your <strong>{data.topTemplate}</strong> template has the highest success rate.
                      Consider using it for important applications.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                  <Award className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Best Persona Match</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      The <strong>{data.topPersona}</strong> persona generates the most responses.
                      Use it for roles requiring this communication style.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                  <Target className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Application Strategy</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your response rate is {data.responseRate >= 30 ? "above" : "below"} industry average (30%).
                      {data.responseRate < 30 && " Consider customizing more keywords for each role."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/50">
                  <Zap className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Optimization Tip</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Resumes with ATS scores above 80% get {Math.round((data.avgATSScore / 50) * 100)}% more responses.
                      Focus on keyword matching and formatting.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest resume-related actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivity.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No recent activity
                  </p>
                ) : (
                  data.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-0">
                      <div className="mt-1">
                        {activity.action.includes("download") ? (
                          <Download className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{activity.action}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {activity.details}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(activity.date).toLocaleDateString()} at{" "}
                          {new Date(activity.date).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
