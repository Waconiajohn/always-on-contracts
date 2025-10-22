import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Beaker, Sparkles, Rocket, Lock } from "lucide-react";

const upcomingFeatures = [
  {
    id: 1,
    title: "AI Resume Video Generator",
    description: "Create compelling video resumes with AI-generated scripts and animations",
    status: "In Development",
    eta: "Q2 2025"
  },
  {
    id: 2,
    title: "Interview Simulator VR",
    description: "Practice interviews in immersive virtual reality environments",
    status: "Research Phase",
    eta: "Q3 2025"
  },
  {
    id: 3,
    title: "Career Path Predictor",
    description: "AI-powered predictions of optimal career trajectories based on your skills",
    status: "Beta Testing",
    eta: "Q1 2025"
  },
  {
    id: 4,
    title: "Salary Negotiation Bot",
    description: "Real-time coaching during salary negotiations with data-driven insights",
    status: "Planning",
    eta: "Q4 2025"
  }
];

export default function ExperimentalLab() {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Beaker className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Experimental Lab</h1>
            <p className="text-muted-foreground">
              Preview upcoming features and cutting-edge career technology
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>Feature Preview</CardTitle>
              </div>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
            <CardDescription>
              These experimental features are under active development. Sign up for early access to be notified when they launch.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {upcomingFeatures.map((feature) => (
            <Card key={feature.id} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {feature.description}
                    </CardDescription>
                  </div>
                  <Lock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Badge variant={
                      feature.status === 'Beta Testing' ? 'default' : 
                      feature.status === 'In Development' ? 'secondary' : 
                      'outline'
                    }>
                      {feature.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground">ETA: {feature.eta}</p>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    <Rocket className="mr-2 h-4 w-4" />
                    Notify Me
                  </Button>
                </div>
              </CardContent>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Want to Influence Our Roadmap?</CardTitle>
            <CardDescription>
              Join our beta testing program to get early access to new features and help shape the future of CareerCoPilot Pro.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full sm:w-auto">
              <Sparkles className="mr-2 h-4 w-4" />
              Join Beta Program
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
