import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Users,
  Radio,
  Minimize2,
  Crown
} from 'lucide-react';
import {
  fetchActiveGroupCall,
  leaveGroupCall,
  endGroupCall,
  updateCallSpeakingStatus
} from '../services/api';

export default function GroupCallModal({
  call,
  currentUser,
  onClose,
  onCallEnded
}) {
  const [participants, setParticipants] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [minimized, setMinimized] = useState(false);

  // Audio stream & analysis refs
  const mediaStreamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const speakingTimeoutRef = useRef(null);
  const isSpeakingRef = useRef(false);

  const isHost = Number(call?.caller_id) === Number(currentUser?.id);

  // 1. Duration Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  // 2. Setup Microphone & Voice Activity Detection
  useEffect(() => {
    let isCancelled = false;

    async function initMicrophone() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          console.warn('Microphone API not available on this browser/context');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });

        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        mediaStreamRef.current = stream;

        // Web Audio Analyser for speaking detection
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioContextRef.current = ctx;
          const source = ctx.createMediaStreamSource(stream);
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          const detectVoice = () => {
            if (!analyserRef.current || isCancelled) return;
            analyserRef.current.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;

            // Threshold for speaking voice
            const isSpeakingNow = average > 18 && !isMuted;

            if (isSpeakingNow) {
              if (!isSpeakingRef.current) {
                isSpeakingRef.current = true;
                setLocalSpeaking(true);
                sendSpeakingUpdate(true);
              }
              if (speakingTimeoutRef.current) {
                clearTimeout(speakingTimeoutRef.current);
                speakingTimeoutRef.current = null;
              }
            } else if (isSpeakingRef.current) {
              if (!speakingTimeoutRef.current) {
                speakingTimeoutRef.current = setTimeout(() => {
                  isSpeakingRef.current = false;
                  setLocalSpeaking(false);
                  sendSpeakingUpdate(false);
                  speakingTimeoutRef.current = null;
                }, 500);
              }
            }

            animationFrameRef.current = requestAnimationFrame(detectVoice);
          };

          detectVoice();
        }
      } catch (err) {
        console.warn('Microphone permission or audio setup notice:', err);
      }
    }

    initMicrophone();

    return () => {
      isCancelled = true;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch (e) {}
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Update backend speaking state
  const sendSpeakingUpdate = async (speaking) => {
    if (!call?.id || !currentUser?.id) return;
    try {
      await updateCallSpeakingStatus({
        callId: call.id,
        userId: currentUser.id,
        isSpeaking: speaking,
        isMuted: isMuted,
      });
    } catch (e) {}
  };

  // Toggle Microphone Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    if (nextMuted) {
      isSpeakingRef.current = false;
      setLocalSpeaking(false);
      sendSpeakingUpdate(false);
    }
  };

  // 3. Poll Active Call & Participants Every 2 Seconds
  useEffect(() => {
    if (!call?.group_id) return;

    const poll = async () => {
      try {
        const data = await fetchActiveGroupCall(call.group_id);
        if (!data.active || !data.call) {
          // Call ended by host or all participants left
          onCallEnded?.();
          onClose();
          return;
        }
        setParticipants(data.participants || []);
      } catch (err) {
        console.error('Failed to sync call state:', err);
      }
    };

    poll();
    const interval = setInterval(poll, 2500);
    return () => clearInterval(interval);
  }, [call?.group_id]);

  // Leave Call
  const handleLeaveCall = async () => {
    try {
      if (call?.id && currentUser?.id) {
        await leaveGroupCall({ callId: call.id, userId: currentUser.id });
      }
    } catch (e) {
      console.error(e);
    } finally {
      onClose();
    }
  };

  // End Call for Everyone (Host action)
  const handleEndCallForEveryone = async () => {
    try {
      if (call?.id) {
        await endGroupCall({
          callId: call.id,
          groupId: call.group_id,
          userId: currentUser?.id,
          userName: currentUser?.name,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      onCallEnded?.();
      onClose();
    }
  };

  if (!call) return null;

  // Minimized Floating Pill View
  if (minimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50 animate-bounce-subtle">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-emerald-600/95 border border-emerald-400 text-white shadow-xl backdrop-blur-md cursor-pointer hover:bg-emerald-500 transition-all"
        >
          <div className="relative">
            <Radio className="w-4 h-4 text-white animate-pulse" />
            {localSpeaking && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-300 animate-ping"></span>
            )}
          </div>
          <div className="text-left">
            <p className="text-xs font-semibold leading-tight">Group Call Active</p>
            <p className="text-[10px] text-emerald-100 font-mono">{formatTime(secondsElapsed)}</p>
          </div>
          <span className="text-xs bg-emerald-800/80 px-2 py-0.5 rounded-full text-emerald-200 ml-1">
            {participants.length}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-black border border-emerald-500/30 rounded-3xl p-6 text-white shadow-2xl relative flex flex-col justify-between min-h-[520px] max-h-[90vh] overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                {call.group_name || 'Family Voice Call'}
              </h3>
              <p className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <Radio className="w-3 h-3" />
                <span>{formatTime(secondsElapsed)}</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{participants.length} connected</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setMinimized(true)}
            title="Minimize call"
            className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>

        {/* Participants Grid / List */}
        <div className="flex-1 my-6 overflow-y-auto pr-1 space-y-3">
          <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold px-1">
            Group Members Talking
          </p>

          <div className="grid grid-cols-2 gap-3">
            {participants.map((p) => {
              const isCurrentUser = Number(p.user_id) === Number(currentUser?.id);
              const isSpeaking = isCurrentUser ? localSpeaking : Boolean(p.is_speaking);
              const isParticipantHost = Number(p.user_id) === Number(call.caller_id);

              return (
                <div
                  key={p.user_id}
                  className={`relative p-3.5 rounded-2xl flex flex-col items-center justify-center text-center transition-all ${
                    isSpeaking
                      ? 'bg-emerald-950/70 border-2 border-emerald-400 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800/60 border border-slate-700/50'
                  }`}
                >
                  {/* Avatar with speaking pulse */}
                  <div className="relative mb-2">
                    {isSpeaking && (
                      <span className="absolute -inset-1 rounded-full bg-emerald-400/40 animate-ping"></span>
                    )}
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-md transition-all ${
                        isSpeaking
                          ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 ring-4 ring-emerald-400/60 scale-105'
                          : 'bg-slate-700 ring-2 ring-slate-600'
                      }`}
                    >
                      {p.user_name ? p.user_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {isParticipantHost && (
                      <span
                        title="Call Host"
                        className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 p-1 rounded-full shadow"
                      >
                        <Crown className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-white truncate max-w-[120px]">
                    {p.user_name}
                    {isCurrentUser && <span className="text-xs text-emerald-300 font-normal"> (You)</span>}
                  </p>

                  <div className="mt-1 flex items-center gap-1 text-[11px]">
                    {isSpeaking ? (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Speaking...
                      </span>
                    ) : p.status === 'muted' ? (
                      <span className="text-slate-400 flex items-center gap-1">
                        <MicOff className="w-3 h-3 text-rose-400" />
                        Muted
                      </span>
                    ) : (
                      <span className="text-slate-400">Listening</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {participants.length === 0 && (
            <div className="text-center py-8 text-slate-500 text-sm">
              Connecting participants...
            </div>
          )}
        </div>

        {/* Audio Visualizer Waves Indicator when local user is speaking */}
        <div className="h-6 flex items-center justify-center gap-1 mb-4">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-150 ${
                localSpeaking
                  ? 'bg-emerald-400 h-5 animate-pulse'
                  : 'bg-slate-700 h-1.5'
              }`}
              style={{
                animationDelay: `${i * 70}ms`,
                height: localSpeaking ? `${Math.min(24, 8 + (i % 4) * 5)}px` : '4px',
              }}
            />
          ))}
        </div>

        {/* Bottom Call Controls Toolbar */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-inner">
          {/* Mute Mic Toggle */}
          <button
            onClick={handleToggleMute}
            className={`flex-1 py-3 px-3 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4 text-rose-400" /> : <Mic className="w-4 h-4 text-emerald-400" />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* Speaker Sound Toggle */}
          <button
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`py-3 px-3 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
              isSpeakerOn
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                : 'bg-slate-800 text-slate-500'
            }`}
            title={isSpeakerOn ? 'Speaker On' : 'Speaker Off'}
          >
            {isSpeakerOn ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Leave Call (or End Call for everyone) */}
          <button
            onClick={handleLeaveCall}
            className="flex-1 py-3 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white flex items-center justify-center gap-2 text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            <PhoneOff className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>

        {/* Optional Host-only End Call for Everyone */}
        {isHost && (
          <div className="mt-2 text-center">
            <button
              onClick={handleEndCallForEveryone}
              className="text-[11px] text-rose-400/80 hover:text-rose-300 underline cursor-pointer"
            >
              End call for everyone
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
