import React, { useEffect } from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ClearConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  innovationsCount: number;
}

export const ClearConfirmationModal: React.FC<ClearConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  innovationsCount,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow ambient background */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon & Title */}
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">Clear Innovation Matrix</h3>
            <p className="text-xs text-rose-400/90 font-medium mt-0.5 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Destructive action · Cannot be undone</span>
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-300 leading-relaxed mb-5">
          Are you sure you want to clear all data? This will remove all{' '}
          <strong className="text-white font-semibold">
            {innovationsCount} innovation{innovationsCount === 1 ? '' : 's'}
          </strong>{' '}
          and reset the 3D matrix back to 108 blank outline cubes.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 active:bg-rose-700 rounded-lg shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Yes, Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
