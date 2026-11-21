import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  UserPlus,
  MessageSquare,
  Send,
  CheckCircle,
  Copy,
  Check,
  BookOpen,
  Sparkles,
  LogIn
} from 'lucide-react';
import {
  fetchMyGroups,
  createFamilyGroup,
  joinFamilyGroup,
  inviteFamilyMember,
  fetchGroupBoard,
  fetchGroupMessages,
  sendGroupMessage
} from '../services/api';

export default function FamilyGroupTab({ currentUser, onOpenAuth }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('board'); // 'board' | 'chat'
  const [boardData, setBoardData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Forms
  const [newGroupName, setNewGroupName] = useState('');
  const [joinGroupCode, setJoinGroupCode] = useState('');
  const [inviteUserCode, setInviteUserCode] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [copiedGroupCode, setCopiedGroupCode] = useState(false);

  // Load Groups
  useEffect(() => {
    if (currentUser?.id) {
      loadUserGroups();
    }
  }, [currentUser]);

  // Load Board & Chat for Selected Group
  useEffect(() => {
    if (selectedGroup?.id) {
      loadGroupBoardAndChat(selectedGroup.id);
      const interval = setInterval(() => {
        loadGroupMessagesOnly(selectedGroup.id);
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [selectedGroup]);

  const loadUserGroups = async () => {
    try {
      const g = await fetchMyGroups(currentUser.id);
      setGroups(g);
      if (g.length > 0 && !selectedGroup) {
        setSelectedGroup(g[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadGroupBoardAndChat = async (groupId) => {
    setLoading(true);
    try {
      const [board, msgs] = await Promise.all([
        fetchGroupBoard(groupId),
        fetchGroupMessages(groupId),
      ]);
      setBoardData(board);
      setMessages(msgs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupMessagesOnly = async (groupId) => {
    try {
      const msgs = await fetchGroupMessages(groupId);
      setMessages(msgs);
    } catch (e) {}
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName) return;
    try {
      await createFamilyGroup({ name: newGroupName, userId: currentUser.id });
      setNewGroupName('');
      setShowCreateModal(false);
      await loadUserGroups();
    } catch (err) {
      alert(err.message || 'Failed to create group');
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinGroupCode) return;
    try {
      await joinFamilyGroup({ groupCode: joinGroupCode, userId: currentUser.id });
      setJoinGroupCode('');
      setShowJoinModal(false);
      await loadUserGroups();
    } catch (err) {
      alert(err.message || 'Failed to join group');
    }
  };

  const handleInviteMember = async (e) => {
    e.preventDefault();
    if (!inviteUserCode || !selectedGroup) return;
    setInviteError('');
    setInviteSuccess('');
    try {
      const res = await inviteFamilyMember({
        groupId: selectedGroup.id,
        targetUserCode: inviteUserCode.trim(),
      });
      setInviteSuccess(`Successfully added ${res.invitedName} to the group!`);
      setInviteUserCode('');
      loadGroupBoardAndChat(selectedGroup.id);
      setTimeout(() => setInviteSuccess(''), 3000);
    } catch (err) {
      setInviteError(err.message || 'Could not find user with this ID');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup) return;
    const msgText = newMessage.trim();
    setNewMessage('');
    try {
      const sent = await sendGroupMessage({
        groupId: selectedGroup.id,
        userId: currentUser.id,
        userName: currentUser.name,
        message: msgText,
      });
      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedGroupCode(true);
    setTimeout(() => setCopiedGroupCode(false), 2000);
  };

  if (!currentUser) {
    return (
      <div className="py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
          👨‍👩‍👧‍👦
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Family Prayer & Quran Groups</h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
            Create a family circle, invite relatives by their User ID, chat together, and see each other's daily Salah & Quran completion!
          </p>
        </div>
        <button
          onClick={onOpenAuth}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 mx-auto active:scale-95 transition"
        >
          <LogIn size={15} />
          <span>Sign In / Create Account to Start</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24 text-slate-100">
      {/* User ID Header Banner */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            {currentUser.name?.[0] || 'U'}
          </div>
          <div>
            <span className="font-bold text-white block">{currentUser.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">Your ID: {currentUser.user_code}</span>
          </div>
        </div>

        <button
          onClick={() => handleCopyCode(currentUser.user_code)}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium"
        >
          {copiedGroupCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          <span>Copy ID</span>
        </button>
      </div>

      {/* Group Navigation & Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 overflow-x-auto flex items-center gap-1.5 pb-1">
          {groups.map((g) => (
            <button
              key={g.id}
              onClick={() => setSelectedGroup(g)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition border ${
                selectedGroup?.id === g.id
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 hover:bg-emerald-900 transition active:scale-95"
            title="Create Group"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-900 text-slate-300 border border-slate-800 text-xs font-medium hover:bg-slate-800"
          >
            Join
          </button>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
          <Users size={32} className="mx-auto text-emerald-400" />
          <h3 className="text-sm font-bold text-white">No Family Groups Yet</h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Create a group to invite your parents, spouse, or siblings and track prayers together!
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-md"
          >
            Create Your First Group
          </button>
        </div>
      ) : selectedGroup ? (
        <>
          {/* Active Group Header with Invite Button */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                {selectedGroup.name}
                <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
                  {selectedGroup.group_code}
                </span>
              </h2>
              <span className="text-[11px] text-slate-400">
                {boardData?.members?.length || 1} family members
              </span>
            </div>

            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/60 rounded-xl text-xs font-semibold active:scale-95 transition"
            >
              <UserPlus size={13} />
              <span>Invite by ID</span>
            </button>
          </div>

          {/* Subtabs: Prayer Board vs Chat */}
          <div className="flex items-center bg-slate-900/60 p-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('board')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeSubTab === 'board'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle size={14} />
              <span>Live Salah & Quran Board</span>
            </button>
            <button
              onClick={() => setActiveSubTab('chat')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeSubTab === 'chat'
                  ? 'bg-emerald-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare size={14} />
              <span>Family Chat</span>
            </button>
          </div>

          {/* 1. Live Prayer & Quran Board */}
          {activeSubTab === 'board' && (
            <div className="space-y-2.5">
              {boardData?.members?.map((member) => (
                <div
                  key={member.id}
                  className="rounded-2xl p-4 bg-slate-900/70 border border-slate-800 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                        {member.name?.[0]}
                      </div>
                      <div>
                        <span className="font-bold text-white text-xs block">{member.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{member.user_code}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-900">
                        {member.completedCount} / 5 Prayed
                      </span>
                    </div>
                  </div>

                  {/* 5 Prayers Progress Row */}
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => {
                      const st = member.prayers[p];
                      const isDone = st === 'completed' || st === 'jamaah';
                      return (
                        <div
                          key={p}
                          className={`p-1.5 rounded-xl text-center border ${
                            isDone
                              ? 'bg-emerald-950/80 border-emerald-700/60 text-emerald-300'
                              : st === 'late'
                              ? 'bg-amber-950/80 border-amber-800 text-amber-300'
                              : 'bg-slate-950 border-slate-800/80 text-slate-500'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase block">{p.slice(0, 3)}</span>
                          <span className="text-[11px] font-semibold">{isDone ? '✓' : '—'}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quran Progress for Member */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
                    <span className="flex items-center gap-1.5 text-teal-400 font-medium text-[11px]">
                      <BookOpen size={12} />
                      <span>Quran Today:</span>
                    </span>
                    <span className="font-semibold text-slate-200">
                      {member.quran?.completed
                        ? `✓ Read ${member.quran.amount_read || 2} Pages`
                        : 'Not yet recorded'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. Group Chat */}
          {activeSubTab === 'chat' && (
            <div className="rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col h-[400px] overflow-hidden">
              {/* Message List */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-10">
                    No messages yet. Send a salam to your family!
                  </p>
                ) : (
                  messages.map((m, idx) => {
                    const isMe = m.user_id === currentUser.id;
                    return (
                      <div
                        key={idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        {!isMe && (
                          <span className="text-[10px] text-slate-400 font-semibold mb-0.5">
                            {m.user_name}
                          </span>
                        )}
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                            isMe
                              ? 'bg-emerald-600 text-white rounded-br-none'
                              : 'bg-slate-800 text-slate-100 rounded-bl-none'
                          }`}
                        >
                          {m.message}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-2 border-t border-slate-800 flex items-center gap-2 bg-slate-950">
                <input
                  type="text"
                  placeholder="Message family..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition active:scale-95"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>
          )}
        </>
      ) : null}

      {/* Modal: Create Group */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateGroup} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-sm w-full space-y-3">
            <h3 className="font-bold text-sm text-white">Create Family Group</h3>
            <input
              type="text"
              required
              placeholder="e.g. Kalarickal Family"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Join Group */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleJoinGroup} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-sm w-full space-y-3">
            <h3 className="font-bold text-sm text-white">Join Family Group</h3>
            <input
              type="text"
              required
              placeholder="Enter Group Code (e.g. FAM-8391)"
              value={joinGroupCode}
              onChange={(e) => setJoinGroupCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl"
              >
                Join
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Invite Member by User ID */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleInviteMember} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-sm w-full space-y-3">
            <h3 className="font-bold text-sm text-white">Invite Family Member</h3>
            <p className="text-xs text-slate-400">
              Ask your family member for their User ID (e.g. <span className="font-mono text-emerald-400 font-bold">USR-XXXX</span>) and enter it below:
            </p>
            <input
              type="text"
              required
              placeholder="e.g. USR-4921"
              value={inviteUserCode}
              onChange={(e) => setInviteUserCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono uppercase"
            />

            {inviteSuccess && <p className="text-xs text-emerald-400 font-semibold">{inviteSuccess}</p>}
            {inviteError && <p className="text-xs text-rose-400">{inviteError}</p>}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteSuccess('');
                  setInviteError('');
                }}
                className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs rounded-xl"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl"
              >
                Add Member
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
