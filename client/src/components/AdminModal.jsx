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
  Award
} from 'lucide-react';
import {
  adminLogin,
  adminChangePassword,
  fetchAdminStats,
  fetchAdminUsers,
  deleteUser
} from '../services/api';

export default function AdminModal({ isOpen, onClose }) {
  const [authorized, setAuthorized] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin Data
  const [stats, setStats] = useState(null);
  const [usersList, setUsersList] = useState([]);

  // Change Password State
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

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
      setErrorMsg(err.message || 'Incorrect password (default is 1234)');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      const [s, u] = await Promise.all([fetchAdminStats(), fetchAdminUsers()]);
      setStats(s);
      setUsersList(u);
    } catch (err) {
      console.error(err);
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
              <p className="text-xs text-slate-400">System management & security</p>
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
              <p className="text-xs text-slate-400 mt-0.5">Default password is 1234</p>
            </div>

            <div className="max-w-xs mx-auto">
              <input
                type="password"
                placeholder="Admin Password"
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
