import React, { useState, useEffect, useRef } from 'react';
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

import {
  fetchTodaySalah,
  logSalahStatus,
  fetchSettings,
  updatePrayerSettings,
  fetchQuranToday,
  logQuranReading,
  updateQuranSettings,
  fetchMotivation,
} from './services/api';
import {
  requestNotificationPermission,
  showNotification,
  playChime,
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
  const [callAlertData, setCallAlertData] = useState(null);

  // Keep track of sent notifications today
  const sentAlertsRef = useRef(new Set());

  // Load initial data
  const loadData = async (user) => {
    const uId = user?.id || currentUser?.id || 1;
    try {
      const [todaySalah, quran, appSettings, initialQuote] = await Promise.all([
        fetchTodaySalah(undefined, uId),
        fetchQuranToday(undefined, uId),
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

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('salah_user', JSON.stringify(user));
    } catch (e) {}
    loadData(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('salah_user');
    } catch (e) {}
    setShowAuthModal(false);
    loadData(null);
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
          } catch (e) {}
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
    }, 30000);

    return () => clearInterval(interval);
  }, [salahData, settings, quranData, quote]);

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

      await logSalahStatus(prayerName, newStatus, undefined, uId);
    } catch (err) {
      console.error('Failed to log salah status:', err);
      loadData();
    }
  };

  const handleLogQuran = async (payload) => {
    const uId = currentUser?.id || 1;
    try {
      await logQuranReading({ ...payload, userId: uId });
      const updatedQuran = await fetchQuranToday(undefined, uId);
      setQuranData(updatedQuran);
    } catch (err) {
      console.error('Failed to update Quran log:', err);
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
      />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-24 space-y-4">
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

                <MotivationalBanner
                  quote={quote}
                  onRefresh={handleRefreshQuote}
                  loading={loadingQuote}
                />

                <PrayerList
                  prayers={salahData?.prayers || []}
                  onUpdateStatus={handleUpdateStatus}
                  currentPrayerName={currentPrayer?.name}
                />
              </>
            )}

            {/* FAMILY GROUPS TAB */}
            {activeTab === 'family' && (
              <FamilyGroupTab
                currentUser={currentUser}
                onOpenAuth={() => setShowAuthModal(true)}
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
    </div>
  );
}
