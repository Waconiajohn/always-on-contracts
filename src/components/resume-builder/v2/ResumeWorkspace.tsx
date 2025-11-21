import { useState, useEffect } from "react";
import { LiveResumeCanvas } from "./LiveResumeCanvas";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useResumeBuilderStore } from "@/stores/resumeBuilderStore";
import { builderStateToCanonicalResume } from "@/lib/resumeSerialization";
import { CanonicalResume } from "@/lib/resumeModel";
import { SectionEditorPanel } from "./SectionEditorPanel";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { ChevronLeft, LayoutTemplate, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ResumeWorkspace() {
  const navigate = useNavigate();
  const store = useResumeBuilderStore();
  const [activeSectionKey, setActiveSectionKey] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("96ac1200-0e4e-4584-b1ec-5f93c2b94376"); // Default Executive
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [canonicalData, setCanonicalData] = useState<CanonicalResume | null>(null);
  
  // Sync store data to canonical format for the canvas
  useEffect(() => {
    // Mock user profile for now - in real app, fetch from auth
    const userProfile = {
      full_name: "John Doe", // Replace with real user data
      email: "john@example.com",
      phone: "(555) 123-4567",
      location: "New York, NY",
      linkedin: "linkedin.com/in/johndoe"
    };

    const sections = store.resumeSections.map((s: any) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      order: s.order,
      items: s.content || [] // Map content to items
    }));

    const canonical = builderStateToCanonicalResume({
      userProfile,
      sections: sections as any
    });
    setCanonicalData(canonical);
  }, [store.resumeSections]);

  const handleSectionClick = (sectionId: string) => {
    setActiveSectionKey(sectionId);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Bar */}
      <header className="h-16 border-b bg-card px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="font-semibold text-lg">Resume Workspace</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowTemplateModal(true)}>
            <LayoutTemplate className="h-4 w-4" />
            Templates
          </Button>
          <Button size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </header>

      {/* Main Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Cockpit (Editor) */}
        <aside className="w-[400px] border-r bg-muted/10 flex flex-col overflow-hidden shrink-0">
           {activeSectionKey ? (
             <SectionEditorPanel 
               sectionId={activeSectionKey} 
               onClose={() => setActiveSectionKey(null)} 
             />
           ) : (
             <div className="p-4">
               <h2 className="font-bold mb-4">Resume Overview</h2>
               <div className="space-y-2">
                 {store.resumeSections.map(section => (
                   <div 
                    key={section.id} 
                    className="p-3 bg-card border rounded cursor-pointer hover:border-primary"
                    onClick={() => setActiveSectionKey(section.id)}
                   >
                     {section.title}
                   </div>
                 ))}
               </div>
             </div>
           )}
        </aside>

        {/* Right Panel: Canvas (Preview) */}
        <main className="flex-1 bg-slate-100 dark:bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 overflow-auto p-8 flex justify-center">
             {canonicalData ? (
               <LiveResumeCanvas
                 resumeData={canonicalData}
                 templateId={selectedTemplateId}
                 activeSectionId={activeSectionKey || undefined}
                 onSectionClick={handleSectionClick}
                 scale={0.85}
               />
             ) : (
               <div className="flex items-center justify-center h-full text-muted-foreground">
                 Loading resume data...
               </div>
             )}
          </div>
        </main>
      </div>

      {canonicalData && (
        <TemplatePreviewModal
          open={showTemplateModal}
          onClose={() => setShowTemplateModal(false)}
          onSelectTemplate={setSelectedTemplateId}
          currentTemplateId={selectedTemplateId}
          resumeData={canonicalData}
        />
      )}
    </div>
  );
}
