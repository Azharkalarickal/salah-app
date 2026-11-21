import React, { useEffect } from 'react';
import { Phone, PhoneOff, Check, BellRing, Sparkles } from 'lucide-react';
import { startRingtone, stopRingtone } from '../utils/notifications';
import { formatTime12 } from '../utils/time';
import confetti from 'canvas-confetti';

export default function CallAlertModal({ prayer, quote, onAnswerAndPray, onDismiss, onSnooze }) {
  useEffect(() => {
    // Start repeating audio ringtone & vibration
    startRingtone();
    return () => {
      stopRingtone();
    };
  }, []);

  const handleAnswerAndPray = () => {
    stopRingtone();
    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#fef08a'],
    });
    onAnswerAndPray(prayer?.name || 'salah');
  };

  const handleDismiss = () => {
    stopRingtone();
    onDismiss();
  };

  const handleSnooze = () => {
    stopRingtone();
    onSnooze();
  };

  const prayerName = prayer?.name ? prayer.name.toUpperCase() : 'SALAH';
  const timeFormatted = prayer?.time ? formatTime12(prayer.time) : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="text-center pt-8 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold animate-pulse">
          <BellRing size={13} />
          <span>INCOMING PRAYER CALL</span>
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">
          {prayerName} PRAYER
        </h2>
        {timeFormatted && (
          <p className="text-lg font-mono font-bold text-emerald-400">
            {timeFormatted}
          </p>
        )}
        <p className="text-xs text-slate-400 tracking-wider">
          حَيَّ عَلَى الصَّلَاةِ • Hayya 'ala-Salah
        </p>
      </div>

      {/* Middle Animated Mosque / Ringing Avatar */}
      <div className="my-auto flex flex-col items-center justify-center relative">
        {/* Pulsing rings */}
        <div className="absolute w-44 h-44 rounded-full bg-emerald-500/10 animate-ping opacity-40 pointer-events-none" />
        <div className="absolute w-36 h-36 rounded-full bg-emerald-500/15 animate-pulse pointer-events-none" />

        <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-2xl shadow-emerald-500/40 text-slate-950">
          <span className="text-4xl select-none">🕌</span>
        </div>

        {/* Motivational message card */}
        {quote?.message && (
          <div className="mt-8 max-w-xs text-center px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 italic">
            "{quote.message}"
            {quote.source && (
              <span className="block not-italic text-[10px] text-emerald-400 mt-1 font-semibold">
                — {quote.source}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom Call Buttons (Phone Style) */}
      <div className="pb-8 max-w-sm mx-auto w-full space-y-4">
        <div className="flex items-center justify-around gap-6">
          {/* Decline / Snooze Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={handleSnooze}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition"
              title="Snooze 10m"
            >
              <PhoneOff size={26} />
            </button>
            <span className="text-[11px] font-medium text-slate-400">Snooze (10m)</span>
          </div>

          {/* Dismiss / Silence */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={handleDismiss}
              className="w-14 h-14 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 flex items-center justify-center border border-slate-700 transition"
              title="Dismiss sound"
            >
              <span className="text-xs font-bold">Dismiss</span>
            </button>
            <span className="text-[11px] font-medium text-slate-500">Mute</span>
          </div>

          {/* Accept / I Prayed Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={handleAnswerAndPray}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40 transition animate-bounce"
              title="Answer and Mark Prayed"
            >
              <Check size={28} strokeWidth={2.8} />
            </button>
            <span className="text-[11px] font-bold text-emerald-400">I Prayed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
