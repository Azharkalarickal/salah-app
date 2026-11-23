import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Award,
  CheckCircle,
  Clock3,
  Users,
  AlertCircle,
  Calendar,
  BookOpen,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { fetchSalahHistory, fetchYearlyStats } from '../services/api';

export default function StatsTab({ userId }) {
  const [viewMode, setViewMode] = useState('weekly'); // 'weekly' | 'yearly'
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [historyData, setHistoryData] = useState(null);
  const [yearlyData, setYearlyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchSalahHistory(7, userId),
      fetchYearlyStats(selectedYear, userId),
    ])
      .then(([history, yearly]) => {
        setHistoryData(history);
        setYearlyData(yearly);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedYear, userId]);

  const weeklyStats = historyData?.stats || { completed: 0, jamaah: 0, late: 0, missed: 0, totalPrayers: 0 };
  const weeklyTotal = weeklyStats.totalPrayers || 1;
  const weeklyOnTimeRatio = Math.round(((weeklyStats.completed + weeklyStats.jamaah) / weeklyTotal) * 100) || 0;

  // Group previous logs by date for historical inspection
  const groupedLogs = React.useMemo(() => {
    if (!historyData?.logs) return [];
    const map = {};
    historyData.logs.forEach((item) => {
      const d = item.log_date ? String(item.log_date).slice(0, 10) : '';
      if (!d) return;
      if (!map[d]) {
        map[d] = { date: d, prayers: {} };
      }
      map[d].prayers[item.prayer_name] = item.status;
    });
    return Object.values(map).sort((a, b) => b.date.localeCompare(a.date));
  }, [historyData?.logs]);

  return (
    <div className="space-y-4 pb-20">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
        <button
          onClick={() => setViewMode('weekly')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            viewMode === 'weekly'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 size={14} />
          <span>7-Day View</span>
        </button>

        <button
          onClick={() => setViewMode('yearly')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            viewMode === 'yearly'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Calendar size={14} />
          <span>Full Year {selectedYear}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
          <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">Loading analytics...</span>
        </div>
      ) : viewMode === 'weekly' ? (
        /* --- WEEKLY VIEW --- */
        <>
          <div className="rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-800/40 p-5 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <Award className="text-emerald-400" size={20} />
              <h2 className="text-base font-bold text-white">7-Day Consistency</h2>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs text-slate-400 block">On-Time Ratio</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{weeklyOnTimeRatio}%</span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs text-slate-400 block">Recorded Prayers</span>
                <span className="text-2xl font-black text-white font-mono">{weeklyStats.totalPrayers}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Status Breakdown
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-emerald-900/30">
                <CheckCircle size={16} className="text-emerald-400" />
                <div>
                  <span className="text-xs text-slate-400 block">On Time</span>
                  <span className="text-base font-bold text-white">{weeklyStats.completed}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-blue-900/30">
                <Users size={16} className="text-blue-400" />
                <div>
                  <span className="text-xs text-slate-400 block">Jama'ah</span>
                  <span className="text-base font-bold text-white">{weeklyStats.jamaah}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-amber-900/30">
                <Clock3 size={16} className="text-amber-400" />
                <div>
                  <span className="text-xs text-slate-400 block">Late / Qadha</span>
                  <span className="text-base font-bold text-white">{weeklyStats.late}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-rose-900/30">
                <AlertCircle size={16} className="text-rose-400" />
                <div>
                  <span className="text-xs text-slate-400 block">Missed</span>
                  <span className="text-base font-bold text-white">{weeklyStats.missed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Days Marked Salah History Log */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Previous Days History Log</span>
              <span className="text-[10px] text-slate-400 font-normal">Past 7 Days</span>
            </h3>

            {groupedLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No marked prayers recorded in this period.</p>
            ) : (
              <div className="space-y-2">
                {groupedLogs.map((day) => {
                  const prayerNames = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
                  const completedCount = Object.values(day.prayers).filter(
                    (s) => s === 'completed' || s === 'jamaah'
                  ).length;

                  return (
                    <div
                      key={day.date}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="text-xs font-bold text-white block font-mono">{day.date}</span>
                        <span className="text-[10px] text-slate-400">
                          {completedCount} / 5 completed
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {prayerNames.map((p) => {
                          const status = day.prayers[p];
                          const color =
                            status === 'completed'
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : status === 'jamaah'
                              ? 'bg-blue-500 text-slate-950 font-bold'
                              : status === 'late'
                              ? 'bg-amber-500 text-slate-950 font-bold'
                              : status === 'missed'
                              ? 'bg-rose-500 text-white font-bold'
                              : 'bg-slate-800 text-slate-600 font-normal';
                          return (
                            <span
                              key={p}
                              title={`${p.toUpperCase()}: ${status || 'unmarked'}`}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] uppercase ${color}`}
                            >
                              {p[0]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* --- FULL YEAR VIEW --- */
        <>
          {/* Yearly Summary Cards */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-800/40 p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="text-emerald-400" size={20} />
                <h2 className="text-base font-bold text-white">Full Year {selectedYear} Insights</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                12 Months
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Annual Ratio</span>
                <span className="text-xl font-black text-emerald-400 font-mono">
                  {yearlyData?.yearlyOnTimeRatio || 0}%
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Total Prayers</span>
                <span className="text-xl font-black text-white font-mono">
                  {yearlyData?.yearlyTotalPrayers || 0}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <span className="text-[11px] text-slate-400 block">Quran Pages</span>
                <span className="text-xl font-black text-teal-400 font-mono">
                  {yearlyData?.yearlyQuranPages || 0}
                </span>
              </div>
            </div>
          </div>

          {/* 12-Month Bar Chart */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Monthly Consistency Chart</span>
              <span className="text-[10px] text-emerald-400 font-normal">On-time %</span>
            </h3>

            {/* Vertical Bar Graph for all 12 Months */}
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 pt-4 pb-2 items-end h-44">
              {yearlyData?.months?.map((m) => {
                const ratio = m.onTimeRatio || 0;
                return (
                  <div key={m.month} className="flex flex-col items-center justify-end h-full gap-1">
                    <span className="text-[9px] font-mono font-semibold text-slate-400">
                      {ratio > 0 ? `${ratio}%` : ''}
                    </span>
                    <div className="w-full bg-slate-950 rounded-t-lg h-28 flex items-end overflow-hidden p-0.5 border border-slate-800">
                      <div
                        style={{ height: `${Math.max(8, ratio)}%` }}
                        className={`w-full rounded-t transition-all duration-500 ${
                          ratio >= 75
                            ? 'bg-emerald-400'
                            : ratio >= 50
                            ? 'bg-teal-500'
                            : ratio > 0
                            ? 'bg-amber-400'
                            : 'bg-slate-800'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Month by Month Detail Breakdown */}
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Monthly Record Breakdown
            </h3>
            <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
              {yearlyData?.months?.map((m) => (
                <div key={m.month} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200">{m.month} {selectedYear}</span>
                    <span className="text-slate-500 ml-2">
                      {m.totalRecorded} prayers • {m.quranPages} Quran pages
                    </span>
                  </div>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      m.onTimeRatio >= 70
                        ? 'text-emerald-400 bg-emerald-950/60'
                        : m.onTimeRatio > 0
                        ? 'text-amber-400 bg-amber-950/60'
                        : 'text-slate-500 bg-slate-900'
                    }`}
                  >
                    {m.onTimeRatio}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
