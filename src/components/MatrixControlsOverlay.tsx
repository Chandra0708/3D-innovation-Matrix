import React from 'react';
import {
  MatrixFilters,
  ColorMode,
  MatrixLayoutMode,
} from '../types/innovation';
import { CameraPreset } from './InnovationMatrix3D';
import {
  Search,
  RefreshCw,
  LayoutGrid,
  Box,
  Compass,
  Palette,
} from 'lucide-react';

interface MatrixControlsOverlayProps {
  filters: MatrixFilters;
  onFilterChange: (newFilters: MatrixFilters) => void;
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
  layoutMode?: MatrixLayoutMode;
  onLayoutModeChange?: (mode: MatrixLayoutMode) => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
  activeInnovationsCount: number;
}

export const MatrixControlsOverlay: React.FC<MatrixControlsOverlayProps> = ({
  filters,
  onFilterChange,
  colorMode,
  onColorModeChange,
  layoutMode = 'reference_3d',
  onLayoutModeChange,
  autoRotate,
  onToggleAutoRotate,
  cameraPreset = 'isometric',
  onCameraPresetChange,
  activeInnovationsCount,
}) => {
  return (
    <>
      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-4 right-4 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search Bar */}
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-2 flex items-center gap-2 shadow-xl">
          <div className="relative min-w-[180px] sm:min-w-[260px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search matrix innovations..."
              value={filters.searchQuery}
              onChange={(e) =>
                onFilterChange({ ...filters, searchQuery: e.target.value })
              }
              className="w-full pl-9 pr-8 py-2 text-xs font-medium bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Center / Right: Quick Stats Indicator */}
        <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl px-4 py-2.5 flex items-center gap-3.5 text-xs shadow-xl hidden sm:flex">
          <div>
            <span className="text-slate-400 font-medium">Matrix Cells:</span>{' '}
            <span className="font-mono font-bold text-white tabular-nums text-sm">108</span>
          </div>
          <span className="text-slate-700">·</span>
          <div>
            <span className="text-slate-400 font-medium">Innovations:</span>{' '}
            <span className="font-mono font-bold text-sky-400 tabular-nums text-sm">
              {activeInnovationsCount}
            </span>
          </div>
        </div>
      </div>

      {/* Right-Side Floating Controls Panel (Colour, View, Layout, Auto-Rotate) */}
      <aside className="absolute right-4 top-20 z-20 pointer-events-auto w-56 bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 shadow-2xl space-y-3.5 text-xs">
        {/* Section 1: Colour Mode */}
        <div>
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-2">
            <Palette className="w-3.5 h-3.5 text-sky-400" />
            <span className="uppercase tracking-wider text-[11px] text-slate-400">Colour Mode</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => onColorModeChange('nature')}
              className={`py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                colorMode === 'nature'
                  ? 'bg-slate-800 text-sky-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nature
            </button>
            <button
              onClick={() => onColorModeChange('type')}
              className={`py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                colorMode === 'type'
                  ? 'bg-slate-800 text-sky-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Type
            </button>
            <button
              onClick={() => onColorModeChange('heatmap')}
              className={`py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                colorMode === 'heatmap'
                  ? 'bg-slate-800 text-sky-400 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Density
            </button>
          </div>
        </div>

        {/* Section 2: Camera View */}
        {onCameraPresetChange && (
          <div>
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-2">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span className="uppercase tracking-wider text-[11px] text-slate-400">Camera View</span>
            </div>
            <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => onCameraPresetChange('isometric')}
                className={`py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  cameraPreset === 'isometric'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                3D Iso
              </button>
              <button
                onClick={() => onCameraPresetChange('front')}
                className={`py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  cameraPreset === 'front'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Front
              </button>
              <button
                onClick={() => onCameraPresetChange('side')}
                className={`py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  cameraPreset === 'side'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Side
              </button>
              <button
                onClick={() => onCameraPresetChange('top')}
                className={`py-1.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                  cameraPreset === 'top'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Top
              </button>
            </div>
          </div>
        )}

        {/* Section 3: Layout Mode */}
        {onLayoutModeChange && (
          <div>
            <div className="flex items-center gap-1.5 text-slate-300 font-semibold mb-2">
              <Box className="w-3.5 h-3.5 text-sky-400" />
              <span className="uppercase tracking-wider text-[11px] text-slate-400">Layout Mode</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() => onLayoutModeChange('reference_3d')}
                className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  layoutMode === 'reference_3d'
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-sky-400" />
                  <span>3D Reference</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">9×3×4</span>
              </button>
              <button
                onClick={() => onLayoutModeChange('horizontal_types_3d')}
                className={`w-full py-1.5 px-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  layoutMode === 'horizontal_types_3d'
                    ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 font-bold shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Horizontal Types</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Row X</span>
              </button>
            </div>
          </div>
        )}

        {/* Section 4: Auto Rotate */}
        <div className="pt-1 border-t border-slate-800/80">
          <button
            onClick={onToggleAutoRotate}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              autoRotate
                ? 'bg-sky-500/15 text-sky-400 border-sky-500/40 shadow-md shadow-sky-500/10'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRotate ? 'animate-spin text-sky-400' : 'text-slate-400'}`} />
            <span>{autoRotate ? 'Auto Rotate Active' : 'Auto Rotate'}</span>
          </button>
        </div>
      </aside>
    </>
  );
};
