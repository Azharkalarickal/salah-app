import React, { useState, useEffect } from 'react';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { formatTime12 } from '../utils/time';

export default function HeroPrayerCard({ nextPrayer, currentPrayer, onMarkPrayed, isCompleted }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!nextPrayer || !nextPrayer.time) return;

    function updateCountdown() {
      const now = new Date();
      const [hours, minutes] = nextPrayer.time.split(':').map(Number);
      const target = new Date();
      target.setHours(hours, minutes, 0, 0);

      // If next prayer is tomorrow (e.g. fajr after isha)
      if (target <= now) {
        target.setDate(target.getDate() + 1);
      }

      const diffMs = target - now;
      if (diffMs <= 0) {
        setTimeLeft('Due now');
        return;
      }

      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);

      setTimeLeft(
        `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    }

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, [nextPrayer]);

  const handleCelebrate = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#34d399', '#fef08a'],
    });
    onMarkPrayed(currentPrayer?.name || 'fajr', 'completed');
  };

  const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  const nextPrayerTime12 = nextPrayer?.time ? formatTime12(nextPrayer.time) : '--:--';
  const currentPrayerTime12 = currentPrayer?.time ? formatTime12(currentPrayer.time) : '--:--';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 border border-emerald-800/40 p-5 shadow-2xl shadow-emerald-950/40">
      <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between">
        <div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <Sparkles size={11} /> Next: {capitalize(nextPrayer?.name || 'Salah')}
          </span>
          <div className="mt-2 text-3xl font-extrabold text-white tracking-tight flex items-baseline gap-1.5">
            {nextPrayerTime12}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-300/80 mt-1">
            <Clock size={13} />
            <span>starts in {timeLeft || 'calculating...'}</span>
          </div>
        </div>

        {/* Current Active Prayer Status */}
        <div className="text-right">
          <span className="text-[11px] font-medium text-slate-400 block">Current Salah</span>
          <span className="text-base font-bold text-slate-100 block">
            {capitalize(currentPrayer?.name || 'Fajr')}
          </span>
          <span className="text-xs font-mono text-slate-400 block">
            {currentPrayerTime12}
          </span>
          <span
            className={`inline-block text-[10px] px-2 py-0.5 rounded-md font-semibold mt-1 ${
              isCompleted
                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                : 'bg-amber-950/80 text-amber-300 border border-amber-800/60'
            }`}
          >
            {isCompleted ? '✓ Completed' : 'Pending'}
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center gap-2">
        <button
          onClick={handleCelebrate}
          disabled={isCompleted}
          className={`w-full py-3 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
            isCompleted
              ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50 cursor-default'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
          }`}
        >
          <CheckCircle2 size={19} className={isCompleted ? 'text-emerald-400' : 'text-slate-950'} />
          <span>{isCompleted ? `I Prayed ${capitalize(currentPrayer?.name)}` : `I Did My ${capitalize(currentPrayer?.name)}`}</span>
        </button>
      </div>
    </div>
  );
}
