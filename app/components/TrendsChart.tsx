"use client";

import { useMemo } from "react";
import type { HistoryEntry } from "@/lib/alert-store";

interface TrendsChartProps {
  history: HistoryEntry[];
}

export default function TrendsChart({ history }: TrendsChartProps) {
  if (!history || history.length < 2) {
    return (
      <div className="text-center py-4 text-xs text-slate-500">
        Not enough data yet — run another audit to see trends
      </div>
    );
  }

  const { minScore, maxScore, path, dots, color } = useMemo(() => {
    const scores = history.map((h) => h.score);
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const range = maxScore - minScore || 1;

    const padding = 20;
    const width = 280;
    const height = 80;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    const points = history.map((entry, idx) => {
      const x = padding + (idx / (history.length - 1)) * graphWidth;
      const y = padding + ((maxScore - entry.score) / range) * graphHeight;
      return { x, y, score: entry.score, timestamp: entry.timestamp };
    });

    // Determine trend color
    const lastScore = history[history.length - 1].score;
    const prevScore = history[history.length - 2].score;
    const trendColor = lastScore > prevScore ? "#34d399" : lastScore < prevScore ? "#f87171" : "#94a3b8";

    const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

    return {
      minScore,
      maxScore,
      path: pathData,
      dots: points,
      color: trendColor,
    };
  }, [history]);

  return (
    <svg
      width="100%"
      height="100px"
      viewBox="0 0 300 100"
      className="w-full h-20"
      style={{ aspectRatio: "3/1" }}
    >
      {/* Grid lines */}
      <line x1="20" y1="50" x2="280" y2="50" stroke="#1e293b" strokeWidth="1" strokeDasharray="2,2" />

      {/* Line path */}
      <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />

      {/* Dots */}
      {dots.map((dot, idx) => (
        <g key={idx}>
          <circle cx={dot.x} cy={dot.y} r="3" fill={color} />
          <title>{`${new Date(dot.timestamp).toLocaleDateString()}: ${Math.round(dot.score)}`}</title>
        </g>
      ))}
    </svg>
  );
}
