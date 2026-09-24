import React, { useState } from 'react';
import { InnovationItem } from '../types/innovation';
import { NATURE_COLORS, TYPE_COLORS } from '../constants/innovationTaxonomy';
import {
  X,
  Search,
  Plus,
  Pencil,
  Trash2,
  Building2,
  Calendar,
  Sparkles,
  Box,
  Download,
  FileCode,
  FileSpreadsheet,
} from 'lucide-react';

interface InnovationsListDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  innovations: InnovationItem[];
  onEditInnovation: (item: InnovationItem) => void;
  onDeleteInnovation: (id: string) => void;
  onAddNew: () => void;
  onLoadExample?: () => void;
  onExportHTML?: () => void;
  onExportCSV?: () => void;
}

export const InnovationsListDrawer: React.FC<InnovationsListDrawerProps> = ({
  isOpen,
  onClose,
  innovations,
  onEditInnovation,
  onDeleteInnovation,
  onAddNew,
  onLoadExample,
  onExportHTML,
  onExportCSV,
}) => {
  const [search, setSearch] = useState('');

  if (!isOpen) return null;

  const filtered = innovations.filter((inv) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      inv.companyName.toLowerCase().includes(q) ||
      inv.innovationName.toLowerCase().includes(q) ||
      inv.type.toLowerCase().includes(q) ||
      inv.nature.toLowerCase().includes(q) ||
      inv.locus.toLowerCase().includes(q) ||
      (inv.description && inv.description.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-slate-900/98 backdrop-blur-md border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Innovation Registry</h2>
            <p className="text-xs text-slate-400">
              {innovations.length} {innovations.length === 1 ? 'innovation' : 'innovations'} active in 108-cube matrix
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title="Close drawer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search & Actions Bar */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, innovation, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <button
          onClick={onAddNew}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors whitespace-nowrap shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add New</span>
        </button>
      </div>

      {/* Innovations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {innovations.length === 0 ? (
          <div className="py-12 text-center px-4 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <Box className="w-12 h-12 mx-auto text-slate-600 mb-3" />
            <h3 className="text-base font-bold text-slate-200">No Innovations Added Yet</h3>
            <p className="text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
              The 3D graph currently displays the blank wireframe outlines of all 108 coordinate cubes.
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Add your first company innovation or click below to fill the matrix with rich demo data!
            </p>
            <div className="flex items-center justify-center gap-3">
              {onLoadExample && (
                <button
                  onClick={onLoadExample}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Load Example</span>
                </button>
              )}
              <button
                onClick={onAddNew}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add First Innovation</span>
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            No innovations found matching &ldquo;{search}&rdquo;
          </div>
        ) : (
          filtered.map((inv) => {
            const natureCol = NATURE_COLORS[inv.nature];
            const typeCol = TYPE_COLORS[inv.type];
            return (
              <div
                key={inv.id}
                className="p-4 bg-slate-950/80 border border-slate-800/90 rounded-xl hover:border-slate-700 transition-colors group relative"
              >
                <div className="flex items-start justify-between gap-2.5 mb-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-sky-400">
                      <Building2 className="w-4 h-4" />
                      <span>{inv.companyName}</span>
                      {inv.year && (
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 ml-1" />
                          {inv.year}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      {inv.innovationName}
                    </h3>
                  </div>

                  {/* Edit and Delete Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditInnovation(inv)}
                      className="text-slate-400 hover:text-sky-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Edit innovation"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteInnovation(inv.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Delete innovation"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {inv.description && (
                  <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                    {inv.description}
                  </p>
                )}

                {/* 3 Axes Badges */}
                <div className="pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-200 font-medium">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: typeCol?.hex }}
                    />
                    {inv.type}
                  </span>

                  <span
                    className="px-2 py-1 rounded-md font-semibold"
                    style={{
                      backgroundColor: `${natureCol.hex}20`,
                      color: natureCol.hex,
                      border: `1px solid ${natureCol.hex}40`,
                    }}
                  >
                    {inv.nature}
                  </span>

                  <span className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800/80 text-slate-300 font-medium">
                    {inv.locus}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer with Export Actions */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {onExportHTML && (
            <button
              onClick={onExportHTML}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-colors cursor-pointer"
              title="Download standalone HTML report"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Export HTML</span>
            </button>
          )}

          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
              title="Download CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>

        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};
