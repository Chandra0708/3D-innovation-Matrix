import React from 'react';
import { InnovationItem, InnovationNature, InnovationLocus, InnovationType } from '../types/innovation';
import {
  INNOVATION_TYPES,
  INNOVATION_NATURES,
  INNOVATION_LOCI,
  NATURE_COLORS,
  TYPE_COLORS,
  LOCUS_DETAILS,
} from '../constants/innovationTaxonomy';
import { BarChart3, X, Layers, Activity, Sparkles, Building2 } from 'lucide-react';

interface AnalyticsSummaryProps {
  innovations: InnovationItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const AnalyticsSummary: React.FC<AnalyticsSummaryProps> = ({
  innovations,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  // Compute stats
  const total = innovations.length;
  const uniqueCubes = new Set(
    innovations.map((i) => `${i.type}__${i.nature}__${i.locus}`)
  ).size;
  const coveragePercent = ((uniqueCubes / 108) * 100).toFixed(1);

  // Group by Nature
  const natureCounts: Record<InnovationNature, number> = {
    Sustaining: 0,
    Efficiency: 0,
    Disruptive: 0,
  };
  innovations.forEach((i) => {
    if (natureCounts[i.nature] !== undefined) natureCounts[i.nature]++;
  });

  // Group by Locus
  const locusCounts: Record<InnovationLocus, number> = {
    'Small Teams': 0,
    Projects: 0,
    Organisations: 0,
    'Business Ecosystem': 0,
  };
  innovations.forEach((i) => {
    if (locusCounts[i.locus] !== undefined) locusCounts[i.locus]++;
  });

  // Group by Type
  const typeCounts: Record<InnovationType, number> = {
    'Design & Marketing': 0,
    Product: 0,
    Service: 0,
    'Market & Customer Channel': 0,
    Technology: 0,
    Process: 0,
    Management: 0,
    'Business Model': 0,
    Industry: 0,
  };
  innovations.forEach((i) => {
    if (typeCounts[i.type] !== undefined) typeCounts[i.type]++;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Innovation Matrix Portfolio Insights</h2>
              <p className="text-xs text-slate-400">
                108-Cube spatial balance across Type, Nature, and Locus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* High-level metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400 block mb-1">Total Innovations</span>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {total}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Registered in matrix</span>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400 block mb-1">Matrix Coverage</span>
              <div className="text-2xl font-bold font-mono text-sky-400 tabular-nums">
                {uniqueCubes} <span className="text-sm font-normal text-slate-500">/ 108</span>
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">{coveragePercent}% active cubes</span>
            </div>

            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-400 block mb-1">Company Innovations</span>
              <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {total}
              </div>
              <span className="text-[11px] text-slate-500 mt-1 block">Total mapped portfolio entries</span>
            </div>
          </div>

          {/* Nature Breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              Distribution by Nature of Innovation (3 Categories)
            </h3>
            <div className="grid grid-cols-3 gap-2.5">
              {INNOVATION_NATURES.map((nat) => {
                const count = natureCounts[nat];
                const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                const col = NATURE_COLORS[nat];
                return (
                  <div
                    key={nat}
                    className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold" style={{ color: col.hex }}>
                        {nat}
                      </span>
                      <span className="text-xs font-mono font-bold text-white tabular-nums">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: col.hex,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Locus Breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              Distribution by Locus of Innovation (4 Scopes)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {INNOVATION_LOCI.map((loc) => {
                const count = locusCounts[loc];
                const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                return (
                  <div
                    key={loc}
                    className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg"
                  >
                    <div className="text-xs font-semibold text-slate-200 truncate">
                      {loc}
                    </div>
                    <div className="text-xs text-slate-500 mb-1">
                      {LOCUS_DETAILS[loc]?.shortLabel}
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2">
                      <span className="font-mono text-white font-bold tabular-nums">{count}</span>
                      <span className="text-slate-400 font-mono text-[11px] tabular-nums">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Type Breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
              Distribution by Type of Innovation (9 Categories)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {INNOVATION_TYPES.map((t) => {
                const count = typeCounts[t];
                const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                const col = TYPE_COLORS[t];
                return (
                  <div
                    key={t}
                    className="px-3 py-2 bg-slate-950 border border-slate-800/60 rounded-md flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="truncate text-slate-300">{t}</span>
                    </div>
                    <span className="font-mono text-white font-bold ml-2 tabular-nums">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Close Insights
          </button>
        </div>
      </div>
    </div>
  );
};
