import React from "react";
import { BenchmarkCandidate } from "@/lib/types/benchmark";

interface BenchmarkPanelProps {
  benchmark: BenchmarkCandidate;
}

export function BenchmarkPanel({ benchmark }: BenchmarkPanelProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-20">
      <h2 className="text-2xl font-semibold mb-4">Benchmark Profile</h2>

      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">{benchmark.roleTitle}</h3>
        <p className="text-sm text-gray-600">Level: {benchmark.level}</p>
      </div>

      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-600 uppercase">Experience</label>
        <p className="text-base text-gray-900">
          {benchmark.yearsOfExperience.min}–{benchmark.yearsOfExperience.max} years
          (median: {benchmark.yearsOfExperience.median})
        </p>
        <p className="text-xs text-gray-500 mt-1">{benchmark.yearsOfExperience.reasoning}</p>
      </div>

      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-600 uppercase">Core Skills</label>
        <div className="space-y-2 mt-2">
          {benchmark.coreSkills.map((skill, idx) => (
            <div key={idx} className="text-sm">
              <span className="font-medium text-gray-900">{skill.skill}</span>
              <span className={`ml-2 text-xs px-2 py-1 rounded ${
                skill.criticality === "must-have" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
              }`}>
                {skill.criticality}
              </span>
              <p className="text-xs text-gray-600 mt-1">{skill.whyMatters}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <label className="text-xs font-semibold text-gray-600 uppercase">Typical Metrics</label>
        <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
          {benchmark.typicalMetrics.map((metric, idx) => (
            <li key={idx}>{metric}</li>
          ))}
        </ul>
      </div>

      <div className="border-t pt-4">
        <p className="text-xs text-gray-500 italic">{benchmark.synthesisReasoning}</p>
      </div>
    </div>
  );
}
