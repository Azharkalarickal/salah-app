import React from 'react';
import { Bell, BellOff, MapPin, Sparkles } from 'lucide-react';

export default function Navbar({ city, country, notifPermission, onRequestNotif, onTestNotif }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate max-w-[150px]">{city || 'Mecca'}, {country || 'SA'}</span>
          </div>
          <h1 className="text-base font-bold text-slate-100 flex items-center gap-1">
            Salah & Quran
            <span className="text-[10px] bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 px-1.5 py-0.5 rounded-full font-semibold">
              Live
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 hidden sm:inline">{today}</span>
          {notifPermission === 'granted' ? (
            <button
              onClick={onTestNotif}
              title="Test notification"
              className="p-2 rounded-xl bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 hover:bg-emerald-900/60 transition active:scale-95"
            >
              <Bell size={16} />
            </button>
          ) : (
            <button
              onClick={onRequestNotif}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-950/60 text-amber-300 border border-amber-800/50 text-xs font-medium hover:bg-amber-900/60 transition active:scale-95 animate-pulse"
            >
              <BellOff size={14} />
              <span>Enable Alerts</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
