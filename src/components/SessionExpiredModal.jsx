import React from 'react';
import { ShieldAlert, LogIn, Lock } from 'lucide-react';

const SessionExpiredModal = ({ isOpen = true, onLogin }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Blurred Dark Backdrop (Non-clickable, no backdrop dismiss) */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 ease-out animate-in fade-in"
        aria-hidden="true"
      />

      {/* Modal Container (Slightly larger max-w-lg) */}
      <div 
        className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 sm:p-8 text-left align-middle shadow-2xl transition-all duration-300 ease-out animate-in zoom-in-95 fade-in border border-slate-100"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        {/* Slightly More Visible Decorative Background Accents */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />

        {/* Modal Content */}
        <div className="relative flex flex-col items-center text-center">
          
          {/* Security Notice Badge */}
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600 ring-1 ring-inset ring-rose-500/20">
            <Lock className="h-3 w-3 stroke-[2.5]" />
            Security Notice
          </div>

          {/* Expanded 80px (h-20 w-20) Security Icon Container & 40px (h-10 w-10) Shield Icon */}
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-rose-100/80 to-amber-100/80 p-4 ring-8 ring-rose-50/60 shadow-inner">
            <ShieldAlert className="h-10 w-10 text-rose-600 stroke-[1.75]" />
          </div>

          {/* Title */}
          <h3 
            id="modal-title" 
            className="text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl"
          >
            Session Expired
          </h3>

          {/* Updated Description */}
          <p 
            id="modal-description"
            className="mt-2 text-sm leading-relaxed text-slate-500 max-w-md"
          >
            Your session has expired for security reasons.
            <span className="block mt-1">Please sign in again to continue using the application.</span>
          </p>

          {/* Primary Action Button Only */}
          <div className="mt-8 flex w-full flex-col">
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-2xl hover:shadow-slate-900/30 active:translate-y-0 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
            >
              <LogIn className="h-4 w-4 stroke-[2]" />
              Login Again
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SessionExpiredModal;