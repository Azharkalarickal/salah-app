import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Users,
  Check,
  Trash2,
  X,
  Lock,
  Layers,
  Flame,
  Award,
  BellRing,
  Send,
  Radio
} from 'lucide-react';
import {
  adminLogin,
  adminChangePassword,
  fetchAdminStats,
  fetchAdminUsers,
  deleteUser,
  sendAdminBroadcast,
  fetchAdminBroadcasts
} from '../services/api';

export default function AdminModal({ isOpen, onClose }) {
  const [authorized, setAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin Data
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [broadcastsList, setBroadcastsList] = useState([]);

  // Change Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Send Notification State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
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
      const [s, u, b] = await Promise.all([
        fetchAdminStats(),
        fetchAdminUsers(),
        fetchAdminBroadcasts().catch(() => [])
      ]);
      setStats(s);
      setUsersList(u);
      setBroadcastsList(b || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    setSendingBroadcast(true);
    try {
      await sendAdminBroadcast({
        title: broadcastTitle.trim(),
        message: broadcastMessage.trim()
      });
      setBroadcastStatus('Notification sent to all users!');
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
    if (!newPass) return;
    try {
      await adminChangePassword({ currentPassword: currentPass, newPassword: newPass });
      setPassSuccess('Password updated successfully!');
      setCurrentPass('');
      setNewPass('');
      setTimeout(() => setPassSuccess(''), 3000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password');
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
              <p className="text-xs text-slate-400">System management & broadcast</p>
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

            {/* SEND NOTIFICATION TO ALL USERS */}
            <form onSubmit={handleSendBroadcast} className="p-4 rounded-2xl bg-slate-950 border border-emerald-900/40 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <BellRing size={15} />
                <span>Send Notification to Users</span>
              </div>

              <div>
                <input
                  type="text"
                  required
                  placeholder="Notification Title"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <textarea
                  rows={2}
                  required
                  placeholder="Notification Message"
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                />
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
                <div className="pt-2 border-t border-slate-850 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Recently Sent</span>
                  <div className="max-h-28 overflow-y-auto space-y-1.5">
                    {broadcastsList.slice(0, 3).map((b) => (
                      <div key={b.id} className="p-2 rounded-lg bg-slate-900/70 border border-slate-800 text-[11px]">
                        <span className="font-bold text-white block">{b.title}</span>
                        <span className="text-slate-300 block">{b.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </form>

            {/* Change Admin Password */}
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

              <button
                type="submit"
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                Update Password
              </button>
            </form>

            {/* Registered Users Management */}
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
                <div className="divide-y divide-slate-800/80 max-h-56 overflow-y-auto">
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

                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition"
                        title="Delete User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
