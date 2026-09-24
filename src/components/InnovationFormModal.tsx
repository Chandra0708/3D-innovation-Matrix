import React, { useState, useEffect } from 'react';
import {
  InnovationItem,
  InnovationType,
  InnovationNature,
  InnovationLocus,
} from '../types/innovation';
import {
  INNOVATION_TYPES,
  INNOVATION_NATURES,
  INNOVATION_LOCI,
  NATURE_COLORS,
  TYPE_COLORS,
  LOCUS_DETAILS,
} from '../constants/innovationTaxonomy';
import { X, Sparkles, Plus, Info, Building2, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';

interface InnovationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (item: Omit<InnovationItem, 'id' | 'createdAt'>, existingId?: string) => void;
  initialType?: InnovationType;
  initialNature?: InnovationNature;
  initialLocus?: InnovationLocus;
  itemToEdit?: InnovationItem | null;
  companyName: string;
}

export const InnovationFormModal: React.FC<InnovationFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialType,
  initialNature,
  initialLocus,
  itemToEdit,
  companyName,
}) => {
  const [innovationName, setInnovationName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<InnovationType>(initialType || INNOVATION_TYPES[0]);
  const [nature, setNature] = useState<InnovationNature>(initialNature || INNOVATION_NATURES[0]);
  const [locus, setLocus] = useState<InnovationLocus>(initialLocus || INNOVATION_LOCI[0]);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [errors, setErrors] = useState<{ innovation?: string }>({});

  useEffect(() => {
    if (itemToEdit) {
      setInnovationName(itemToEdit.innovationName);
      setDescription(itemToEdit.description || '');
      setType(itemToEdit.type);
      setNature(itemToEdit.nature);
      setLocus(itemToEdit.locus);
      setYear(itemToEdit.year || new Date().getFullYear());
    } else {
      if (initialType) setType(initialType);
      if (initialNature) setNature(initialNature);
      if (initialLocus) setLocus(initialLocus);
      setInnovationName('');
      setDescription('');
      setYear(new Date().getFullYear());
    }
    setErrors({});
  }, [itemToEdit, initialType, initialNature, initialLocus, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { innovation?: string } = {};

    if (!innovationName.trim()) {
      newErrors.innovation = 'Innovation name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(
      {
        companyName: companyName.trim(),
        innovationName: innovationName.trim(),
        description: description.trim() || undefined,
        type,
        nature,
        locus,
        year: year || undefined,
      },
      itemToEdit ? itemToEdit.id : undefined
    );

    // Fire joyful celebratory confetti for new addition
    if (!itemToEdit) {
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#38bdf8', '#34d399', '#f59e0b', '#ec4899'],
        });
      } catch {
        // Ignore if confetti fails
      }
    }

    // Reset fields
    setInnovationName('');
    setDescription('');
    setErrors({});
    onClose();
  };

  const isEditing = Boolean(itemToEdit);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {isEditing ? 'Edit Innovation' : 'Log Innovation into Matrix'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update innovation details, launch year, and 3-axes coordinates'
                  : 'Enter innovation title, optional description, and select the 3 axes'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Single Unified Portfolio Company */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Portfolio Company (Matrix Unified)
                </span>
                <span className="text-sm font-bold text-white tracking-tight">
                  {companyName}
                </span>
              </div>
            </div>
            <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2.5 py-1 rounded-full">
              Single Company
            </span>
          </div>

          {/* Innovation Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Innovation Title / Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lightbulb className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="e.g. Transformers Attention Mechanism, Gigafactory Architecture"
                value={innovationName}
                onChange={(e) => {
                  setInnovationName(e.target.value);
                  if (errors.innovation) setErrors((prev) => ({ ...prev, innovation: undefined }));
                }}
                className={`w-full pl-9 pr-3 py-2 bg-slate-950 border rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 transition-colors ${
                  errors.innovation
                    ? 'border-rose-500 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-sky-500 focus:ring-sky-500'
                }`}
              />
            </div>
            {errors.innovation && (
              <p className="mt-1 text-xs text-rose-400">{errors.innovation}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Description <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Key mechanism, customer problem solved, or strategic transformation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>

          {/* 3 Axes Header Dropdowns */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5 mb-3 text-xs text-slate-400">
              <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Map onto the 3 Axes Dimensions:</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Axis 1: Type of Innovation (9) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  1. Type of Innovation
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as InnovationType)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  {INNOVATION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: TYPE_COLORS[type]?.hex }}
                  />
                  <span className="truncate">{type}</span>
                </div>
              </div>

              {/* Axis 2: Nature of Innovation (3) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  2. Nature of Innovation
                </label>
                <select
                  value={nature}
                  onChange={(e) => setNature(e.target.value as InnovationNature)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  {INNOVATION_NATURES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
                <div className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                  <span
                    className="w-2 h-2 rounded-full inline-block shrink-0"
                    style={{ backgroundColor: NATURE_COLORS[nature]?.hex }}
                  />
                  <span className="truncate">{nature}</span>
                </div>
              </div>

              {/* Axis 3: Locus of Innovation (4) */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  3. Locus of Innovation
                </label>
                <select
                  value={locus}
                  onChange={(e) => setLocus(e.target.value as InnovationLocus)}
                  className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                >
                  {INNOVATION_LOCI.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-500 truncate">
                  {LOCUS_DETAILS[locus]?.shortLabel} scope
                </p>
              </div>
            </div>
          </div>

          {/* Launch Year */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Launch / Deployment Year:</span>
            <input
              type="number"
              min="1950"
              max="2035"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-24 px-2 py-1 bg-slate-950 border border-slate-800 rounded text-right text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors shadow-sm"
            >
              {isEditing ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Update & Save Changes</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Add Innovation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
