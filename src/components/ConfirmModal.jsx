import React from 'react';
import { cn } from '../utils/cn';
import { useStore } from '../store/useStore';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
  const isDarkMode = useStore(state => state.isDarkMode);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-[fadeIn_0.2s_ease-out]"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={cn("relative w-full max-w-md rounded-3xl p-6 shadow-2xl animate-[fadeIn_0.2s_ease-out]",
        isDarkMode ? "bg-slate-900 border border-slate-700/50" : "bg-white border border-slate-100"
      )}>
        <button 
          onClick={onClose}
          className={cn("absolute top-4 right-4 p-2 rounded-full transition-colors",
            isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"
          )}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 flex items-center justify-center mb-6">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h3 className={cn("text-2xl font-bold mb-2 tracking-tight", isDarkMode ? "text-white" : "text-slate-900")}>
            {title}
          </h3>
          <p className={cn("text-sm font-medium mb-8 max-w-sm", isDarkMode ? "text-slate-400" : "text-slate-500")}>
            {message}
          </p>
          
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={onClose}
              className={cn("flex-1 py-3 rounded-xl font-bold transition-all",
                isDarkMode ? "bg-slate-800 text-slate-200 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              )}
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 py-3 rounded-xl font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
            >
              Delete Permanently
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
