import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import HeroPrayerCard from './components/HeroPrayerCard';
import PrayerList from './components/PrayerList';
import MotivationalBanner from './components/MotivationalBanner';
import QuranTab from './components/QuranTab';
import StatsTab from './components/StatsTab';
import SettingsTab from './components/SettingsTab';

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

  // Keep track of sent notifications today to avoid spamming
  const sentAlertsRef = useRef(new Set());

  // Load initial data
  const loadData = async () => {
    try {
      const [todaySalah, quran, appSettings, initialQuote] = await Promise.all([
        fetchTodaySalah(),
        fetchQuranToday(),
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
  }, []);

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
      // Before Fajr -> active is yesterday's Isha, next is today's Fajr
      current = prayerMins[prayerMins.length - 1];
      next = prayerMins[0];
    } else {
      const currentIndex = prayerMins.findIndex((p) => p.name === current.name);
      if (currentIndex === prayerMins.length - 1) {
        // Current is Isha -> next is tomorrow's Fajr
        next = prayerMins[0];
      } else {
        next = prayerMins[currentIndex + 1];
      }
    }

    return { current, next };
  };

  const { current: currentPrayer, next: nextPrayer } = computeActiveAndNextPrayer();

  // Notification Engine Interval (runs every 30 seconds)
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

      // 1. Check each prayer for on-time and follow-up notifications
      for (const prayer of salahData.prayers) {
        const [h, m] = prayer.time.split(':').map(Number);
        const prayerMins = h * 60 + m;

        // On-Time Azan alert
        const onTimeKey = `${todayStr}-${prayer.name}-ontime`;
        if (nowMins === prayerMins && !sentAlertsRef.current.has(onTimeKey)) {
          sentAlertsRef.current.add(onTimeKey);
          showNotification({
            title: `Time for ${prayer.name.toUpperCase()} Prayer`,
            body: `Hayya 'ala-Salah — It is now time for ${prayer.name}. Take a pause to pray.`,
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
            showNotification({
              title: `Have you prayed ${prayer.name.toUpperCase()} yet?`,
              body: motivation.message || `A gentle reminder to pray ${prayer.name}. Stand before Allah.`,
              prayer: prayer.name,
              sound: enableSound,
            });
          } catch (e) {
            showNotification({
              title: `Reminder: ${prayer.name.toUpperCase()} Prayer`,
              body: `Don't miss the blessings of ${prayer.name}. Take 5 minutes now to pray.`,
              prayer: prayer.name,
              sound: enableSound,
            });
          }
        }
      }

      // 2. Check Quran daily reminder
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
  }, [salahData, settings, quranData]);

  // Request notifications
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

  const handleUpdateStatus = async (prayerName, newStatus) => {
    try {
      // Optimistic update
      setSalahData((prev) => ({
        ...prev,
        prayers: prev.prayers.map((p) =>
          p.name === prayerName ? { ...p, status: newStatus } : p
        ),
      }));

      await logSalahStatus(prayerName, newStatus);
    } catch (err) {
      console.error('Failed to log salah status:', err);
      // Revert if error
      loadData();
    }
  };

  const handleLogQuran = async (payload) => {
    try {
      await logQuranReading(payload);
      const updatedQuran = await fetchQuranToday();
      setQuranData(updatedQuran);
    } catch (err) {
      console.error('Failed to update Quran log:', err);
    }
  };

  const handleSavePrayerSettings = async (newSettings) => {
    try {
      const res = await updatePrayerSettings(newSettings);
      setSettings(res.settings);
      const refreshedSalah = await fetchTodaySalah();
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
        city={settings?.city}
        country={settings?.country}
        notifPermission={notifPermission}
        onRequestNotif={handleRequestNotif}
        onTestNotif={handleTestNotif}
      />

      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-4 pb-24 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Loading prayer times & database...</span>
          </div>
        ) : (
          <>
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

            {activeTab === 'quran' && (
              <QuranTab
                quranData={quranData}
                onLogReading={handleLogQuran}
                onUpdateSettings={async (payload) => {
                  await updateQuranSettings(payload);
                  const q = await fetchQuranToday();
                  setQuranData(q);
                }}
              />
            )}

            {activeTab === 'stats' && <StatsTab />}

            {activeTab === 'settings' && (
              <SettingsTab
                settings={settings}
                onSaveSettings={handleSavePrayerSettings}
                onTestNotif={handleTestNotif}
              />
            )}
          </>
        )}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
