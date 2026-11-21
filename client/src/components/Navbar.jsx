import React from 'react';
import { Bell, BellOff, MapPin, PhoneCall } from 'lucide-react';

export default function Navbar({ city, country, notifPermission, onRequestNotif, onTestNotif, onTriggerCallAlert }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/60 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate max-w-[130px]">{city || 'Mecca'}, {country || 'SA'}</span>
          </div>
          <h1 className="text-base font-bold text-slate-100 flex items-center gap-1">
            Salah & Quran
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Test Call Alert Button */}
          <button
            onClick={onTriggerCallAlert}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 text-xs font-semibold hover:bg-emerald-900 transition active:scale-95 shadow-sm"
            title="Test Call Alert"
          >
            <PhoneCall size={13} className="text-emerald-400 animate-pulse" />
            <span>Test Call</span>
          </button>

          {notifPermission === 'granted' ? (
            <button
              onClick={onTestNotif}
              title="Test notification"
              className="p-2 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 transition active:scale-95"
            >
              <Bell size={15} />
            </button>
          ) : (
            <button
              onClick={onRequestNotif}
              className="p-2 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-800/50 hover:bg-amber-900 transition active:scale-95 animate-pulse"
              title="Enable Alerts"
            >
              <BellOff size={15} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
