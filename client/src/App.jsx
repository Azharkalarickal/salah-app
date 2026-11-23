import React, { useState, useEffect, useRef } from 'react';
import { X, BellRing, Send, Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import HeroPrayerCard from './components/HeroPrayerCard';
import PrayerList from './components/PrayerList';
import MotivationalBanner from './components/MotivationalBanner';
import QuranTab from './components/QuranTab';
import StatsTab from './components/StatsTab';
import SettingsTab from './components/SettingsTab';
import CallAlertModal from './components/CallAlertModal';
import AuthModal from './components/AuthModal';
import AdminModal from './components/AdminModal';
import FamilyGroupTab from './components/FamilyGroupTab';
import EditPrayerTimesModal from './components/EditPrayerTimesModal';
import IncomingGroupCallModal from './components/IncomingGroupCallModal';
import GroupCallModal from './components/GroupCallModal';

import {
  fetchTodaySalah,
  logSalahStatus,
  fetchSettings,
  updatePrayerSettings,
  fetchQuranToday,
  logQuranReading,
  updateQuranSettings,
  fetchMotivation,
  fetchHourlyMotivation,
  fetchMyGroups,
  fetchGroupMessages,
  sendGroupMessage,
  saveUserCustomTimes,
  fetchLatestBroadcast,
  fetchMyIncomingGroupCall,
  joinGroupCall,
  leaveGroupCall,
  initGuestSession,
} from './services/api';
import {
  requestNotificationPermission,
  showNotification,
  playChime,
  playBellRing,
  startBackgroundAudioKeepAlive,
  requestScreenWakeLock,
} from './utils/notifications';

export default function App() {
  const [activeTab, setActiveTab] = useState('prayers');
  const [salahData, setSalahData] = useState(null);
  const [quranData, setQuranData] = useState(null);
  const [settings, setSettings] = useState(null);
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifPermission, setNotifPermission] = useState(
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  // User Authentication State
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('salah_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showEditTimesModal, setShowEditTimesModal] = useState(false);
  const [callAlertData, setCallAlertData] = useState(null);
  const [adminAnnouncement, setAdminAnnouncement] = useState(null);

  // Chat Quick Reply State (Message Reply box & Send button — NO "I Prayed" button)
  const [chatQuickReplyData, setChatQuickReplyData] = useState(null);
  const [chatReplyText, setChatReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Group Voice Calling State
  const [activeGroupCall, setActiveGroupCall] = useState(null);
  const [incomingGroupCall, setIncomingGroupCall] = useState(null);
  const declinedCallIdsRef = useRef(new Set());

  // Keep track of sent notifications (prevent repeats)
  const sentAlertsRef = useRef(new Set());
  const notifiedBroadcastIdsRef = useRef(new Set());
  const notifiedChatMsgIdsRef = useRef(new Set());

  // Local date in YYYY-MM-DD (Kochi, Kerala / IST)
  const getTodayDateStr = () => {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  };

  const [todayDateStr, setTodayDateStr] = useState(getTodayDateStr);
  const [selectedDate, setSelectedDate] = useState(getTodayDateStr);

  // Load initial data
  const loadData = async (user, targetDate) => {
    const activeDate = targetDate || selectedDate || getTodayDateStr();
    const uId = user?.id || currentUser?.id;
    if (!uId) return;

    try {
      const [todaySalah, quran, appSettings, initialQuote] = await Promise.all([
        fetchTodaySalah(activeDate, uId),
        fetchQuranToday(activeDate, uId),
        fetchSettings(),
        fetchMotivation('general'),
      ]);

      setSalahData(todaySalah);
      setQuranData(quran);
      setSettings(appSettings.prayer);
      setQuote(initialQuote);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Ensure unique session per device so no users ever share User ID 1
  useEffect(() => {
    async function ensureUserSession() {
      if (currentUser?.id) {
        loadData(currentUser, selectedDate);
        return;
      }

      let deviceId = localStorage.getItem('salah_device_id');
      if (!deviceId) {
        deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
        localStorage.setItem('salah_device_id', deviceId);
      }

      try {
        const guestRes = await initGuestSession(deviceId);
        if (guestRes?.user) {
          setCurrentUser(guestRes.user);
          localStorage.setItem('salah_user', JSON.stringify(guestRes.user));
          loadData(guestRes.user, selectedDate);
          return;
        }
      } catch (err) {
        console.warn('Guest session fallback:', err);
      }
      loadData(null, selectedDate);
    }

    ensureUserSession();
  }, []);

  // When selectedDate changes, fetch that specific date's marked salah
  useEffect(() => {
    if (currentUser?.id && selectedDate) {
      fetchTodaySalah(selectedDate, currentUser.id)
        .then((data) => setSalahData(data))
        .catch((e) => console.error('Failed to load date salah:', e));
    }
  }, [selectedDate, currentUser?.id]);

  // Midnight Day Rollover Watcher (each day fresh pending salah)
  useEffect(() => {
    const timer = setInterval(() => {
      const currentToday = getTodayDateStr();
      if (currentToday !== todayDateStr) {
        setTodayDateStr(currentToday);
        setSelectedDate((prev) => (prev === todayDateStr ? currentToday : prev));
      }
    }, 30000);
    return () => clearInterval(timer);
  }, [todayDateStr]);

  // Date Navigation Helpers
  const handleNavigateDate = (offsetDays) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    dateObj.setDate(dateObj.getDate() + offsetDays);
    const newDateStr = new Intl.DateTimeFormat('en-CA').format(dateObj);
    setSelectedDate(newDateStr);
  };

  const getYesterdayDateStr = () => {
    const [y, m, d] = todayDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d - 1);
    return new Intl.DateTimeFormat('en-CA').format(dateObj);
  };

  // 24/7 Render Keep-Alive Client Pinger (Pings every 12 minutes so Render never sleeps)
  useEffect(() => {
    const pingServer = async () => {
      try {
        await fetch('/api/ping');
      } catch (e) {}
    };

    pingServer();
    const pingInterval = setInterval(pingServer, 12 * 60 * 1000);
    return () => clearInterval(pingInterval);
  }, []);

  // 24-Hour Continuous Background Audio & WakeLock Engine
  useEffect(() => {
    const is24hEnabled = localStorage.getItem('salah_24h_background') !== 'false';
    if (is24hEnabled) {
      startBackgroundAudioKeepAlive();
      requestScreenWakeLock();
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('salah_user', JSON.stringify(user));
    } catch (e) { }
    loadData(user, selectedDate);
  };

  const handleLogout = async () => {
    localStorage.removeItem('salah_user');
    setCurrentUser(null);
    setShowAuthModal(false);

    let deviceId = localStorage.getItem('salah_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('salah_device_id', deviceId);
    }
    try {
      const guestRes = await initGuestSession(deviceId);
      if (guestRes?.user) {
        setCurrentUser(guestRes.user);
        localStorage.setItem('salah_user', JSON.stringify(guestRes.user));
        loadData(guestRes.user, selectedDate);
        return;
      }
    } catch (e) {}
    loadData(null, selectedDate);
  };

  // Compute active & next prayer from today's times
  const computeActiveAndNextPrayer = () => {
    if (!salahData?.prayers || salahData.prayers.length === 0) {
      return { current: null, next: null };
    }

    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();

    const prayerMins = salahData.prayers.map((p) => {
      const [h, m] = p.time.split(':').map(Number);
      return { ...p, totalMins: h * 60 + m };
    });

    let current = null;
    let next = null;

    for (let i = 0; i < prayerMins.length; i++) {
      if (currentMins >= prayerMins[i].totalMins) {
        current = prayerMins[i];
      }
    }

    if (!current) {
      current = prayerMins[prayerMins.length - 1];
      next = prayerMins[0];
    } else {
      const currentIndex = prayerMins.findIndex((p) => p.name === current.name);
      if (currentIndex === prayerMins.length - 1) {
        next = prayerMins[0];
      } else {
        next = prayerMins[currentIndex + 1];
      }
    }

    return { current, next };
  };

  const { current: currentPrayer, next: nextPrayer } = computeActiveAndNextPrayer();

  // Notification & Call Alert Engine (runs every 30 seconds)
  useEffect(() => {
    if (!salahData?.prayers || !settings) return;

    const interval = setInterval(async () => {
      const now = new Date();
      const currentH = now.getHours();
      const currentM = now.getMinutes();
      const nowMins = currentH * 60 + currentM;
      const todayStr = now.toISOString().slice(0, 10);

      const followupMinutes = Number(settings.followup_reminder_minutes) || 30;
      const enableSound = Boolean(settings.enable_sound);

      // Check each prayer for on-time and follow-up notifications
      for (const prayer of salahData.prayers) {
        const [h, m] = prayer.time.split(':').map(Number);
        const prayerMins = h * 60 + m;

        // On-Time Azan alert
        const onTimeKey = `${todayStr}-${prayer.name}-ontime`;
        if (nowMins === prayerMins && !sentAlertsRef.current.has(onTimeKey)) {
          sentAlertsRef.current.add(onTimeKey);
          setCallAlertData({
            prayer,
            quote: quote || { message: "Hayya 'ala-Salah — Come to Prayer." },
          });

          showNotification({
            title: `Time for ${prayer.name.toUpperCase()} Prayer`,
            body: `Hayya 'ala-Salah — It is now time for ${prayer.name}. Stand before Allah.`,
            prayer: prayer.name,
            sound: enableSound,
          });
        }

        // Follow-up Motivational Alert (if NOT yet completed after followupMinutes)
        const followupKey = `${todayStr}-${prayer.name}-followup`;
        const followupTargetMins = prayerMins + followupMinutes;

        if (
          nowMins >= followupTargetMins &&
          nowMins < followupTargetMins + 5 &&
          prayer.status === 'pending' &&
          !sentAlertsRef.current.has(followupKey)
        ) {
          sentAlertsRef.current.add(followupKey);
          try {
            const motivation = await fetchMotivation(prayer.name);
            setCallAlertData({
              prayer,
              quote: motivation,
            });

            showNotification({
              title: `Have you prayed ${prayer.name.toUpperCase()} yet?`,
              body: motivation.message || `A gentle reminder to pray ${prayer.name}. Take 5 minutes for your soul.`,
              prayer: prayer.name,
              sound: enableSound,
            });
          } catch (e) { }
        }
      }

      // Quran daily reminder
      if (quranData?.settings?.reminder_enabled && !quranData?.todayLog?.completed) {
        const qTime = quranData.settings.reminder_time?.slice(0, 5) || '20:30';
        const [qh, qm] = qTime.split(':').map(Number);
        const quranMins = qh * 60 + qm;
        const quranKey = `${todayStr}-quran-reminder`;

        if (nowMins === quranMins && !sentAlertsRef.current.has(quranKey)) {
          sentAlertsRef.current.add(quranKey);
          showNotification({
            title: '📖 Daily Quran Reading Reminder',
            body: 'Even reciting a few verses will illuminate your night and bring peace to your heart.',
            sound: enableSound,
          });
        }
      }

      // Check for Admin Broadcast Announcements
      checkAdminBroadcast();
    }, 30000);

    // Initial check on load
    checkAdminBroadcast();

    return () => clearInterval(interval);
  }, [salahData, settings, quranData, quote]);

  const checkAdminBroadcast = async () => {
    try {
      const latest = await fetchLatestBroadcast();
      if (latest && latest.id) {
        const lastNotified = localStorage.getItem('salah_last_admin_broadcast_id');
        const lastDismissed = localStorage.getItem('salah_dismissed_broadcast_id');

        // Show banner only if user has not explicitly dismissed this broadcast
        if (lastDismissed !== String(latest.id)) {
          setAdminAnnouncement(latest);
        }

        // Trigger sound and system push notification ONLY ONCE per broadcast ID
        if (
          (!lastNotified || Number(lastNotified) < latest.id) &&
          !notifiedBroadcastIdsRef.current.has(latest.id)
        ) {
          notifiedBroadcastIdsRef.current.add(latest.id);
          localStorage.setItem('salah_last_admin_broadcast_id', String(latest.id));
          playBellRing();
          showNotification({
            title: `📢 ${latest.title}`,
            body: latest.message,
            sound: true,
          });
        }
      } else {
        setAdminAnnouncement(null);
      }
    } catch (e) { }
  };

  const dismissAdminAnnouncement = () => {
    if (adminAnnouncement?.id) {
      localStorage.setItem('salah_dismissed_broadcast_id', String(adminAnnouncement.id));
    }
    setAdminAnnouncement(null);
  };

  // Poll for incoming family chat messages (runs every 10 seconds)
  useEffect(() => {
    if (!currentUser?.id) return;

    const pollChat = async () => {
      try {
        const groups = await fetchMyGroups(currentUser.id);
        if (!groups || groups.length === 0) return;

        for (const g of groups) {
          const msgs = await fetchGroupMessages(g.id);
          if (msgs && msgs.length > 0) {
            const lastMsg = msgs[msgs.length - 1];
            // If message is from someone else and not yet notified
            if (
              lastMsg &&
              lastMsg.user_id !== currentUser.id &&
              !notifiedChatMsgIdsRef.current.has(lastMsg.id)
            ) {
              notifiedChatMsgIdsRef.current.add(lastMsg.id);
              playBellRing();
              showNotification({
                title: `💬 ${lastMsg.user_name} (${g.name})`,
                body: lastMsg.message || '📷 Sent a photo',
                sound: true,
              });

              // Show Quick Reply Notification Card
              setChatQuickReplyData({
                groupId: g.id,
                groupName: g.name,
                messageId: lastMsg.id,
                senderName: lastMsg.user_name,
                message: lastMsg.message,
                image: lastMsg.image,
              });
            }
          }
        }
      } catch (e) { }
    };

    pollChat();
    const chatInterval = setInterval(pollChat, 10000);
    return () => clearInterval(chatInterval);
  }, [currentUser]);

  const handleSendQuickReply = async () => {
    if (!chatReplyText.trim() || !chatQuickReplyData || !currentUser?.id) return;
    setSendingReply(true);
    try {
      await sendGroupMessage({
        groupId: chatQuickReplyData.groupId,
        userId: currentUser.id,
        userName: currentUser.name,
        message: chatReplyText.trim(),
      });
      setChatReplyText('');
      setChatQuickReplyData(null);
    } catch (err) {
      alert('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  // Group Voice Calling: Incoming Call Detection Engine
  useEffect(() => {
    if (!currentUser?.id) return;

    const pollIncomingCalls = async () => {
      try {
        const res = await fetchMyIncomingGroupCall(currentUser.id);
        if (res && res.hasCall && res.call) {
          const call = res.call;
          // If caller is current user, they initiated it (already connected)
          if (
            Number(call.caller_id) !== Number(currentUser.id) &&
            !activeGroupCall &&
            !declinedCallIdsRef.current.has(call.id)
          ) {
            setIncomingGroupCall(call);
          }
        } else if (incomingGroupCall) {
          setIncomingGroupCall(null);
        }
      } catch (e) { }
    };

    pollIncomingCalls();
    const callInterval = setInterval(pollIncomingCalls, 3500);
    return () => clearInterval(callInterval);
  }, [currentUser, activeGroupCall, incomingGroupCall]);

  const handleAcceptIncomingCall = async (call) => {
    try {
      await joinGroupCall({
        callId: call.id,
        userId: currentUser.id,
        userName: currentUser.name || 'Family Member',
      });
      setActiveGroupCall(call);
    } catch (err) {
      console.error('Failed to accept group call:', err);
    } finally {
      setIncomingGroupCall(null);
    }
  };

  const handleDeclineIncomingCall = async (call) => {
    declinedCallIdsRef.current.add(call.id);
    try {
      await leaveGroupCall({ callId: call.id, userId: currentUser.id });
    } catch (e) { }
    setIncomingGroupCall(null);
  };

  // Hourly Salah, Time & Akhirah Reminder Engine (User can enable or disable)
  const triggerHourlyReminder = async () => {
    try {
      const motivation = await fetchHourlyMotivation();
      setQuote(motivation);
      playBellRing();
      showNotification({
        title: '⏳ സമയത്തിന്റെ വിലയും പരലോക സ്മരണയും',
        body: motivation.message,
        sound: true,
      });
      localStorage.setItem('salah_last_hourly_reminder', String(Date.now()));
    } catch (e) { }
  };

  useEffect(() => {
    const hourlyTimer = setInterval(() => {
      const isEnabled = localStorage.getItem('salah_hourly_reminder_enabled') !== 'false';
      if (!isEnabled) return;

      const lastReminder = localStorage.getItem('salah_last_hourly_reminder');
      const now = Date.now();
      if (!lastReminder || now - Number(lastReminder) >= 60 * 60 * 1000) {
        triggerHourlyReminder();
      }
    }, 60000);

    return () => clearInterval(hourlyTimer);
  }, []);

  const handleRequestNotif = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      showNotification({
        title: 'Alerts Enabled! 🔔',
        body: 'You will receive reminders for prayer times and daily Quran recitation.',
        sound: true,
      });
    }
  };

  const handleTestNotif = () => {
    playChime('chime');
    showNotification({
      title: 'Test Salah Notification',
      body: 'Notifications and gentle reminder sounds are working perfectly!',
      prayer: 'dhuhr',
      sound: true,
    });
  };

  const handleTriggerCallAlert = () => {
    setCallAlertData({
      prayer: currentPrayer || { name: 'dhuhr', time: '12:30' },
      quote: quote || {
        message: 'Success begins with Salah. Take 5 minutes to fulfill your covenant with Allah.',
        source: "Surah Al-Mu'minun",
      },
    });
  };

  const handleUpdateStatus = async (prayerName, newStatus) => {
    const uId = currentUser?.id || 1;
    try {
      setSalahData((prev) => ({
        ...prev,
        prayers: prev.prayers.map((p) =>
          p.name === prayerName ? { ...p, status: newStatus } : p
        ),
      }));

      await logSalahStatus(prayerName, newStatus, selectedDate, uId);
    } catch (err) {
      console.error('Failed to log salah status:', err);
      if (currentUser?.id) {
        const fresh = await fetchTodaySalah(selectedDate, currentUser.id);
        setSalahData(fresh);
      }
    }
  };

  const handleLogQuran = async (payload) => {
    const uId = currentUser?.id || 1;
    try {
      await logQuranReading({ ...payload, date: selectedDate, userId: uId });
      const updatedQuran = await fetchQuranToday(selectedDate, uId);
      setQuranData(updatedQuran);

      // If user completed their Quran reading, broadcast celebration message in family group chat
      if (currentUser?.id && payload?.completed) {
        try {
          const userGroups = await fetchMyGroups(currentUser.id);
          if (userGroups && userGroups.length > 0) {
            const readingText = payload.amount_read
              ? `📖 Alhamdulillah! I just completed reading ${payload.amount_read} pages of the Holy Quran! 🤲`
              : `📖 Alhamdulillah! I just completed my daily Quran reading! 🤲`;
            for (const grp of userGroups) {
              await sendGroupMessage({
                groupId: grp.id,
                userId: currentUser.id,
                userName: currentUser.name,
                message: readingText,
              });
            }
          }
        } catch (e) {
          console.warn('Could not broadcast Quran milestone to groups:', e);
        }
      }
    } catch (err) {
      console.error('Failed to update Quran log:', err);
    }
  };

  const handleSaveCustomTimes = async (customPayload) => {
    try {
      await saveUserCustomTimes(customPayload);
      const refreshedSalah = await fetchTodaySalah(undefined, currentUser?.id || 1);
      setSalahData(refreshedSalah);
    } catch (err) {
      console.error('Failed to save custom times:', err);
      throw err;
    }
  };

  const handleSavePrayerSettings = async (newSettings) => {
    try {
      const res = await updatePrayerSettings(newSettings);
      setSettings(res.settings);
      const refreshedSalah = await fetchTodaySalah(undefined, currentUser?.id || 1);
      setSalahData(refreshedSalah);
    } catch (err) {
      console.error('Failed to save prayer settings:', err);
    }
  };

  const handleRefreshQuote = async () => {
    setLoadingQuote(true);
    try {
      const newQuote = await fetchMotivation(currentPrayer?.name || 'general');
      setQuote(newQuote);
    } finally {
      setLoadingQuote(false);
    }
  };

  const currentPrayerIsCompleted =
    currentPrayer?.status === 'completed' || currentPrayer?.status === 'jamaah';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar
        city={settings?.city || 'Kochi'}
        country={settings?.country || 'India (Kerala)'}
        notifPermission={notifPermission}
        onRequestNotif={handleRequestNotif}
        onTestNotif={handleTestNotif}
        onTriggerCallAlert={handleTriggerCallAlert}
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenAdmin={() => setShowAdminModal(true)}
        onOpenEditTimes={() => setShowEditTimesModal(true)}
      />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-24 space-y-4">
        {/* Chat Incoming Notification with Inline Reply & Send Button (NO I Prayed button) */}
        {chatQuickReplyData && (
          <div className="rounded-2xl bg-slate-900/95 border border-emerald-500/80 p-3.5 shadow-2xl shadow-emerald-950/50 space-y-2.5 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-xs">
                  {chatQuickReplyData.senderName?.[0] || '💬'}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    💬 {chatQuickReplyData.senderName}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {chatQuickReplyData.groupName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setChatQuickReplyData(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition"
                title="Dismiss"
              >
                <X size={15} />
              </button>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-200">
              {chatQuickReplyData.image && (
                <img
                  src={chatQuickReplyData.image}
                  alt="Attachment"
                  className="w-20 h-20 object-cover rounded-lg mb-1.5 border border-slate-700"
                />
              )}
              <p>{chatQuickReplyData.message || '📷 Photo attachment'}</p>
            </div>

            {/* Inline Reply input and Send Button — strictly NO prayer button */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                placeholder="Type your reply here..."
                value={chatReplyText}
                onChange={(e) => setChatReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendQuickReply();
                  }
                }}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <button
                type="button"
                disabled={sendingReply || !chatReplyText.trim()}
                onClick={handleSendQuickReply}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40 shadow-sm"
              >
                <Send size={13} />
                <span>{sendingReply ? 'Sending...' : 'Send'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Admin Broadcast Announcement Banner */}
        {adminAnnouncement && (
          <div className="rounded-2xl bg-gradient-to-r from-amber-950/90 via-slate-900 to-slate-950 border border-amber-700/60 p-3.5 flex items-start justify-between gap-3 shadow-xl shadow-amber-950/30 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <span className="text-xl">📢</span>
              <div>
                <span className="text-xs font-bold text-amber-300 block">{adminAnnouncement.title}</span>
                <p className="text-xs text-slate-200 mt-0.5 leading-relaxed">{adminAnnouncement.message}</p>
              </div>
            </div>
            <button
              onClick={dismissAdminAnnouncement}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition shrink-0"
              title="Dismiss announcement"
            >
              <X size={15} />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading prayer times & database...</span>
          </div>
        ) : (
          <>
            {/* PRAYERS TAB */}
            {activeTab === 'prayers' && (
              <>
                <HeroPrayerCard
                  nextPrayer={nextPrayer}
                  currentPrayer={currentPrayer}
                  onMarkPrayed={handleUpdateStatus}
                  isCompleted={currentPrayerIsCompleted}
                />

                {/* Day Switcher / Previous Days Navigator */}
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-sm">
                  <button
                    onClick={() => handleNavigateDate(-1)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="Previous Day"
                  >
                    <ChevronLeft size={16} />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-bold text-white cursor-pointer hover:border-emerald-500/50 transition">
                      <Calendar size={13} className="text-emerald-400" />
                      <span>
                        {selectedDate === todayDateStr
                          ? 'Today'
                          : selectedDate === getYesterdayDateStr()
                          ? 'Yesterday'
                          : selectedDate}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal font-mono">
                        ({selectedDate})
                      </span>
                      <input
                        type="date"
                        value={selectedDate}
                        max={todayDateStr}
                        onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                        className="sr-only"
                      />
                    </label>

                    {selectedDate !== todayDateStr && (
                      <button
                        onClick={() => setSelectedDate(todayDateStr)}
                        className="px-2.5 py-1 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 text-emerald-400 border border-emerald-800/80 text-[11px] font-semibold transition active:scale-95 cursor-pointer flex items-center gap-1"
                        title="Jump back to today"
                      >
                        <RotateCcw size={11} />
                        <span>Today</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handleNavigateDate(1)}
                    disabled={selectedDate >= todayDateStr}
                    className={`p-2 rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                      selectedDate >= todayDateStr
                        ? 'opacity-40 cursor-not-allowed text-slate-600 bg-slate-900'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title="Next Day"
                  >
                    <span>Next</span>
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Info banner when viewing a past date */}
                {selectedDate !== todayDateStr && (
                  <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/40 text-amber-200/90 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-amber-400 shrink-0" />
                      <span>
                        Viewing marked Salah for <b>{selectedDate === getYesterdayDateStr() ? 'Yesterday' : selectedDate}</b>
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedDate(todayDateStr)}
                      className="text-xs text-amber-300 underline font-semibold cursor-pointer shrink-0 ml-2"
                    >
                      Go to Today
                    </button>
                  </div>
                )}

                <MotivationalBanner
                  quote={quote}
                  onRefresh={handleRefreshQuote}
                  loading={loadingQuote}
                />

                <PrayerList
                  prayers={salahData?.prayers || []}
                  onUpdateStatus={handleUpdateStatus}
                  currentPrayerName={currentPrayer?.name}
                  isPastDate={selectedDate < todayDateStr}
                  selectedDate={selectedDate}
                />
              </>
            )}

            {/* FAMILY GROUPS TAB */}
            {activeTab === 'family' && (
              <FamilyGroupTab
                currentUser={currentUser}
                onOpenAuth={() => setShowAuthModal(true)}
                onStartCall={(call) => setActiveGroupCall(call)}
                onJoinCall={(call) => setActiveGroupCall(call)}
                activeGroupCall={activeGroupCall}
              />
            )}

            {/* QURAN TAB */}
            {activeTab === 'quran' && (
              <QuranTab
                quranData={quranData}
                onLogReading={handleLogQuran}
                onUpdateSettings={async (payload) => {
                  await updateQuranSettings(payload);
                  const q = await fetchQuranToday(undefined, currentUser?.id || 1);
                  setQuranData(q);
                }}
              />
            )}

            {/* INSIGHTS / STATS TAB (Includes Full Year Data Charts) */}
            {activeTab === 'stats' && <StatsTab userId={currentUser?.id || 1} />}

            {/* SETTINGS TAB */}
            {activeTab === 'settings' && (
              <SettingsTab
                settings={settings}
                onSaveSettings={handleSavePrayerSettings}
                onTestNotif={handleTestNotif}
                onTestCallAlert={handleTriggerCallAlert}
                onOpenEditTimes={() => setShowEditTimesModal(true)}
                onTestHourlyReminder={triggerHourlyReminder}
              />
            )}
          </>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Incoming Prayer Call Modal */}
      {callAlertData && (
        <CallAlertModal
          prayer={callAlertData.prayer}
          quote={callAlertData.quote}
          onAnswerAndPray={(prayerName) => {
            handleUpdateStatus(prayerName, 'completed');
            setCallAlertData(null);
          }}
          onDismiss={() => setCallAlertData(null)}
          onSnooze={() => {
            setCallAlertData(null);
            showNotification({
              title: 'Snoozed 10 Minutes',
              body: 'You will receive another reminder in 10 minutes.',
              sound: false,
            });
          }}
        />
      )}

      {/* Auth Modal (Login / Register / Profile) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onLoginSuccess={handleLoginSuccess}
        onLogout={handleLogout}
      />

      {/* Admin Panel Modal (Password 1234) */}
      <AdminModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
      />

      {/* Custom Prayer Times Modal */}
      <EditPrayerTimesModal
        isOpen={showEditTimesModal}
        onClose={() => setShowEditTimesModal(false)}
        currentPrayers={salahData?.prayers || []}
        userId={currentUser?.id || 1}
        onSaveCustomTimes={handleSaveCustomTimes}
      />

      {/* Incoming Group Call Popup (rings like actual smartphone incoming call) */}
      {incomingGroupCall && (
        <IncomingGroupCallModal
          incomingCall={incomingGroupCall}
          onAccept={handleAcceptIncomingCall}
          onDecline={handleDeclineIncomingCall}
        />
      )}

      {/* Active Group Call Voice Room */}
      {activeGroupCall && (
        <GroupCallModal
          call={activeGroupCall}
          currentUser={currentUser}
          onClose={() => setActiveGroupCall(null)}
          onCallEnded={() => setActiveGroupCall(null)}
        />
      )}
    </div>
  );
}
