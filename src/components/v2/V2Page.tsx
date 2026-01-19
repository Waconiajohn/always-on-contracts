import React, { useState, useEffect, useCallback } from "react";
import { BenchmarkPanel } from "./BenchmarkPanel";
import { MatchScoreDisplay } from "./MatchScoreDisplay";
import { GapChecklist } from "./GapChecklist";
import { ResumeInlineEditor } from "./ResumeInlineEditor";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorAlert } from "./ErrorAlert";
import { useResumeTailoring } from "@/hooks/useResumeTailoring";

export default function V2Page() {
  const { state, analyzeJob, updateResume, applyGapAction, exportResume, reset } = useResumeTailoring();
  const [resumeInput, setResumeInput] = useState("");
  const [jdInput, setJdInput] = useState("");

  const handleAnalyze = useCallback(async () => {
    if (resumeInput.trim() && jdInput.trim()) {
      await analyzeJob(resumeInput, jdInput);
    }
  }, [resumeInput, jdInput, analyzeJob]);

  const handleResumeChange = useCallback((text: string) => {
    setResumeInput(text);
    updateResume(text);
  }, [updateResume]);

  const handleStartOver = useCallback(() => {
    reset();
    setResumeInput("");
    setJdInput("");
  }, [reset]);

  const getLoadingMessage = () => {
    switch (state.loading) {
      case "analyzing":
        return "Analyzing job description and generating benchmark...";
      case "scoring":
        return "Scoring your resume against the benchmark...";
      case "generating-gaps":
        return "Identifying gaps and generating suggestions...";
      default:
        return "Loading...";
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to analyze (when on upload form)
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !state.benchmark) {
        e.preventDefault();
        handleAnalyze();
      }
      // Ctrl/Cmd + E to export (when analysis is complete)
      if ((e.ctrlKey || e.metaKey) && e.key === "e" && state.benchmark) {
        e.preventDefault();
        exportResume();
      }
      // Ctrl/Cmd + R to refresh score (when analysis is complete)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "r" && state.benchmark) {
        e.preventDefault();
        updateResume(state.resume);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.benchmark, state.resume, handleAnalyze, exportResume, updateResume]);

  // Render upload form if no analysis yet
  if (!state.benchmark) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Tailor Your Resume</h1>
          <p className="text-gray-600 mb-8 text-sm md:text-base">
            Upload your resume and target job description to see how well they match and get AI-powered suggestions.
          </p>

          <div className="bg-white rounded-lg border border-gray-200 p-6 md:p-8 space-y-6">
            {state.error && <ErrorAlert error={state.error} onRetry={handleAnalyze} />}

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Your Resume
              </label>
              <textarea
                value={resumeInput}
                onChange={(e) => setResumeInput(e.target.value)}
                disabled={state.loading !== "idle"}
                className="w-full h-40 md:h-48 p-4 border border-gray-300 rounded-lg font-mono text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Paste your resume here..."
                aria-label="Resume text input"
              />
              <p className="text-xs text-gray-500 mt-1">{resumeInput.length} characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Job Description
              </label>
              <textarea
                value={jdInput}
                onChange={(e) => setJdInput(e.target.value)}
                disabled={state.loading !== "idle"}
                className="w-full h-40 md:h-48 p-4 border border-gray-300 rounded-lg font-mono text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Paste the job description here..."
                aria-label="Job description text input"
              />
              <p className="text-xs text-gray-500 mt-1">{jdInput.length} characters</p>
            </div>

            {state.loading !== "idle" && <LoadingSpinner message={getLoadingMessage()} />}

            <button
              onClick={handleAnalyze}
              disabled={state.loading !== "idle" || !resumeInput.trim() || !jdInput.trim()}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm md:text-base"
              aria-label="Analyze resume and job description"
            >
              {state.loading !== "idle" ? "Analyzing..." : "Analyze"}
            </button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>&#10003; Resume should be at least 50 characters</p>
              <p>&#10003; Job description should be at least 100 characters</p>
              <p>&#10003; Keyboard shortcut: Ctrl+Enter to analyze</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render main analysis view
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Resume Analysis</h1>
        <button
          onClick={handleStartOver}
          className="text-blue-600 hover:underline text-xs md:text-sm"
          aria-label="Start over with a new resume"
        >
          ← Start Over
        </button>
      </div>

      {state.error && (
        <div className="max-w-7xl mx-auto mb-6">
          <ErrorAlert error={state.error} />
        </div>
      )}

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {/* Left Column: Benchmark */}
        <div className="md:col-span-2 lg:col-span-1">
          {state.benchmark ? (
            <BenchmarkPanel benchmark={state.benchmark} />
          ) : (
            <LoadingSpinner message="Loading benchmark..." />
          )}
        </div>

        {/* Center Column: Resume Editor */}
        <div className="md:col-span-2 lg:col-span-2">
          {state.benchmark ? (
            <>
              <ResumeInlineEditor
                resumeText={state.resume}
                onChange={handleResumeChange}
                benchmark={state.benchmark}
                scoreBreakdown={state.scoreBreakdown || undefined}
              />

              <button
                onClick={exportResume}
                disabled={state.loading !== "idle"}
                className="w-full mt-4 md:mt-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm md:text-base"
                aria-label="Export tailored resume"
              >
                Export Tailored Resume (Ctrl+E)
              </button>
            </>
          ) : (
            <LoadingSpinner message="Loading resume editor..." />
          )}
        </div>

        {/* Right Column: Score + Gaps */}
        <div className="md:col-span-2 lg:col-span-1 space-y-4 md:space-y-6">
          {state.scoreBreakdown ? (
            <MatchScoreDisplay
              scoreBreakdown={state.scoreBreakdown}
              onRefresh={() => updateResume(state.resume)}
            />
          ) : state.loading === "scoring" || state.loading === "generating-gaps" ? (
            <LoadingSpinner message="Calculating score..." />
          ) : null}

          {state.gapChecklist ? (
            <GapChecklist
              gapChecklist={state.gapChecklist}
              onActionClick={applyGapAction}
            />
          ) : state.loading === "generating-gaps" ? (
            <LoadingSpinner message="Generating suggestions..." />
          ) : null}
        </div>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="max-w-7xl mx-auto mt-8 text-center">
        <p className="text-xs text-gray-400">
          Keyboard shortcuts: Ctrl+E to export | Ctrl+Shift+R to refresh score
        </p>
      </div>
    </div>
  );
}
