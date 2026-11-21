import React, { useState } from 'react';
import { BookOpen, Flame, CheckCircle2, Plus, Minus, Bell, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function QuranTab({ quranData, onLogReading, onUpdateSettings }) {
  const settings = quranData?.settings || {};
  const todayLog = quranData?.todayLog || {};
  const streak = quranData?.streak || 0;

  const [amount, setAmount] = useState(todayLog.amount_read || settings.daily_goal_target || 2);
  const [surah, setSurah] = useState(todayLog.surah_name || '');
  const [reminderTime, setReminderTime] = useState(settings.reminder_time?.slice(0, 5) || '20:30');
  const [savingSettings, setSavingSettings] = useState(false);

  const isCompleted = todayLog.completed;

  const handleToggleCompleted = () => {
    const nextState = !isCompleted;
    if (nextState) {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#34d399', '#10b981', '#60a5fa'],
      });
    }
    onLogReading({
      completed: nextState,
      amount_read: amount,
      surah_name: surah,
    });
  };

  const handleSaveReminder = async () => {
    setSavingSettings(true);
    try {
      await onUpdateSettings({
        reminder_time: `${reminderTime}:00`,
        reminder_enabled: true,
        daily_goal_target: Number(amount) || 2,
      });
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Quran Streak & Goal Header Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/40 p-5 shadow-xl relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Daily Quran Habit</h2>
              <p className="text-xs text-slate-400">Keep the heart connected to the Book of Allah</p>
            </div>
          </div>

          {/* Streak Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-950/60 border border-amber-800/50 text-amber-300">
            <Flame size={16} className="text-amber-400 fill-amber-400 animate-pulse" />
            <span className="text-xs font-bold">{streak} Day Streak</span>
          </div>
        </div>

        {/* Daily Goal Status */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-300 mb-2">
            <span>Today's Target: {settings.daily_goal_target || 2} {settings.daily_goal_type || 'pages'}</span>
            <span className={isCompleted ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {isCompleted ? '✓ Completed' : 'Pending'}
            </span>
          </div>

          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isCompleted ? 'w-full bg-emerald-400' : 'w-1/3 bg-amber-400'
              }`}
            />
          </div>
        </div>

        {/* Big Action Check-in Button */}
        <button
          onClick={handleToggleCompleted}
          className={`w-full mt-4 py-3.5 px-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition active:scale-[0.98] ${
            isCompleted
              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-800'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
          }`}
        >
          <CheckCircle2 size={19} />
          <span>{isCompleted ? 'Completed Today (Tap to undo)' : 'I Read Quran Today'}</span>
        </button>
      </div>

      {/* Quick Reading Tracker Form */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Record Today's Reading Details
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Pages Read</label>
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setAmount(Math.max(1, amount - 1))}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center active:scale-95"
              >
                <Minus size={14} />
              </button>
              <span className="flex-1 text-center font-bold font-mono text-white text-sm">
                {amount}
              </span>
              <button
                type="button"
                onClick={() => setAmount(amount + 1)}
                className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center active:scale-95"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Surah (Optional)</label>
            <input
              type="text"
              placeholder="Surah Name"
              value={surah}
              onChange={(e) => setSurah(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          onClick={() =>
            onLogReading({
              completed: true,
              amount_read: amount,
              surah_name: surah,
            })
          }
          className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
        >
          Save Reading Details
        </button>
      </div>

      {/* Daily Quran Reminder Time */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Bell size={14} className="text-emerald-400" />
          <span>Daily Quran Reminder</span>
        </div>
        <p className="text-xs text-slate-400">
          The app will notify you every day at this time to recite Quran if you haven't marked it yet.
        </p>

        <div className="flex items-center gap-2">
          <input
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            onClick={handleSaveReminder}
            disabled={savingSettings}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition disabled:opacity-50"
          >
            {savingSettings ? 'Saving...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}
