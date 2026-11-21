import React from 'react';
import { Bell, BellOff, MapPin, PhoneCall, User, ShieldAlert, Clock } from 'lucide-react';

export default function Navbar({
  city,
  country,
  notifPermission,
  onRequestNotif,
  onTestNotif,
  onTriggerCallAlert,
  currentUser,
  onOpenAuth,
  onOpenAdmin,
  onOpenEditTimes,
}) {
  const displayCity = city || 'Kochi';
  const displayCountry = country || 'India (Kerala)';

  return (
    <header className="sticky top-0 z-30 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/60 px-4 py-2.5">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div>
          <button
            onClick={onOpenEditTimes}
            className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition text-left"
            title="Click to change prayer times"
          >
            <MapPin size={13} className="shrink-0" />
            <span className="truncate max-w-[130px]">{displayCity}, {displayCountry}</span>
            <span className="text-[10px] bg-emerald-950/80 border border-emerald-800/70 text-emerald-300 px-1 rounded">Edit</span>
          </button>
          <h1 className="text-base font-bold text-slate-100 flex items-center gap-1">
            Salah & Quran
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Edit Adhan Times Button */}
          <button
            onClick={onOpenEditTimes}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 transition active:scale-95"
            title="Change Adhan Times"
          >
            <Clock size={15} />
          </button>

          {/* Test Call Alert Button */}
          <button
            onClick={onTriggerCallAlert}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 text-xs font-semibold hover:bg-emerald-900 transition active:scale-95 shadow-sm"
            title="Test Call Alert"
          >
            <PhoneCall size={12} className="text-emerald-400 animate-pulse" />
            <span>Call</span>
          </button>

          {/* User Profile / Login */}
          <button
            onClick={onOpenAuth}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition active:scale-95 flex items-center gap-1 text-xs"
            title={currentUser ? `Logged in as ${currentUser.name}` : 'Login / Register'}
          >
            <User size={15} className={currentUser ? 'text-emerald-400' : 'text-slate-400'} />
            {currentUser && (
              <span className="font-mono text-[10px] text-emerald-400 font-bold hidden sm:inline">
                {currentUser.user_code}
              </span>
            )}
          </button>

          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdmin}
            className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition active:scale-95"
            title="Admin Panel (1234)"
          >
            <ShieldAlert size={15} />
          </button>

          {/* Notifications */}
          {notifPermission === 'granted' ? (
            <button
              onClick={onTestNotif}
              title="Test notification"
              className="p-1.5 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 transition active:scale-95"
            >
              <Bell size={15} />
            </button>
          ) : (
            <button
              onClick={onRequestNotif}
              className="p-1.5 rounded-xl bg-amber-950/80 text-amber-300 border border-amber-800/50 hover:bg-amber-900 transition active:scale-95 animate-pulse"
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
