import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  Grid,
  Clock,
  MessageSquare,
  Sparkles,
  Signal,
  Wifi,
  BatteryCharging,
  CheckCircle2
} from 'lucide-react';
import { startRingtone, stopRingtone, playConnectedTone } from '../utils/notifications';
import { formatTime12 } from '../utils/time';
import confetti from 'canvas-confetti';

export default function CallAlertModal({ prayer, quote, onAnswerAndPray, onDismiss, onSnooze }) {
  // Call States: 'ringing' | 'connected'
  const [callState, setCallState] = useState('ringing');
  const [callSeconds, setCallSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  useEffect(() => {
    startRingtone();
    return () => {
      stopRingtone();
    };
  }, []);

  // Timer when call is connected
  useEffect(() => {
    let timer = null;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  const handleAcceptCall = () => {
    stopRingtone();
    playConnectedTone();
    setCallState('connected');
  };

  const handleEndCallAndPray = () => {
    stopRingtone();
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#10b981', '#34d399', '#fef08a'],
    });
    onAnswerAndPray(prayer?.name || 'salah');
  };

  const handleDecline = () => {
    stopRingtone();
    onSnooze();
  };

  const formatSeconds = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const prayerName = prayer?.name ? prayer.name.toUpperCase() : 'SALAH';
  const timeFormatted = prayer?.time ? formatTime12(prayer.time) : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/98 backdrop-blur-2xl flex flex-col justify-between text-white font-sans select-none overflow-hidden animate-in fade-in duration-300">
      {/* 1. Phone Top Status Bar (iOS/Android Style) */}
      <div className="w-full max-w-md mx-auto pt-3 px-6 flex items-center justify-between text-xs text-slate-400">
        <span className="font-semibold text-slate-300">9:41</span>
        <div className="flex items-center gap-2">
          <Signal size={13} />
          <Wifi size={13} />
          <BatteryCharging size={15} className="text-emerald-400" />
        </div>
      </div>

      {/* 2. Caller Information */}
      <div className="text-center pt-8 px-4 space-y-1.5 max-w-md mx-auto w-full">
        {callState === 'ringing' ? (
          <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold animate-pulse block">
            Incoming Salah Call...
          </span>
        ) : (
          <span className="text-xs font-mono font-semibold text-emerald-400 tracking-wider block">
            {formatSeconds(callSeconds)}
          </span>
        )}

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          {prayerName} PRAYER
        </h1>

        <p className="text-sm text-slate-300 font-medium">
          {timeFormatted} • Hayya 'ala-Salah
        </p>

        <p className="text-xs text-slate-500">
          Mosque • Makkah Audio Connection
        </p>
      </div>

      {/* 3. Center Screen Content */}
      <div className="my-auto flex flex-col items-center justify-center relative py-6 max-w-md mx-auto w-full px-6">
        {callState === 'ringing' ? (
          <>
            {/* Animated Pulsing Soundwave Circles */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-48 h-48 rounded-full bg-emerald-500/10 animate-ping opacity-50" />
              <div className="absolute w-36 h-36 rounded-full bg-emerald-500/15 animate-pulse" />

              {/* Caller Avatar */}
              <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center shadow-2xl shadow-emerald-500/40 text-4xl border-4 border-slate-900">
                🕌
              </div>
            </div>

            {/* Motivational Ayah / Hadith */}
            <div className="mt-8 max-w-xs text-center px-4 py-3 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-200 italic shadow-lg">
              "{quote?.message || 'Prayer is the comfort of the soul. Answer the call.'}"
              {quote?.source && (
                <span className="block not-italic text-[10px] text-emerald-400 font-bold mt-1">
                  — {quote.source}
                </span>
              )}
            </div>
          </>
        ) : (
          /* Active Call Screen */
          <div className="w-full space-y-6 text-center">
            <div className="relative flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/30">
                🕌
              </div>
            </div>

            {/* Recitation Banner */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-emerald-900/40 space-y-1">
              <p className="text-emerald-400 text-sm font-arabic font-bold">
                اللهُ أَكْبَرُ اللهُ أَكْبَرُ • حَيَّ عَلَى الصَّلَاةِ
              </p>
              <p className="text-xs text-slate-400">
                "Stand before Allah with sincerity and devotion."
              </p>
            </div>

            {/* In-Call Phone Keypad Controls */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition active:scale-95 ${
                  isMuted ? 'bg-rose-950/80 border-rose-800 text-rose-400' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                <span className="text-[10px]">Mute</span>
              </button>

              <button
                className="flex flex-col items-center gap-1 p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 active:scale-95"
              >
                <Grid size={20} />
                <span className="text-[10px]">Keypad</span>
              </button>

              <button
                onClick={() => setIsSpeaker(!isSpeaker)}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl border transition active:scale-95 ${
                  isSpeaker ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                <Volume2 size={20} />
                <span className="text-[10px]">Speaker</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Controls */}
      <div className="pb-10 pt-4 max-w-md mx-auto w-full px-6">
        {callState === 'ringing' ? (
          <>
            {/* Quick Actions (Remind Me / Message) */}
            <div className="flex items-center justify-around mb-8 text-xs text-slate-400">
              <button
                onClick={handleDecline}
                className="flex flex-col items-center gap-1 hover:text-slate-200 transition"
              >
                <div className="p-2.5 rounded-full bg-slate-900/90 border border-slate-800">
                  <Clock size={16} />
                </div>
                <span>Remind 10m</span>
              </button>

              <button
                onClick={onDismiss}
                className="flex flex-col items-center gap-1 hover:text-slate-200 transition"
              >
                <div className="p-2.5 rounded-full bg-slate-900/90 border border-slate-800">
                  <MessageSquare size={16} />
                </div>
                <span>Dismiss</span>
              </button>
            </div>

            {/* Answer & Decline Phone Buttons */}
            <div className="flex items-center justify-around">
              {/* Decline Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleDecline}
                  className="w-18 h-18 sm:w-20 sm:h-20 p-5 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-90 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition"
                  title="Decline"
                >
                  <PhoneOff size={30} />
                </button>
                <span className="text-xs font-semibold text-slate-300">Decline</span>
              </div>

              {/* Accept Button */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={handleAcceptCall}
                  className="w-18 h-18 sm:w-20 sm:h-20 p-5 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-90 text-slate-950 flex items-center justify-center shadow-2xl shadow-emerald-500/50 transition animate-bounce"
                  title="Accept Call"
                >
                  <Phone size={30} className="rotate-[18deg]" />
                </button>
                <span className="text-xs font-bold text-emerald-400">Accept</span>
              </div>
            </div>
          </>
        ) : (
          /* Active Call: Big End Call & Mark as Prayed Button */
          <div className="space-y-3">
            <button
              onClick={handleEndCallAndPray}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition"
            >
              <CheckCircle2 size={20} />
              <span>End Call & Mark as Prayed</span>
            </button>

            <button
              onClick={() => {
                stopRingtone();
                onDismiss();
              }}
              className="w-full py-3 rounded-2xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition"
            >
              <PhoneOff size={16} />
              <span>Hang Up</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
