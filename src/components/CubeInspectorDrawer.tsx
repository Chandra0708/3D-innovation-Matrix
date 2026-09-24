import React from 'react';
import { CubeState, InnovationItem } from '../types/innovation';
import { NATURE_COLORS, TYPE_COLORS, LOCUS_DETAILS } from '../constants/innovationTaxonomy';
import { X, Plus, Trash2, Box, Sparkles, Building2, Calendar, Pencil } from 'lucide-react';

interface CubeInspectorDrawerProps {
  cube: CubeState | null;
  onClose: () => void;
  onAddInnovationToCube: (cube: CubeState) => void;
  onEditInnovation: (item: InnovationItem) => void;
  onDeleteInnovation: (id: string) => void;
}

export const CubeInspectorDrawer: React.FC<CubeInspectorDrawerProps> = ({
  cube,
  onClose,
  onAddInnovationToCube,
  onEditInnovation,
  onDeleteInnovation,
}) => {
  if (!cube) return null;

  const count = cube.innovations.length;
  const natureColor = NATURE_COLORS[cube.nature];
  const typeColor = TYPE_COLORS[cube.type];
  const locusInfo = LOCUS_DETAILS[cube.locus];

  return (
    <div className="fixed top-18 right-4 bottom-4 w-96 max-w-[calc(100vw-2rem)] z-40 bg-slate-900/98 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-250">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm"
            style={{
              backgroundColor: `${natureColor.hex}15`,
              borderColor: `${natureColor.hex}40`,
              color: natureColor.hex,
            }}
          >
            <Box className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-slate-400">
                Cell [{cube.coordinate.typeIndex}, {cube.coordinate.natureIndex}, {cube.coordinate.locusIndex}]
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs font-bold text-slate-300">
                {count} {count === 1 ? 'Innovation' : 'Innovations'}
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight mt-0.5">{cube.type}</h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close cube inspector"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Coordinate Taxonomy Breakdown */}
      <div className="px-4 py-3.5 bg-slate-950/60 border-b border-slate-800 space-y-2.5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium text-xs">Type of Innovation:</span>
          <span className="font-semibold text-white flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: typeColor?.hex }}
            />
            {cube.type}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium text-xs">Nature of Innovation:</span>
          <span
            className="font-semibold px-2.5 py-0.5 rounded-md text-xs"
            style={{
              backgroundColor: `${natureColor.hex}20`,
              color: natureColor.hex,
              border: `1px solid ${natureColor.hex}40`,
            }}
          >
            {cube.nature}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-400 font-medium text-xs">Locus of Innovation:</span>
          <span className="font-semibold text-slate-200 text-xs">
            {cube.locus}
            <span className="text-slate-400 font-normal ml-1">({locusInfo?.shortLabel})</span>
          </span>
        </div>
      </div>

      {/* Innovation List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300">Recorded Innovations ({count})</span>
          <button
            onClick={() => onAddInnovationToCube(cube)}
            className="flex items-center gap-1 text-sky-400 hover:text-sky-300 font-semibold transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add here</span>
          </button>
        </div>

        {count === 0 ? (
          <div className="py-8 text-center px-4 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
            <Box className="w-10 h-10 mx-auto text-slate-600 mb-2.5" />
            <p className="text-sm text-slate-200 font-bold">Empty Innovation Cube</p>
            <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
              No innovations are mapped to this coordinate yet. Add one to see this cube glow.
            </p>
            <button
              onClick={() => onAddInnovationToCube(cube)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add First Innovation
            </button>
          </div>
        ) : (
          cube.innovations.map((inv) => (
            <div
              key={inv.id}
              className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors group relative"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{inv.companyName}</span>
                    {inv.year && (
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3 ml-1" />
                        {inv.year}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-white mt-0.5">
                    {inv.innovationName}
                  </h4>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => onEditInnovation(inv)}
                    className="text-slate-400 hover:text-sky-400 p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit innovation"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteInnovation(inv.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Remove innovation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {inv.description && (
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {inv.description}
                </p>
              )}

              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span className="text-slate-400">Logged Innovation</span>
                <span className="font-mono text-slate-500">
                  {new Date(inv.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Quick Action */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/80">
        <button
          onClick={() => onAddInnovationToCube(cube)}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-xl transition-colors shadow-sm cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>Add Innovation to Cube</span>
        </button>
      </div>
    </div>
  );
};
