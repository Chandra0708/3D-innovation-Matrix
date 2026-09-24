import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  BarChart3,
  BookOpen,
  Sparkles,
  ListFilter,
  Trash2,
  Download,
  FileCode,
  FileSpreadsheet,
  ChevronDown,
  Building2,
  Pencil,
} from 'lucide-react';

interface NavigationHeaderProps {
  innovationsCount: number;
  companyName: string;
  onOpenCompanyModal: () => void;
  onOpenAddModal: () => void;
  onOpenRegistry: () => void;
  onOpenAnalytics: () => void;
  onOpenTaxonomyGuide: () => void;
  onLoadExample: () => void;
  onExportHTML: () => void;
  onExportCSV: () => void;
  onClearAll: () => void;
  onResetView: () => void;
  activeView: 'matrix' | 'analytics' | 'guide';
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  innovationsCount,
  companyName,
  onOpenCompanyModal,
  onOpenAddModal,
  onOpenRegistry,
  onOpenAnalytics,
  onOpenTaxonomyGuide,
  onLoadExample,
  onExportHTML,
  onExportCSV,
  onClearAll,
  onResetView,
  activeView,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 px-5 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md flex items-center justify-between z-30 shrink-0 gap-4">
      {/* Zone 1: Wordmark / Title & Single Company Pill */}
      <div className="flex items-center gap-3">
        <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-sky-400 inline-block shadow-md shadow-sky-400/50" />
          Innovation Matrix 3D
        </span>

        {/* Single Portfolio Company Selector / Pill */}
        <button
          onClick={onOpenCompanyModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-sky-500/50 rounded-lg text-xs font-semibold text-slate-200 transition-all cursor-pointer group shadow-sm"
          title="Click to edit portfolio company name"
        >
          <Building2 className="w-3.5 h-3.5 text-sky-400 group-hover:scale-105 transition-transform" />
          <span className="hidden md:inline text-slate-400 text-[11px] font-medium">Company:</span>
          <span className="font-bold text-white max-w-[140px] truncate">{companyName}</span>
          <Pencil className="w-3 h-3 text-slate-400 group-hover:text-sky-300 ml-0.5" />
        </button>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden xl:flex items-center gap-5 text-sm font-semibold text-slate-300">
        <button
          onClick={onResetView}
          className={`hover:text-white transition-colors cursor-pointer ${
            activeView === 'matrix' ? 'text-sky-400 font-bold' : ''
          }`}
        >
          3D Simulation (108 Cubes)
        </button>

        <button
          onClick={onOpenRegistry}
          className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <ListFilter className="w-4 h-4 text-sky-400" />
          <span>
            Innovations Registry{' '}
            <span className="font-mono text-xs text-sky-400 font-bold ml-0.5">
              ({innovationsCount})
            </span>
          </span>
        </button>

        <button
          onClick={onOpenAnalytics}
          className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>Portfolio Analytics</span>
        </button>

        <button
          onClick={onOpenTaxonomyGuide}
          className="hover:text-white transition-colors flex items-center gap-2 cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>3-Axes Taxonomy</span>
        </button>
      </nav>

      {/* Zone 3: Primary Actions (Load Example, Export, Clear, Add Innovation) */}
      <div className="flex items-center gap-2">
        {/* "Load Example" Button */}
        <button
          onClick={onLoadExample}
          className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 rounded-lg transition-colors cursor-pointer shadow-sm"
          title="Fill matrix with realistic demo innovation data"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="hidden sm:inline">Load Example</span>
          <span className="sm:hidden">Demo</span>
        </button>

        {/* Export Dropdown Menu */}
        <div className="relative" ref={exportMenuRef}>
          <button
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Export innovation matrix data as HTML or CSV"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isExportOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl py-1.5 z-50 text-sm animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                Backup Matrix Data
              </div>
              <button
                onClick={() => {
                  onExportHTML();
                  setIsExportOpen(false);
                }}
                className="w-full px-3.5 py-2.5 text-left text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Export as HTML (.html)</div>
                  <div className="text-xs text-slate-400">Standalone report & backup</div>
                </div>
              </button>

              <button
                onClick={() => {
                  onExportCSV();
                  setIsExportOpen(false);
                }}
                className="w-full px-3.5 py-2.5 text-left text-slate-200 hover:text-white hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-white">Export as CSV (.csv)</div>
                  <div className="text-xs text-slate-400">For Excel & Google Sheets</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Clear Matrix (Active and styled with clear click feedback) */}
        {innovationsCount > 0 && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-600/80 border border-rose-500/30 hover:border-rose-500 rounded-lg transition-all cursor-pointer shadow-sm"
            title="Reset matrix back to blank 108 outline cubes"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 group-hover:text-white" />
            <span>Clear</span>
          </button>
        )}

        {/* Add Innovation Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap shadow-md shadow-sky-400/25 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Innovation</span>
        </button>
      </div>
    </header>
  );
};
