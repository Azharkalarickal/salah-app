import React, { useEffect } from 'react';
import { PhoneCall, PhoneOff, Users, Radio } from 'lucide-react';
import { startRingtone, stopRingtone } from '../utils/notifications';

export default function IncomingGroupCallModal({ incomingCall, onAccept, onDecline }) {
  useEffect(() => {
    // Start authentic ringtone loop and vibration
    startRingtone();

    return () => {
      stopRingtone();
    };
  }, []);

  const handleAccept = () => {
    stopRingtone();
    onAccept(incomingCall);
  };

  const handleDecline = () => {
    stopRingtone();
    onDecline(incomingCall);
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-gradient-to-b from-emerald-950 via-slate-900 to-black border border-emerald-500/30 rounded-3xl p-6 text-white text-center shadow-2xl relative overflow-hidden">
        
        {/* Subtle background glow */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-teal-500/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-6 border border-emerald-500/30">
          <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
          <span>INCOMING GROUP CALL</span>
        </div>

        {/* Group Name & Caller Info */}
        <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
          {incomingCall.group_name || 'Family Group'}
        </h2>
        <p className="text-sm text-emerald-200/90 mb-6 flex items-center justify-center gap-1.5">
          <Users className="w-4 h-4 text-emerald-400" />
          <span>{incomingCall.caller_name || 'Family Member'} is calling...</span>
        </p>

        {/* Pulsating Call Avatar Ring */}
        <div className="my-8 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping"></div>
            <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg border-4 border-emerald-400/50">
              <PhoneCall className="w-12 h-12 text-white animate-bounce" />
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-8 px-4">
          Group voice call with family members. Tap answer to connect and talk together.
        </p>

        {/* Action Buttons: Decline (Red) and Accept (Green) */}
        <div className="flex items-center justify-center gap-8">
          {/* Decline */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleDecline}
              aria-label="Decline Call"
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-all border border-rose-400/40 cursor-pointer"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-xs text-rose-300 font-medium">Decline</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleAccept}
              aria-label="Answer Call"
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-all border border-emerald-300/40 cursor-pointer"
            >
              <PhoneCall className="w-7 h-7" />
            </button>
            <span className="text-xs text-emerald-300 font-medium">Answer & Join</span>
          </div>
        </div>

      </div>
    </div>
  );
}
