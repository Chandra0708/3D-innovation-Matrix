import React, { useState, useEffect } from 'react';
import { Building2, X, Check } from 'lucide-react';

interface CompanySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCompanyName: string;
  onSaveCompanyName: (newName: string) => void;
}

export const CompanySettingsModal: React.FC<CompanySettingsModalProps> = ({
  isOpen,
  onClose,
  currentCompanyName,
  onSaveCompanyName,
}) => {
  const [name, setName] = useState(currentCompanyName);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(currentCompanyName);
    setError(null);
  }, [currentCompanyName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Company name cannot be blank');
      return;
    }
    onSaveCompanyName(name.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Portfolio Company</h3>
            <p className="text-xs text-sky-400 font-medium mt-0.5">
              Single unified organization for this 108-cube matrix
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Company / Organization Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Apple Inc., Tesla, Alphabet..."
              autoFocus
              className="w-full px-3.5 py-2.5 text-sm bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
            />
            {error && <p className="mt-1 text-xs text-rose-400">{error}</p>}
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Every innovation in the 3D matrix belongs to this single company. Renaming will update all matrix cells, exports, and reports.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg shadow-md shadow-sky-400/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save Company Name</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
