import React from 'react';
import { CubeState } from '../types/innovation';
import { NATURE_COLORS, TYPE_COLORS } from '../constants/innovationTaxonomy';
import { Sparkles } from 'lucide-react';

interface HoverTooltipProps {
  cube: CubeState | null;
  position?: { x: number; y: number };
}

export const HoverTooltip: React.FC<HoverTooltipProps> = ({ cube, position }) => {
  // Non-highlighted (empty) cubes are not interactive and do not show a tooltip
  if (!cube || !position || cube.innovations.length === 0) return null;

  const count = cube.innovations.length;
  const natureColor = NATURE_COLORS[cube.nature];
  const typeColor = TYPE_COLORS[cube.type];

  // Offset so tooltip does not block cursor
  const left = Math.min(window.innerWidth - 300, position.x + 18);
  const top = Math.min(window.innerHeight - 200, position.y + 18);

  return (
    <div
      style={{ left: `${left}px`, top: `${top}px` }}
      className="fixed z-50 pointer-events-none w-72 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl p-3.5 text-sm animate-in fade-in duration-150"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2 font-bold text-white text-sm">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: typeColor?.hex }}
          />
          <span className="truncate">{cube.type}</span>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-md font-semibold"
          style={{
            backgroundColor: `${natureColor?.hex}20`,
            color: natureColor?.hex,
            border: `1px solid ${natureColor?.hex}40`,
          }}
        >
          {cube.nature}
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5 text-slate-300 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Focus:</span>
          <span className="font-semibold text-slate-200">{cube.locus}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Innovations:</span>
          <span className="font-bold text-white text-xs">
            {count} {count === 1 ? 'entry' : 'entries'}
          </span>
        </div>
      </div>

      {count > 0 ? (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80">
          <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold mb-1">
            Top Innovation:
          </div>
          <div className="text-xs font-semibold text-sky-300 truncate">
            {cube.innovations[0].companyName}: {cube.innovations[0].innovationName}
          </div>
          {count > 1 && (
            <div className="text-xs text-slate-400 mt-0.5 font-medium">
              +{count - 1} more in this cube
            </div>
          )}
        </div>
      ) : (
        <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 text-xs text-slate-400 flex items-center gap-1.5 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>Click cube to inspect or add innovation</span>
        </div>
      )}
    </div>
  );
};
