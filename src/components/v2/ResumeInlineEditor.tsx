import { MatchScoreBreakdown } from "@/lib/types/benchmark";
import { Copy, Download } from "lucide-react";

interface ResumeInlineEditorProps {
  resumeText: string;
  onChange: (text: string) => void;
  scoreBreakdown?: MatchScoreBreakdown;
}

export function ResumeInlineEditor({
  resumeText,
  onChange,
  scoreBreakdown,
}: ResumeInlineEditorProps) {
  const handleCopy = () => {
    navigator.clipboard.writeText(resumeText);
    alert("Resume copied to clipboard!");
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([resumeText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "tailored-resume.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Your Resume</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            <Copy size={16} /> Copy
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
          >
            <Download size={16} /> Download
          </button>
        </div>
      </div>

      <textarea
        value={resumeText}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Your resume will appear here..."
      />

      {scoreBreakdown && scoreBreakdown.categories.keywords.matched.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-medium text-blue-800 mb-2">Matched Keywords:</p>
          <div className="flex flex-wrap gap-1">
            {scoreBreakdown.categories.keywords.matched.map((keyword, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-200 text-blue-800 text-xs rounded">
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-2">
        Edit your resume directly. Changes will be reflected in your score.
      </p>
    </div>
  );
}
