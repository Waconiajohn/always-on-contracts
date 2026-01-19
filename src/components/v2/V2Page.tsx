import React, { useState } from "react";
import { BenchmarkPanel } from "./BenchmarkPanel";
import { MatchScoreDisplay } from "./MatchScoreDisplay";
import { GapChecklist } from "./GapChecklist";
import { ResumeInlineEditor } from "./ResumeInlineEditor";
import { useResumeTailoring } from "@/hooks/useResumeTailoring";

export default function V2Page() {
  const { state, analyzeJob, updateResume, applyGapAction, exportResume } =
    useResumeTailoring();

  const [resumeInput, setResumeInput] = useState("");
  const [jdInput, setJdInput] = useState("");

  const handleAnalyze = async () => {
    await analyzeJob(resumeInput, jdInput);
  };

  const handleResumeChange = (text: string) => {
    setResumeInput(text);
    updateResume(text);
  };

  // Render upload form if no analysis yet
  if (!state.benchmark) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Tailor Your Resume</h1>
          <p className="text-gray-600 mb-8">
            Upload your resume and target job description to see how well they match and get AI-powered suggestions.
          </p>

          <div className="bg-white rounded-lg border border-gray-200 p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Your Resume</label>
              <textarea
                value={resumeInput}
                onChange={(e) => setResumeInput(e.target.value)}
                className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste your resume here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Job Description</label>
              <textarea
                value={jdInput}
                onChange={(e) => setJdInput(e.target.value)}
                className="w-full h-48 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Paste the job description here..."
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={state.loading !== "idle" || !resumeInput.trim() || !jdInput.trim()}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.loading !== "idle" ? `Analyzing (${state.loading})...` : "Analyze"}
            </button>

            {state.error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{state.error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render main analysis view
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Resume Analysis</h1>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Start Over
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Benchmark */}
        <div className="lg:col-span-1">
          {state.benchmark && <BenchmarkPanel benchmark={state.benchmark} />}
        </div>

        {/* Center Column: Resume Editor */}
        <div className="lg:col-span-2">
          <ResumeInlineEditor
            resumeText={state.resume}
            onChange={handleResumeChange}
            benchmark={state.benchmark}
            scoreBreakdown={state.scoreBreakdown || undefined}
          />

          <button
            onClick={exportResume}
            className="w-full mt-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
          >
            Export Tailored Resume
          </button>
        </div>

        {/* Right Column: Score + Gaps */}
        <div className="lg:col-span-1">
          {state.scoreBreakdown && (
            <MatchScoreDisplay
              scoreBreakdown={state.scoreBreakdown}
              onRefresh={() => updateResume(state.resume)}
            />
          )}

          {state.gapChecklist && (
            <GapChecklist
              gapChecklist={state.gapChecklist}
              onActionClick={applyGapAction}
            />
          )}
        </div>
      </div>
    </div>
  );
}
