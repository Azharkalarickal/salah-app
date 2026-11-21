import React, { useState } from 'react';
import { User, LogIn, UserPlus, Copy, Check, X, ShieldCheck } from 'lucide-react';
import { registerUser, loginUser } from '../services/api';

export default function AuthModal({ isOpen, onClose, currentUser, onLoginSuccess, onLogout }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      if (isRegister) {
        const res = await registerUser({ name, email, password });
        onLoginSuccess(res.user);
        onClose();
      } else {
        const res = await loginUser({ email, password });
        onLoginSuccess(res.user);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (currentUser?.user_code) {
      navigator.clipboard.writeText(currentUser.user_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative text-slate-100">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <User size={18} />
            </div>
            <h2 className="text-base font-bold text-white">
              {currentUser ? 'Your Profile' : isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {currentUser ? (
          /* Profile Details */
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-2xl flex items-center justify-center mx-auto border border-emerald-500/40">
                {currentUser.avatar || '🕌'}
              </div>
              <div>
                <h3 className="font-bold text-base text-white">{currentUser.name}</h3>
                <p className="text-xs text-slate-400">{currentUser.email}</p>
              </div>

              {/* User ID Badge with Copy */}
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 block mb-1">Your Unique Invite User ID:</span>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-emerald-800/60 text-emerald-400 font-mono text-xs font-bold">
                  <span>{currentUser.user_code}</span>
                  <button onClick={handleCopyCode} title="Copy User ID">
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Share this ID with family members to join their group!
                </p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs rounded-xl border border-rose-800/40 transition"
            >
              Sign Out
            </button>
          </div>
        ) : (
          /* Login / Register Form */
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            {isRegister && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1">Email Address</label>
              <input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Password</label>
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isRegister ? 'Create Account & Get ID' : 'Sign In'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg('');
                }}
                className="text-xs text-slate-400 hover:text-emerald-400 transition"
              >
                {isRegister
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
