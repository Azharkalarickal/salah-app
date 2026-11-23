import React from 'react';
import { Check, Users, Clock3, AlertCircle, Circle, Lock } from 'lucide-react';
import { formatTime12 } from '../utils/time';

const PRAYER_META = {
  fajr: { label: 'Fajr', arabic: 'الفجر', desc: 'Dawn Prayer' },
  dhuhr: { label: 'Dhuhr', arabic: 'الظهر', desc: 'Noon Prayer' },
  asr: { label: 'Asr', arabic: 'العصر', desc: 'Afternoon Prayer' },
  maghrib: { label: 'Maghrib', arabic: 'المغرب', desc: 'Sunset Prayer' },
  isha: { label: 'Isha', arabic: 'العشاء', desc: 'Night Prayer' },
};

export default function PrayerList({
  prayers,
  onUpdateStatus,
  currentPrayerName,
  isPastDate = false,
  selectedDate,
}) {
  const statusOptions = [
    { id: 'completed', label: 'On Time', icon: Check, color: 'text-emerald-400 bg-emerald-950/80 border-emerald-800' },
    { id: 'jamaah', label: "Jama'ah", icon: Users, color: 'text-blue-400 bg-blue-950/80 border-blue-800' },
    { id: 'late', label: 'Late', icon: Clock3, color: 'text-amber-400 bg-amber-950/80 border-amber-800' },
    { id: 'missed', label: 'Missed', icon: AlertCircle, color: 'text-rose-400 bg-rose-950/80 border-rose-800' },
  ];

  const now = new Date();
  const currentTotalMins = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          {isPastDate ? `Salah Marking (${selectedDate})` : "Today's Salah Schedule"}
        </h2>
        <span className="text-xs text-slate-500">
          {isPastDate ? 'Viewing past marked record' : 'Unlocks at Azan time'}
        </span>
      </div>

      <div className="space-y-2.5">
        {prayers.map((prayer) => {
          const meta = PRAYER_META[prayer.name] || { label: prayer.name, arabic: '' };
          const isCurrent = !isPastDate && currentPrayerName === prayer.name;
          const isDone = prayer.status === 'completed' || prayer.status === 'jamaah';
          const time12 = formatTime12(prayer.time);

          // Check if prayer time has arrived (past dates are always unlocked for review & marking)
          let hasStarted = isPastDate;
          if (!hasStarted && prayer.time) {
            const [h, m] = prayer.time.split(':').map(Number);
            const prayerMins = h * 60 + m;
            hasStarted = currentTotalMins >= prayerMins;
          }

          return (
            <div
              key={prayer.name}
              className={`rounded-2xl p-4 transition-all duration-200 border ${
                isCurrent
                  ? 'bg-slate-900/90 border-emerald-500/50 shadow-md shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                  : hasStarted
                  ? 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700/80'
                  : 'bg-slate-950/40 border-slate-900 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isCurrent
                        ? 'bg-emerald-500 text-slate-950'
                        : hasStarted
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-900 text-slate-600'
                    }`}
                  >
                    {isDone ? '✓' : meta.label[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-100">{meta.label}</span>
                      <span className="text-xs text-slate-400 font-serif">{meta.arabic}</span>
                    </div>
                    <span className="text-xs text-slate-400">{meta.desc}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-bold font-mono tracking-tight text-white block">
                    {time12}
                  </span>
                  {isCurrent ? (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/80 px-1.5 py-0.5 rounded">
                      Active Now
                    </span>
                  ) : !hasStarted ? (
                    <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1 justify-end">
                      <Lock size={10} /> Upcoming
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Status Selector Pills (Enabled ONLY after prayer time starts) */}
              <div className="pt-2 border-t border-slate-800/60">
                {hasStarted ? (
                  <div className="grid grid-cols-4 gap-1.5">
                    {statusOptions.map((opt) => {
                      const Icon = opt.icon;
                      const selected = prayer.status === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => onUpdateStatus(prayer.name, selected ? 'pending' : opt.id)}
                          className={`py-1.5 px-2 rounded-xl text-xs font-medium flex items-center justify-center gap-1 border transition-all active:scale-95 ${
                            selected
                              ? opt.color + ' shadow-sm font-semibold'
                              : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <Icon size={12} />
                          <span className="text-[11px] truncate">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-1.5 px-3 rounded-xl bg-slate-950/40 border border-slate-900 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Lock size={12} />
                    <span>Marking unlocks at {time12}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
