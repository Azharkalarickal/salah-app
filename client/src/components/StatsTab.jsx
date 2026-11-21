import React, { useState, useEffect } from 'react';
import { BarChart3, Award, CheckCircle, Clock3, Users, AlertCircle } from 'lucide-react';
import { fetchSalahHistory } from '../services/api';

export default function StatsTab() {
  const [historyData, setHistoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalahHistory(7)
      .then((data) => setHistoryData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const stats = historyData?.stats || { completed: 0, jamaah: 0, late: 0, missed: 0, totalPrayers: 0 };
  const total = stats.totalPrayers || 1;
  const onTimePercentage = Math.round(((stats.completed + stats.jamaah) / total) * 100) || 0;

  return (
    <div className="space-y-4 pb-20">
      {/* Header Summary Card */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-800/40 p-5 shadow-xl">
        <div className="flex items-center gap-2 mb-3">
          <Award className="text-emerald-400" size={20} />
          <h2 className="text-base font-bold text-white">Prayer Consistency</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 block">On-Time Ratio</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">{onTimePercentage}%</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs text-slate-400 block">Recorded Prayers</span>
            <span className="text-2xl font-black text-white font-mono">{stats.totalPrayers}</span>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Last 7 Days Breakdown
        </h3>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-emerald-900/30">
            <CheckCircle size={16} className="text-emerald-400" />
            <div>
              <span className="text-xs text-slate-400 block">On Time</span>
              <span className="text-base font-bold text-white">{stats.completed}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-blue-900/30">
            <Users size={16} className="text-blue-400" />
            <div>
              <span className="text-xs text-slate-400 block">Jama'ah</span>
              <span className="text-base font-bold text-white">{stats.jamaah}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-amber-900/30">
            <Clock3 size={16} className="text-amber-400" />
            <div>
              <span className="text-xs text-slate-400 block">Late / Qadha</span>
              <span className="text-base font-bold text-white">{stats.late}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-950/80 border border-rose-900/30">
            <AlertCircle size={16} className="text-rose-400" />
            <div>
              <span className="text-xs text-slate-400 block">Missed</span>
              <span className="text-base font-bold text-white">{stats.missed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
          Recent Log Entries
        </h3>
        {loading ? (
          <p className="text-xs text-slate-500 py-4 text-center">Loading history...</p>
        ) : historyData?.logs?.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">No recorded prayers yet. Mark your prayers to see them here.</p>
        ) : (
          <div className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
            {historyData.logs.slice(0, 15).map((log, idx) => {
              const d = new Date(log.log_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              });
              return (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold capitalize text-slate-200">{log.prayer_name}</span>
                    <span className="text-slate-500 ml-2">{d}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      log.status === 'completed'
                        ? 'text-emerald-400 bg-emerald-950/60'
                        : log.status === 'jamaah'
                        ? 'text-blue-400 bg-blue-950/60'
                        : log.status === 'late'
                        ? 'text-amber-400 bg-amber-950/60'
                        : 'text-rose-400 bg-rose-950/60'
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
