import React, { useState, useEffect, useRef } from 'react';
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
  LogIn,
  Image as ImageIcon,
  X,
  Maximize2
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
import { showNotification, playBellRing } from '../utils/notifications';

export default function FamilyGroupTab({ currentUser, onOpenAuth }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [activeSubTab, setActiveSubTab] = useState('board'); // 'board' | 'chat'
  const [boardData, setBoardData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [viewingPhoto, setViewingPhoto] = useState(null);
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

  // Refs for chat scroll & tracking notified message IDs
  const chatBottomRef = useRef(null);
  const notifiedMessageIdsRef = useRef(new Set());

  // Quick Salam & Reply Shortcuts
  const quickShortcuts = [
    'Assalamu Alaikum wa Rahmatullah 🌿',
    'Wa Alaikum Assalam wa Rahmatullah 🤝',
    'Alhamdulillah 🤲',
    'JazakAllah Khair ✨',
    'Time for Jama’ah! 🕌',
    'Completed my Salah Alhamdulillah 🕋',
    'May Allah accept our prayers 🤲'
  ];

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
        pollGroupMessages(selectedGroup.id);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedGroup]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (activeSubTab === 'chat') {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeSubTab]);

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
      // Mark current messages as notified
      msgs.forEach((m) => notifiedMessageIdsRef.current.add(m.id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pollGroupMessages = async (groupId) => {
    try {
      const msgs = await fetchGroupMessages(groupId);
      if (msgs && msgs.length > 0) {
        // Check for new messages from other family members
        msgs.forEach((m) => {
          if (!notifiedMessageIdsRef.current.has(m.id)) {
            notifiedMessageIdsRef.current.add(m.id);
            if (m.user_id !== currentUser?.id) {
              // Trigger Notification with Bell sound
              playBellRing();
              showNotification({
                title: `💬 ${m.user_name} (${selectedGroup?.name || 'Family'})`,
                body: m.message || '📷 Sent a photo',
                sound: true,
              });
            }
          }
        });
        setMessages(msgs);
      }
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

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress as clean JPEG at 0.75 quality (~80KB to 150KB)
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
        setSelectedPhoto(compressedDataUrl);
      };
      img.src = event.target?.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (textToSend) => {
    const text = typeof textToSend === 'string' ? textToSend : newMessage;
    if ((!text || !text.trim()) && !selectedPhoto) return;
    const msgText = (text || '').trim();
    const photo = selectedPhoto;

    setNewMessage('');
    setSelectedPhoto(null);

    try {
      const sent = await sendGroupMessage({
        groupId: selectedGroup.id,
        userId: currentUser.id,
        userName: currentUser.name,
        message: msgText,
        image: photo,
      });
      if (sent?.id) {
        notifiedMessageIdsRef.current.add(sent.id);
      }
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
            Create a family circle, invite relatives by User ID, chat together with photo sharing, and celebrate prayer completions!
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
    <div className="space-y-3 pb-24 text-slate-100">
      {/* User ID Header Banner */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
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
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-medium"
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
            Create a family circle to invite relatives by User ID and track prayers together!
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
                  ? 'bg-emerald-500 text-slate-950 shadow'
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
                  ? 'bg-emerald-500 text-slate-950 shadow'
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

          {/* 2. Family Chat (Fixed Bottom Layout) */}
          {activeSubTab === 'chat' && (
            <div className="flex flex-col h-[520px] rounded-3xl bg-slate-900/90 border border-slate-800 overflow-hidden relative shadow-2xl">
              {/* Message Feed */}
              <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
                {messages.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-12">
                    No messages yet. Send a Salam or prayer reminder to your family!
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
                          <span className="text-[10px] text-slate-400 font-semibold mb-0.5 px-1">
                            {m.user_name}
                          </span>
                        )}
                        <div
                          className={`max-w-[82%] rounded-2xl p-2.5 text-xs leading-relaxed space-y-1.5 ${
                            isMe
                              ? 'bg-emerald-600 text-white rounded-br-none shadow-md'
                              : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60 shadow-md'
                          }`}
                        >
                          {/* Image Attachment in Chat Bubble */}
                          {m.image && (
                            <div
                              onClick={() => setViewingPhoto(m.image)}
                              className="cursor-pointer overflow-hidden rounded-xl border border-white/20 max-h-52"
                            >
                              <img
                                src={m.image}
                                alt="Chat attachment"
                                className="w-full h-auto object-cover hover:scale-105 transition duration-200"
                              />
                            </div>
                          )}
                          {m.message && <p className="whitespace-pre-wrap">{m.message}</p>}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Selected Photo Preview before sending */}
              {selectedPhoto && (
                <div className="px-3 py-1.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={selectedPhoto} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-emerald-500" />
                    <span className="text-[11px] text-emerald-400 font-medium">Photo attached</span>
                  </div>
                  <button onClick={() => setSelectedPhoto(null)} className="p-1 text-slate-400 hover:text-white">
                    <X size={15} />
                  </button>
                </div>
              )}

              {/* Quick Salam & Reply Shortcut Chips */}
              <div className="px-2 py-1.5 bg-slate-950/80 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {quickShortcuts.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(chip)}
                    className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-emerald-300 font-medium whitespace-nowrap hover:bg-emerald-950 hover:border-emerald-700 active:scale-95 transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Fixed Bottom Input Bar */}
              <div className="p-2 border-t border-slate-800 bg-slate-950 flex items-center gap-1.5">
                {/* Photo Attachment Button */}
                <label className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 cursor-pointer active:scale-95 transition">
                  <ImageIcon size={17} />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </label>

                <input
                  type="text"
                  placeholder="Message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />

                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition active:scale-95 font-bold shadow-md shadow-emerald-500/20"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Lightbox / View Full Photo Modal */}
      {viewingPhoto && (
        <div
          onClick={() => setViewingPhoto(null)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
        >
          <img src={viewingPhoto} alt="Full view" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" />
        </div>
      )}

      {/* Modal: Create Group */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateGroup} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl max-w-sm w-full space-y-3">
            <h3 className="font-bold text-sm text-white">Create Family Group</h3>
            <input
              type="text"
              required
              placeholder="Group Name"
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
              placeholder="Group Code"
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
            <input
              type="text"
              required
              placeholder="User ID"
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
