import React from 'react';
import { Quote, RefreshCw, BookOpen } from 'lucide-react';

export default function MotivationalBanner({ quote, onRefresh, loading }) {
  if (!quote || !quote.message) return null;

  return (
    <div className="rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border border-emerald-850/50 p-4 relative overflow-hidden shadow-lg shadow-emerald-950/20">
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-emerald-900/30">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
          <BookOpen size={13} />
          <span>ഹദീസ് & ഖുർആൻ സന്ദേശം</span>
        </span>
        <button
          onClick={onRefresh}
          disabled={loading}
          title="New Hadith or Quran verse"
          className="p-1 text-slate-400 hover:text-emerald-300 transition active:scale-95 disabled:opacity-40"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 mt-0.5">
          <Quote size={15} />
        </div>
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
            "{quote.message}"
          </p>
          {quote.source && (
            <span className="text-[11px] font-semibold text-emerald-400/90 block mt-1.5">
              — {quote.source}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
