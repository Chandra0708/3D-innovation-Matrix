import React, { useState } from 'react';
import {
  INNOVATION_NATURES,
  INNOVATION_LOCI,
  INNOVATION_TYPES,
  NATURE_COLORS,
  TYPE_COLORS,
} from '../constants/innovationTaxonomy';
import { ColorMode, MatrixLayoutMode } from '../types/innovation';
import { ChevronDown, ChevronRight, Layers, Box, Info, Sparkles } from 'lucide-react';

interface RightSideLegendProps {
  isInspectorOpen: boolean;
  layoutMode: MatrixLayoutMode;
  colorMode: ColorMode;
}

export const RightSideLegend: React.FC<RightSideLegendProps> = ({
  isInspectorOpen,
  layoutMode,
  colorMode,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'axes' | 'types'>('axes');

  // If inspector drawer is actively open, keep legend minimal so it does not obstruct
  if (isInspectorOpen) {
    return null;
  }

  return (
    <aside
      aria-label="Matrix Taxonomy Legend"
      className="fixed top-16 right-4 z-20 pointer-events-auto transition-all duration-300"
    >
      {/* Minimized Pill Button */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/90 hover:bg-slate-800/95 backdrop-blur-md border border-slate-800 hover:border-slate-700 text-slate-200 rounded-xl text-sm font-semibold shadow-xl transition-colors"
          title="Open Matrix Taxonomy Legend"
        >
          <Layers className="w-4 h-4 text-sky-400" />
          <span>Matrix Legend</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      ) : (
        /* Expanded Clean Consolidated Card */
        <div className="w-80 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-sm text-slate-200 animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-sky-400" />
              <span className="font-bold text-slate-100 text-sm">Matrix Legend</span>
              <span className="text-xs text-slate-500 font-mono">108 Cells</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800/60 transition-colors"
              title="Minimize Legend"
              aria-label="Minimize Legend"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Sub-tabs: Axes Guide vs 9 Types */}
          <div className="px-3.5 pt-2.5 pb-1 flex items-center gap-1.5 border-b border-slate-800/60 bg-slate-950/20">
            <button
              onClick={() => setActiveTab('axes')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'axes'
                  ? 'bg-slate-800 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              3 Axes Breakdown
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === 'types'
                  ? 'bg-slate-800 text-sky-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              9 Innovation Types
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-4 max-h-[calc(100vh-230px)] overflow-y-auto">
            {activeTab === 'axes' ? (
              <>
                {/* Z-Axis: Nature of Innovation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      {layoutMode === 'reference_3d' ? 'Depth Axis (Z): Nature' : 'Vertical Axis (Y): Nature'}
                    </span>
                    <span className="text-xs text-slate-500">3 Tiers</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    {INNOVATION_NATURES.map((nature) => (
                      <div key={nature} className="flex items-center justify-between py-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: NATURE_COLORS[nature].hex }}
                          />
                          <span className="font-semibold text-slate-200 text-xs">{nature}</span>
                        </div>
                        <span className="text-xs text-slate-400">
                          {nature === 'Sustaining'
                            ? 'Iterative'
                            : nature === 'Efficiency'
                            ? 'Cost / Ops'
                            : 'Transformative'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* X-Axis: Locus of Innovation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      {layoutMode === 'reference_3d' ? 'Horizontal Axis (X): Locus' : 'Depth Axis (Z): Locus'}
                    </span>
                    <span className="text-xs text-slate-500">4 Scopes</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                    {INNOVATION_LOCI.map((locus, i) => (
                      <div key={locus} className="flex items-center gap-2 py-0.5">
                        <span className="text-xs font-mono font-bold text-amber-400/90 w-4">
                          {i + 1}.
                        </span>
                        <span className="font-semibold text-slate-200">{locus}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Y-Axis: Type of Innovation */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-400" />
                      {layoutMode === 'reference_3d' ? 'Vertical Axis (Y): Type' : 'Horizontal Axis (X): Type'}
                    </span>
                    <span className="text-xs text-slate-500">9 Categories</span>
                  </div>
                  <div className="text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 text-slate-300">
                    <p className="text-xs text-slate-400 leading-relaxed mb-2">
                      Covers full business architecture: from internal core offerings to ecosystem platforms.
                    </p>
                    <button
                      onClick={() => setActiveTab('types')}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
                    >
                      <span>View all 9 subcategories</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Cube State Visual Key */}
                <div className="space-y-2 pt-1 border-t border-slate-800/60">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Cube Visual States
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded border border-slate-600 bg-slate-900/40" />
                      <div>
                        <div className="font-bold text-slate-300">Wireframe</div>
                        <div className="text-slate-400 text-xs">Empty cell</div>
                      </div>
                    </div>
                    <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60 flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded bg-sky-500/80 shadow-[0_0_10px_rgba(56,189,248,0.7)]" />
                      <div>
                        <div className="font-bold text-slate-200">Glowing</div>
                        <div className="text-slate-400 text-xs">Active item(s)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* All 9 Types View */
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">9 Innovation Types:</span>
                  <button
                    onClick={() => setActiveTab('axes')}
                    className="text-sky-400 hover:text-sky-300 text-xs font-semibold"
                  >
                    ← Back to Axes
                  </button>
                </div>
                <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
                  {INNOVATION_TYPES.map((type, idx) => {
                    const color = TYPE_COLORS[type]?.hex || '#38bdf8';
                    return (
                      <div
                        key={type}
                        className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-950/60 border border-slate-800/50 text-xs"
                      >
                        <span className="font-mono text-xs font-bold text-slate-500 w-4">{idx + 1}</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="font-semibold text-slate-200 truncate">{type}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Interaction Footer */}
          <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/60 text-xs text-slate-400 flex items-center justify-between">
            <span>Left-click: Orbit · Scroll: Zoom</span>
            <span className="text-sky-400 font-semibold">Click cube to inspect</span>
          </div>
        </div>
      )}
    </aside>
  );
};
