// Client API service communicating with Express backend

const BASE_URL = '/api';

export async function fetchTodaySalah(dateStr) {
  const url = dateStr ? `${BASE_URL}/salah/today?date=${dateStr}` : `${BASE_URL}/salah/today`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch today salah');
  return res.json();
}

export async function logSalahStatus(prayer_name, status, date) {
  const res = await fetch(`${BASE_URL}/salah/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prayer_name, status, date }),
  });
  if (!res.ok) throw new Error('Failed to log prayer status');
  return res.json();
}

export async function fetchSalahHistory(days = 30) {
  const res = await fetch(`${BASE_URL}/salah/history?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch salah history');
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${BASE_URL}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updatePrayerSettings(settings) {
  const res = await fetch(`${BASE_URL}/settings/prayer`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update prayer settings');
  return res.json();
}

export async function fetchQuranToday(dateStr) {
  const url = dateStr ? `${BASE_URL}/quran/today?date=${dateStr}` : `${BASE_URL}/quran/today`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch Quran status');
  return res.json();
}

export async function logQuranReading({ completed, amount_read, surah_name, notes, date }) {
  const res = await fetch(`${BASE_URL}/quran/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed, amount_read, surah_name, notes, date }),
  });
  if (!res.ok) throw new Error('Failed to update Quran log');
  return res.json();
}

export async function updateQuranSettings(settings) {
  const res = await fetch(`${BASE_URL}/settings/quran`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update Quran settings');
  return res.json();
}

export async function fetchMotivation(category = 'general') {
  try {
    const res = await fetch(`${BASE_URL}/motivation/${category}`);
    if (res.ok) return res.json();
  } catch (e) {
    // fallback
  }
  return {
    message: 'Maintain your prayers with devotion; peace follows true submission.',
    source: 'Reflection',
  };
}
