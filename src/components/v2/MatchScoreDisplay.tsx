import { MatchScoreBreakdown } from "@/lib/types/benchmark";

interface MatchScoreDisplayProps {
  scoreBreakdown: MatchScoreBreakdown;
  onRefresh?: () => void;
}

export function MatchScoreDisplay({ scoreBreakdown, onRefresh }: MatchScoreDisplayProps) {
  const score = scoreBreakdown.overallScore;
  const scoreColor = score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600";
  const scoreBgColor = score >= 80 ? "bg-green-50" : score >= 60 ? "bg-yellow-50" : "bg-red-50";

  const getTier = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Strong";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    return "Needs Work";
  };

  return (
    <div className={`rounded-lg border border-gray-200 p-6 mb-6 ${scoreBgColor}`}>
      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-semibold">Match Score</h2>
        <button
          onClick={onRefresh}
          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Refresh
        </button>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline gap-3">
          <span className={`text-5xl font-bold ${scoreColor}`}>{score}</span>
          <span className="text-xl text-gray-600">/ 100</span>
        </div>
        <p className={`text-lg font-medium mt-2 ${scoreColor}`}>{getTier(score)}</p>
      </div>

      <p className="text-sm text-gray-700 mb-6">{scoreBreakdown.scoreExplanation}</p>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Keywords</span>
            <span className="text-sm text-gray-600">{scoreBreakdown.categories.keywords.score}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded h-2">
            <div
              className="bg-blue-500 h-2 rounded"
              style={{ width: `${scoreBreakdown.categories.keywords.score}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Experience</span>
            <span className="text-sm text-gray-600">{scoreBreakdown.categories.experience.score}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded h-2">
            <div
              className="bg-blue-500 h-2 rounded"
              style={{ width: `${scoreBreakdown.categories.experience.score}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Accomplishments</span>
            <span className="text-sm text-gray-600">{scoreBreakdown.categories.accomplishments.score}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded h-2">
            <div
              className="bg-blue-500 h-2 rounded"
              style={{ width: `${scoreBreakdown.categories.accomplishments.score}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">ATS Compliance</span>
            <span className="text-sm text-gray-600">{scoreBreakdown.categories.atsCompliance.score}%</span>
          </div>
          <div className="w-full bg-gray-300 rounded h-2">
            <div
              className="bg-blue-500 h-2 rounded"
              style={{ width: `${scoreBreakdown.categories.atsCompliance.score}%` }}
            />
          </div>
        </div>
      </div>

      {scoreBreakdown.strengths.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <p className="text-sm font-medium text-gray-900 mb-2">Strengths:</p>
          <ul className="text-sm text-gray-700 space-y-1">
            {scoreBreakdown.strengths.map((strength, idx) => (
              <li key={idx}>✓ {strength}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
