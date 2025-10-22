interface VisualResumePreviewProps {
  contactInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
  };
  sections: Array<{
    id: string;
    type: string;
    title: string;
    content: any[];
  }>;
}

export const VisualResumePreview = ({ contactInfo, sections }: VisualResumePreviewProps) => {
  return (
    <div 
      className="bg-white text-black p-12 shadow-lg mx-auto overflow-auto"
      style={{
        width: '8.5in',
        minHeight: '11in',
        fontFamily: 'Arial, sans-serif',
        fontSize: '11pt',
      }}
    >
      {/* Header */}
      <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
        <h1 className="text-3xl font-bold mb-2">{contactInfo.name || 'Your Name'}</h1>
        <div className="text-sm text-gray-700">
          {contactInfo.email && <span>{contactInfo.email}</span>}
          {contactInfo.phone && <span> | {contactInfo.phone}</span>}
          {contactInfo.location && <span> | {contactInfo.location}</span>}
          {contactInfo.linkedin && <span> | {contactInfo.linkedin}</span>}
        </div>
      </div>
      
      {/* Sections */}
      {sections.map(section => (
        <div key={section.id} className="mb-4">
          <h2 className="text-base font-bold uppercase border-b border-gray-400 pb-1 mb-2">
            {section.title}
          </h2>
          
          {section.type === 'skills' ? (
            // Skills: comma-separated for ATS
            <div className="text-sm leading-relaxed">
              {section.content.map((item: any) => item.content).join(', ')}
            </div>
          ) : (
            // Other sections: bullets
            <div className="space-y-1 pl-4">
              {section.content.map((item: any, idx: number) => (
                <div key={idx} className="text-sm leading-relaxed">
                  • {item.content}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      
      {/* Empty state */}
      {sections.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>Your resume content will appear here</p>
        </div>
      )}
    </div>
  );
};
