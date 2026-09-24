import React from 'react';
import {
  INNOVATION_TYPES,
  INNOVATION_NATURES,
  INNOVATION_LOCI,
  NATURE_COLORS,
  TYPE_COLORS,
  LOCUS_DETAILS,
} from '../constants/innovationTaxonomy';
import { BookOpen, X, Box, Layers, Cpu, ArrowUpRight } from 'lucide-react';

interface TaxonomyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TaxonomyGuideModal: React.FC<TaxonomyGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                The 108-Cube 3D Innovation Framework
              </h2>
              <p className="text-xs text-slate-400">
                A spatial coordinate matrix spanning 9 Types × 3 Natures × 4 Loci
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
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-300">
          {/* Executive Overview */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg">
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-sky-400" />
              Spatial Innovation Modeling
            </h3>
            <p className="leading-relaxed text-slate-400">
              Traditional innovation audits rely on flat spreadsheets that obscure portfolio gaps.
              This 3D spatial simulation renders 108 distinct coordinate cubes. When an innovation is
              logged with its company, type, nature, and locus, its corresponding cube physically grows
              in scale, visual volume, and luminosity.
            </p>
          </div>

          {/* Dimension 1: Types of Innovation (9) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Axis 1: Type of Innovation (9 Subcategories)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {INNOVATION_TYPES.map((t) => (
                <div
                  key={t}
                  className="p-2.5 bg-slate-950/80 border border-slate-800/80 rounded-lg"
                >
                  <div className="flex items-center gap-1.5 mb-1 font-semibold text-white">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: TYPE_COLORS[t]?.hex }}
                    />
                    <span>{t}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {t === 'Design & Marketing' && 'Aesthetics, brand narrative, packaging, and UX.'}
                    {t === 'Product' && 'Core physical or digital goods offered.'}
                    {t === 'Service' && 'Support, client enablement, and maintenance.'}
                    {t === 'Market & Customer Channel' && 'Routes to market, distribution, and acquisition.'}
                    {t === 'Technology' && 'Proprietary IP, algorithms, materials, and tooling.'}
                    {t === 'Process' && 'Operational workflows, fabrication, and speed-to-delivery.'}
                    {t === 'Management' && 'Governance, organizational design, and incentives.'}
                    {t === 'Business Model' && 'Revenue mechanics, pricing models, and value capture.'}
                    {t === 'Industry' && 'Structural market redefining and cross-sector convergence.'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Dimension 2: Nature of Innovation (3) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Axis 2: Nature of Innovation (3 Subcategories)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {INNOVATION_NATURES.map((n) => {
                const col = NATURE_COLORS[n];
                return (
                  <div
                    key={n}
                    className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1.5 font-bold" style={{ color: col.hex }}>
                      <span>{n}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {n === 'Sustaining' &&
                        'Incremental advancements that improve existing products or services along trajectories that mainstream customers have historically valued.'}
                      {n === 'Efficiency' &&
                        'Innovations that optimize capital, reduce cycle time, cut overhead costs, and release cash flow without necessarily altering product specs.'}
                      {n === 'Disruptive' &&
                        'Radically novel paradigms that initially target non-consumers or lower-tier niches before ascending to displace established market incumbents.'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dimension 3: Locus of Innovation (4) */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
                Axis 3: Locus of Innovation (4 Subcategories)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {INNOVATION_LOCI.map((l) => (
                <div
                  key={l}
                  className="p-3 bg-slate-950/80 border border-slate-800/80 rounded-lg"
                >
                  <div className="font-semibold text-white mb-1">{l}</div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {LOCUS_DETAILS[l]?.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
