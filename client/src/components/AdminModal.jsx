import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Users,
  Check,
  Trash2,
  X,
  Lock,
  BellRing,
  Send,
  Clock,
  CalendarClock,
  RotateCcw
} from 'lucide-react';
import {
  adminLogin,
  adminChangePassword,
  fetchAdminStats,
  fetchAdminUsers,
  deleteUser,
  sendAdminBroadcast,
  fetchAdminBroadcasts,
  adminSaveGlobalPrayerTimes,
  adminFetchUserPrayerTimes,
  adminSaveUserPrayerTimes,
  fetchSettings
} from '../services/api';
import { formatTime12 } from '../utils/time';

export default function AdminModal({ isOpen, onClose }) {
  const [authorized, setAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin Data
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [broadcastsList, setBroadcastsList] = useState([]);

  // Global Prayer Times State
  const [globalPrayerTimes, setGlobalPrayerTimes] = useState({
    use_custom: true,
    fajr: '05:00',
    dhuhr: '12:30',
    asr: '15:40',
    maghrib: '18:00',
    isha: '19:45',
  });
  const [globalTimesStatus, setGlobalTimesStatus] = useState('');

  // Per-User Prayer Times Editor
  const [selectedUserForTimes, setSelectedUserForTimes] = useState(null);
  const [userSpecificTimes, setUserSpecificTimes] = useState({
    use_custom: true,
    fajr: '05:00',
    dhuhr: '12:30',
    asr: '15:40',
    maghrib: '18:00',
    isha: '19:45',
  });
  const [userTimesStatus, setUserTimesStatus] = useState('');
  const [savingUserTimes, setSavingUserTimes] = useState(false);

  // Change Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  // Send Notification State with Expiry
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastExpiry, setBroadcastExpiry] = useState(24); // hours
  const [broadcastStatus, setBroadcastStatus] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      await adminLogin(passwordInput);
      setAuthorized(true);
      loadAdminData();
    } catch (err) {
      setErrorMsg(err.message || 'Incorrect password');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [s, u, b, appSettings] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchAdminBroadcasts().catch(() => []),
        fetchSettings().catch(() => null),
      ]);
      setStats(s);
      setUsersList(u);
      setBroadcastsList(b || []);

      if (appSettings?.prayer) {
        const p = appSettings.prayer;
        const pad = (t) => (t ? t.slice(0, 5) : '05:00');
        setGlobalPrayerTimes({
          use_custom: Boolean(p.use_custom_times),
          fajr: pad(p.custom_fajr),
          dhuhr: pad(p.custom_dhuhr),
          asr: pad(p.custom_asr),
          maghrib: pad(p.custom_maghrib),
          isha: pad(p.custom_isha),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveGlobalTimes = async (e) => {
    e.preventDefault();
    try {
      await adminSaveGlobalPrayerTimes({
        use_custom: globalPrayerTimes.use_custom,
        fajr: `${globalPrayerTimes.fajr}:00`,
        dhuhr: `${globalPrayerTimes.dhuhr}:00`,
        asr: `${globalPrayerTimes.asr}:00`,
        maghrib: `${globalPrayerTimes.maghrib}:00`,
        isha: `${globalPrayerTimes.isha}:00`,
      });
      setGlobalTimesStatus('Global prayer times updated for all users!');
      setTimeout(() => setGlobalTimesStatus(''), 3000);
    } catch (err) {
      alert('Failed to save global times');
    }
  };

  const handleOpenUserTimes = async (u) => {
    setSelectedUserForTimes(u);
    setUserTimesStatus('');
    try {
      const data = await adminFetchUserPrayerTimes(u.id);
      if (data?.times) {
        const t = data.times;
        const pad = (v) => (v ? v.toString().slice(0, 5) : '05:00');
        setUserSpecificTimes({
          use_custom: Boolean(data.useCustom),
          fajr: pad(t.fajr),
          dhuhr: pad(t.dhuhr),
          asr: pad(t.asr),
          maghrib: pad(t.maghrib),
          isha: pad(t.isha),
        });
      } else {
        setUserSpecificTimes({ ...globalPrayerTimes });
      }
    } catch (e) {
      setUserSpecificTimes({ ...globalPrayerTimes });
    }
  };

  const handleSaveUserSpecificTimes = async (e) => {
    e.preventDefault();
    if (!selectedUserForTimes) return;
    setSavingUserTimes(true);
    try {
      await adminSaveUserPrayerTimes(selectedUserForTimes.id, {
        use_custom: userSpecificTimes.use_custom,
        fajr: `${userSpecificTimes.fajr}:00`,
        dhuhr: `${userSpecificTimes.dhuhr}:00`,
        asr: `${userSpecificTimes.asr}:00`,
        maghrib: `${userSpecificTimes.maghrib}:00`,
        isha: `${userSpecificTimes.isha}:00`,
      });
      setUserTimesStatus(`Saved custom prayer times for ${selectedUserForTimes.name}!`);
      setTimeout(() => {
        setUserTimesStatus('');
        setSelectedUserForTimes(null);
      }, 2000);
    } catch (err) {
      alert('Failed to save user times');
    } finally {
      setSavingUserTimes(false);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setSendingBroadcast(true);
    try {
      await sendAdminBroadcast({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim(),
        expiryHours: Number(broadcastExpiry),
      });
      setBroadcastStatus('Notification sent! Active until expiration.');
      setBroadcastTitle('');
      setBroadcastMessage('');
      const updated = await fetchAdminBroadcasts();
      setBroadcastsList(updated);
      setTimeout(() => setBroadcastStatus(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to send notification');
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPass.trim()) return;
    setPassError('');
    setPassSuccess('');
    try {
      await adminChangePassword({
        currentPassword: currentPass.trim(),
        newPassword: newPass.trim(),
      });
      setPassSuccess('Password updated successfully!');
      setCurrentPass('');
      setNewPass('');
      setTimeout(() => setPassSuccess(''), 3000);
    } catch (err) {
      setPassError(err.message || 'Failed to update password');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await deleteUser(userId);
      setUsersList((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl relative text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Admin Control Panel</h2>
              <p className="text-xs text-slate-400">Prayer times, notifications & users</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {!authorized ? (
          /* Password Prompt */
          <form onSubmit={handleLogin} className="space-y-4 py-6 text-center">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-emerald-400">
              <Lock size={26} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Enter Admin Password</h3>
            </div>

            <div className="max-w-xs mx-auto">
              <input
                type="password"
                placeholder="Password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-center text-white text-sm focus:outline-none focus:border-emerald-500 font-mono tracking-widest"
                autoFocus
              />
            </div>

            {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full max-w-xs py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Unlock Admin Panel'}
            </button>
          </form>
        ) : (
          /* Authorized Dashboard */
          <div className="space-y-5">
            {/* System Overview Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Total Users</span>
                <span className="text-lg font-bold font-mono text-white">{stats?.totalUsers || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Family Groups</span>
                <span className="text-lg font-bold font-mono text-emerald-400">{stats?.totalGroups || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Prayers Logged</span>
                <span className="text-lg font-bold font-mono text-blue-400">{stats?.totalPrayersLogged || 0}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 block">Quran Logs</span>
                <span className="text-lg font-bold font-mono text-amber-400">{stats?.totalQuranLogs || 0}</span>
              </div>
            </div>

            {/* 1. ADMIN SET GLOBAL PRAYER TIMES */}
            <form onSubmit={handleSaveGlobalTimes} className="p-4 rounded-2xl bg-slate-950 border border-emerald-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <Clock size={15} />
                  <span>Set Global Mosque Prayer Times</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={globalPrayerTimes.use_custom}
                    onChange={(e) =>
                      setGlobalPrayerTimes({ ...globalPrayerTimes, use_custom: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
                  <div key={p} className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold capitalize text-slate-300">{p}</span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {formatTime12(globalPrayerTimes[p] || '00:00')}
                      </span>
                    </div>
                    <input
                      type="time"
                      value={globalPrayerTimes[p] || '05:00'}
                      onChange={(e) =>
                        setGlobalPrayerTimes({ ...globalPrayerTimes, [p]: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>

              {globalTimesStatus && (
                <p className="text-xs text-emerald-400 font-medium">{globalTimesStatus}</p>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition active:scale-95 shadow-md shadow-emerald-600/20"
              >
                Save Global Prayer Times
              </button>
            </form>

            {/* 2. SEND NOTIFICATION TO ALL USERS WITH EXPIRY */}
            <form onSubmit={handleSendBroadcast} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <BellRing size={15} />
                <span>Send Broadcast Notification to Users</span>
              </div>

              <input
                type="text"
                required
                placeholder="Notification Title"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />

              <textarea
                rows={2}
                required
                placeholder="Notification Message"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
              />

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <CalendarClock size={13} />
                  <span>Notification Expiry:</span>
                </span>
                <select
                  value={broadcastExpiry}
                  onChange={(e) => setBroadcastExpiry(Number(e.target.value))}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value={1}>Expires in 1 Hour</option>
                  <option value={3}>Expires in 3 Hours</option>
                  <option value={6}>Expires in 6 Hours</option>
                  <option value={12}>Expires in 12 Hours</option>
                  <option value={24}>Expires in 24 Hours (1 Day)</option>
                  <option value={48}>Expires in 48 Hours (2 Days)</option>
                  <option value={168}>Expires in 7 Days (1 Week)</option>
                  <option value={0}>No Expiration</option>
                </select>
              </div>

              {broadcastStatus && (
                <p className="text-xs text-emerald-400 font-semibold">{broadcastStatus}</p>
              )}

              <button
                type="submit"
                disabled={sendingBroadcast}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-500/20"
              >
                <Send size={14} />
                <span>{sendingBroadcast ? 'Sending...' : 'Send Notification to Users'}</span>
              </button>

              {broadcastsList.length > 0 && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Recently Sent</span>
                  <div className="max-h-24 overflow-y-auto space-y-1.5">
                    {broadcastsList.slice(0, 3).map((b) => (
                      <div key={b.id} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{b.title}</span>
                          {b.expires_at && (
                            <span className="text-[9px] text-amber-400 font-mono">
                              Exp: {new Date(b.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <span className="text-slate-300 block mt-0.5">{b.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>

            {/* 3. REGISTERED USERS & PER-USER PRAYER TIMES */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-200">
                <div className="flex items-center gap-1.5">
                  <Users size={14} className="text-emerald-400" />
                  <span>Registered Users ({usersList.length})</span>
                </div>
              </div>

              {usersList.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No registered accounts yet.</p>
              ) : (
                <div className="divide-y divide-slate-800/80 max-h-60 overflow-y-auto">
                  {usersList.map((u) => (
                    <div key={u.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{u.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-900">
                            {u.user_code}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">{u.email}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenUserTimes(u)}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition"
                          title="Set custom prayer times for this user"
                        >
                          <Clock size={12} />
                          <span>Set Times</span>
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                          title="Delete User"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* MODAL: EDIT PRAYER TIMES FOR SPECIFIC USER */}
            {selectedUserForTimes && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-emerald-700 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-white">
                      Custom Prayer Times for: {selectedUserForTimes.name}
                    </h3>
                    <span className="text-[10px] text-emerald-400 font-mono">
                      User ID: {selectedUserForTimes.user_code}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedUserForTimes(null)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => (
                    <div key={p} className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold capitalize text-slate-300">{p}</span>
                        <span className="text-[10px] font-mono text-emerald-400">
                          {formatTime12(userSpecificTimes[p] || '00:00')}
                        </span>
                      </div>
                      <input
                        type="time"
                        value={userSpecificTimes[p] || '05:00'}
                        onChange={(e) =>
                          setUserSpecificTimes({ ...userSpecificTimes, [p]: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
                </div>

                {userTimesStatus && (
                  <p className="text-xs text-emerald-400 font-medium">{userTimesStatus}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForTimes(null)}
                    className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={savingUserTimes}
                    onClick={handleSaveUserSpecificTimes}
                    className="flex-1 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition active:scale-95"
                  >
                    {savingUserTimes ? 'Saving...' : `Save for ${selectedUserForTimes.name}`}
                  </button>
                </div>
              </div>
            )}

            {/* 4. CHANGE ADMIN PASSWORD */}
            <form onSubmit={handleChangePassword} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                <KeyRound size={14} className="text-emerald-400" />
                <span>Change Admin Password</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {passSuccess && <p className="text-xs text-emerald-400">{passSuccess}</p>}
              {passError && <p className="text-xs text-rose-400">{passError}</p>}

              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                Update Password
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
