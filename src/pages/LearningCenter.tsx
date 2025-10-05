import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { BookOpen, Video, FileText, Search } from 'lucide-react';
import { useState } from 'react';

const LearningCenter = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    {
      title: 'Resume Writing',
      icon: FileText,
      resources: [
        { title: 'Crafting the Perfect Executive Summary', type: 'Article', coming: true },
        { title: 'ATS Optimization Techniques', type: 'Video', coming: true },
        { title: 'Power Verbs for Your Resume', type: 'Guide', coming: true }
      ]
    },
    {
      title: 'Interview Prep',
      icon: Video,
      resources: [
        { title: 'Behavioral Interview Mastery', type: 'Course', coming: true },
        { title: 'Technical Interview Strategies', type: 'Video', coming: true },
        { title: 'Salary Negotiation Tactics', type: 'Article', coming: true }
      ]
    },
    {
      title: 'Networking',
      icon: BookOpen,
      resources: [
        { title: 'LinkedIn Outreach Templates', type: 'Template', coming: true },
        { title: 'Building Your Professional Brand', type: 'Course', coming: true },
        { title: 'Effective Follow-Up Strategies', type: 'Guide', coming: true }
      ]
    }
  ];

  return (
    <div className="container py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Learning Center</h1>
        <p className="text-muted-foreground">
          Your career growth library - articles, courses, and resources
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-6">
        {categories.map((category) => (
          <Card key={category.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>{category.resources.length} resources available</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {category.resources.map((resource, idx) => (
                  <Card key={idx} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-medium text-sm">{resource.title}</h4>
                          {resource.coming && (
                            <Badge variant="secondary" className="text-xs">
                              Soon
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {resource.type}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LearningCenter;
