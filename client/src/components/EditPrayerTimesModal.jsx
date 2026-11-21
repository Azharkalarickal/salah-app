import React, { useState, useEffect } from 'react';
import { Clock, Check, X, RotateCcw } from 'lucide-react';
import { formatTime12 } from '../utils/time';
import { fetchUserCustomTimes } from '../services/api';

export default function EditPrayerTimesModal({
  isOpen,
  onClose,
  currentPrayers,
  userId,
  onSaveCustomTimes,
}) {
  const [useCustom, setUseCustom] = useState(false);
  const [times, setTimes] = useState({
    fajr: '05:15',
    dhuhr: '12:30',
    asr: '15:45',
    maghrib: '18:15',
    isha: '19:30',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // First fill from currentPrayers
    if (currentPrayers && currentPrayers.length > 0) {
      const map = {};
      currentPrayers.forEach((p) => {
        map[p.name] = p.time ? p.time.slice(0, 5) : '05:00';
      });
      setTimes((prev) => ({ ...prev, ...map }));
    }

    // Then check if user already has saved custom times
    fetchUserCustomTimes(userId)
      .then((data) => {
        if (data?.useCustom && data?.times) {
          setUseCustom(true);
          const t = data.times;
          const pad = (v) => (v ? v.toString().slice(0, 5) : '00:00');
          setTimes({
            fajr: pad(t.fajr),
            dhuhr: pad(t.dhuhr),
            asr: pad(t.asr),
            maghrib: pad(t.maghrib),
            isha: pad(t.isha),
          });
        }
      })
      .catch(() => {});
  }, [isOpen, userId, currentPrayers]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveCustomTimes({
        userId: userId || 1,
        use_custom: useCustom,
        fajr: `${times.fajr}:00`,
        dhuhr: `${times.dhuhr}:00`,
        asr: `${times.asr}:00`,
        maghrib: `${times.maghrib}:00`,
        isha: `${times.isha}:00`,
      });
      onClose();
    } catch (err) {
      alert('Failed to save custom times');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setUseCustom(false);
    if (currentPrayers && currentPrayers.length > 0) {
      const map = {};
      currentPrayers.forEach((p) => {
        map[p.name] = p.time ? p.time.slice(0, 5) : '05:00';
      });
      setTimes((prev) => ({ ...prev, ...map }));
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl relative text-slate-100">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Clock size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Change Adhan Times</h2>
              <p className="text-[11px] text-slate-400">Match your local mosque adhan schedule</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Custom Time Toggle Switch */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">Use Custom Prayer Times</span>
              <span className="text-[10px] text-slate-400">
                {useCustom ? 'Active: your custom times' : 'Off: using calculated sun times'}
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useCustom}
                onChange={(e) => setUseCustom(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Time Inputs with 12h AM/PM Display */}
          <div className="space-y-2">
            {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
              <div
                key={p}
                className={`flex items-center justify-between p-2.5 rounded-xl border transition ${
                  useCustom
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-950/50 border-slate-800/50 opacity-60'
                }`}
              >
                <div>
                  <span className="text-xs font-bold capitalize text-slate-200 block">{p}</span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    {formatTime12(times[p] || '00:00')}
                  </span>
                </div>
                <input
                  type="time"
                  disabled={!useCustom}
                  value={times[p] || '05:00'}
                  onChange={(e) => setTimes({ ...times, [p]: e.target.value })}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500 disabled:opacity-40"
                />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleReset}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              <span>{saving ? 'Applying...' : 'Save Adhan Times'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
