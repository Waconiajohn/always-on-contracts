// =====================================================
// EXECUTIVE RADAR CHART - Premium Minimal Design
// =====================================================
// Visual comparison: "You" vs "Benchmark" across 4 levels
// =====================================================

import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { LevelScores } from "@/types/resume-builder-v3";
import { cn } from "@/lib/utils";

interface ExecutiveRadarProps {
  scores: LevelScores;
  className?: string;
}

const BENCHMARK_VALUE = 75; // "Strong candidate" threshold

export function ExecutiveRadar({ scores, className }: ExecutiveRadarProps) {
  const data = useMemo(() => [
    {
      axis: "ATS",
      you: scores.ats.score,
      benchmark: BENCHMARK_VALUE,
      fullLabel: scores.ats.label,
    },
    {
      axis: "Recruiter",
      you: scores.recruiter.score,
      benchmark: BENCHMARK_VALUE,
      fullLabel: scores.recruiter.label,
    },
    {
      axis: "Hiring Mgr",
      you: scores.hiring_manager.score,
      benchmark: BENCHMARK_VALUE,
      fullLabel: scores.hiring_manager.label,
    },
    {
      axis: "Executive",
      you: scores.executive.score,
      benchmark: BENCHMARK_VALUE,
      fullLabel: scores.executive.label,
    },
  ], [scores]);

  return (
    <div className={cn("w-full", className)}>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.5}
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ 
              fill: "hsl(var(--muted-foreground))", 
              fontSize: 12,
              fontWeight: 500,
            }}
            tickLine={false}
          />
          
          {/* Benchmark polygon - dashed, muted */}
          <Radar
            name="Benchmark"
            dataKey="benchmark"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="transparent"
            animationDuration={800}
            animationBegin={200}
          />
          
          {/* Your scores polygon - solid, primary */}
          <Radar
            name="You"
            dataKey="you"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            fill="hsl(var(--primary))"
            fillOpacity={0.15}
            animationDuration={1000}
            animationBegin={0}
          />
        </RadarChart>
      </ResponsiveContainer>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-primary rounded" />
          <span>You</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-muted-foreground" />
          <span>Benchmark (75)</span>
        </div>
      </div>
    </div>
  );
}
