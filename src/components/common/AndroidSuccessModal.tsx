import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface AndroidSuccessModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  autoCloseDelay?: number;
  onClose: () => void;
}

export const AndroidSuccessModal: React.FC<AndroidSuccessModalProps> = ({
  isOpen,
  title,
  message,
  autoCloseDelay = 1800,
  onClose
}) => {
  useEffect(() => {
    if (isOpen && autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  if (!isOpen) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xs sm:max-w-sm rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-center text-slate-100 transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Android-style Animated Glowing Icon */}
        <div className="relative mx-auto mb-4 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
          {/* Outer Ripple Rings */}
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
          <div className="absolute inset-1 rounded-full bg-emerald-500/30 animate-pulse" />
          
          {/* Central Check Circle */}
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/40">
            <svg 
              className="w-8 h-8 sm:w-9 sm:h-9 text-white stroke-current" 
              viewBox="0 0 24 24" 
              fill="none" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
          {title}
        </h3>

        {/* Optional Description */}
        {message && (
          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            {message}
          </p>
        )}

        {/* Android Progress Indicator Line */}
        <div className="w-full bg-slate-800 rounded-full h-1 mt-5 overflow-hidden">
          <div 
            className="bg-emerald-400 h-full rounded-full transition-all ease-linear"
            style={{ 
              animation: `shrinkWidth ${autoCloseDelay}ms linear forwards` 
            }}
          />
        </div>

        {/* Android Dismiss Button */}
        <div className="mt-4 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
          >
            Sawa / OK
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
};
