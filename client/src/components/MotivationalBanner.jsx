import React from 'react';
import { Quote, RefreshCw } from 'lucide-react';

export default function MotivationalBanner({ quote, onRefresh, loading }) {
  if (!quote || !quote.message) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-900/40 p-4 relative overflow-hidden">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          <Quote size={16} />
        </div>
        <div className="flex-1 pr-6">
          <p className="text-xs sm:text-sm text-slate-200 italic leading-relaxed">
            "{quote.message}"
          </p>
          {quote.source && (
            <span className="text-[11px] font-medium text-emerald-400/90 block mt-1">
              — {quote.source}
            </span>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          title="New reflection"
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-emerald-300 transition active:scale-95 disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
    </div>
  );
}
