import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Briefcase, FileText, MessageSquare, Users, 
  Linkedin, TrendingUp, Building2, DollarSign, 
  Target, Calculator, ArrowRight
} from "lucide-react";

export function ActionCenter() {
  const navigate = useNavigate();

  const renderActionCard = (title: string, description: string, icon: any, path: string, color: string) => {
    const Icon = icon;
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group"
        onClick={() => navigate(path)}
      >
        <CardHeader className="pb-2">
          <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          <div className="flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Open Tool <ArrowRight className="ml-1 h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Your Toolbox</h2>
      </div>

      <Tabs defaultValue="find" className="w-full">
        <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 space-x-2 mb-6 overflow-x-auto">
          <TabsTrigger value="find" className="px-6 py-2.5">Find & Apply</TabsTrigger>
          <TabsTrigger value="prepare" className="px-6 py-2.5">Prepare & Win</TabsTrigger>
          <TabsTrigger value="brand" className="px-6 py-2.5">Build Brand</TabsTrigger>
          <TabsTrigger value="foundation" className="px-6 py-2.5">Foundation</TabsTrigger>
        </TabsList>

        <TabsContent value="find" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderActionCard("Job Search", "Find opportunities with AI matching", Briefcase, "/job-search", "bg-blue-500")}
            {renderActionCard("Resume Builder", "Create tailored, ATS-optimized resumes", FileText, "/agents/resume-builder-wizard", "bg-indigo-500")}
            {renderActionCard("Agency Matcher", "Connect with top recruiters", Building2, "/agencies", "bg-slate-500")}
          </div>
        </TabsContent>

        <TabsContent value="prepare" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderActionCard("Interview Prep", "Practice with vault-powered responses", MessageSquare, "/agents/interview-prep", "bg-purple-500")}
            {renderActionCard("Salary Negotiation", "Market data and negotiation scripts", DollarSign, "/salary-negotiation", "bg-green-500")}
            {renderActionCard("Active Applications", "Track status and next steps", FileText, "/active-applications", "bg-orange-500")}
          </div>
        </TabsContent>

        <TabsContent value="brand" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderActionCard("LinkedIn Profile", "Optimize your professional presence", Linkedin, "/agents/linkedin-profile-builder", "bg-blue-600")}
            {renderActionCard("Content Creator", "Thought leadership and blogging", Linkedin, "/agents/linkedin-blogging", "bg-blue-400")}
            {renderActionCard("Networking Hub", "Build strategic connections", Users, "/agents/networking", "bg-teal-500")}
          </div>
        </TabsContent>

        <TabsContent value="foundation" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderActionCard("Career Vault", "Your intelligence foundation", Target, "/career-vault", "bg-rose-500")}
            {renderActionCard("Financial Planning", "Compensation and retirement analysis", Calculator, "/agents/financial-planning-assistant", "bg-emerald-600")}
            {renderActionCard("Career Trends", "Market intelligence insights", TrendingUp, "/agents/career-trends-scout", "bg-cyan-500")}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
