import React, { useState } from "react";
import { GapAction, GapChecklist as GapChecklistType } from "@/lib/types/benchmark";
import { AlertCircle, Zap, BookOpen, CheckCircle2 } from "lucide-react";

interface GapChecklistProps {
  gapChecklist: GapChecklistType;
  onActionClick: (gapId: string) => void;
}

export function GapChecklist({ gapChecklist, onActionClick }: GapChecklistProps) {
  const [expandedGapId, setExpandedGapId] = useState<string | null>(null);
  const [completedGaps, setCompletedGaps] = useState<Set<string>>(new Set());

  const getSeverityColor = (severity: string) => {
    if (severity === "high") return "border-red-300 bg-red-50";
    if (severity === "medium") return "border-yellow-300 bg-yellow-50";
    return "border-blue-300 bg-blue-50";
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === "high") return <AlertCircle className="text-red-600" size={20} />;
    if (severity === "medium") return <Zap className="text-yellow-600" size={20} />;
    return <BookOpen className="text-blue-600" size={20} />;
  };

  const toggleCompleted = (gapId: string) => {
    const newSet = new Set(completedGaps);
    if (newSet.has(gapId)) {
      newSet.delete(gapId);
    } else {
      newSet.add(gapId);
    }
    setCompletedGaps(newSet);
  };

  if (gapChecklist.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <p className="text-gray-600 text-center">No gaps identified. Your resume is well-aligned!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-semibold mb-6">Areas to Improve</h2>
      <p className="text-sm text-gray-600 mb-4">{gapChecklist.length} gaps identified</p>

      <div className="space-y-4">
        {gapChecklist.map((gap) => (
          <div
            key={gap.id}
            className={`border rounded-lg p-4 cursor-pointer transition ${getSeverityColor(gap.severity)}`}
            onClick={() => setExpandedGapId(expandedGapId === gap.id ? null : gap.id)}
          >
            <div className="flex items-start gap-3">
              {getSeverityIcon(gap.severity)}

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{gap.issue}</h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompleted(gap.id);
                    }}
                    className="ml-auto"
                  >
                    <CheckCircle2
                      size={20}
                      className={completedGaps.has(gap.id) ? "text-green-600" : "text-gray-400"}
                    />
                  </button>
                </div>
                <p className="text-sm text-gray-700 mt-1">{gap.impact}</p>

                {expandedGapId === gap.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <p className="text-sm text-gray-700">{gap.actionDescription}</p>

                    {gap.suggestedBullet && (
                      <div className="bg-white rounded p-3 border border-gray-300">
                        <p className="text-xs font-medium text-gray-600 mb-2">Suggested fix:</p>
                        <p className="text-sm text-gray-900">"{gap.suggestedBullet}"</p>
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onActionClick(gap.id);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700"
                    >
                      {gap.action === "add" && "Add"}
                      {gap.action === "strengthen" && "Strengthen"}
                      {gap.action === "reorganize" && "Reorganize"}
                      {gap.action === "add-new-bullet" && "Generate Bullet"}
                      {gap.action === "remove" && "Remove"}
                    </button>

                    {gap.alternatives && gap.alternatives.length > 0 && (
                      <div className="text-xs">
                        <p className="font-medium text-gray-600 mb-2">Alternative approaches:</p>
                        <ul className="space-y-1">
                          {gap.alternatives.map((alt, idx) => (
                            <li key={idx} className="text-gray-700 pl-4">• {alt.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
