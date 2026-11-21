// Client API service communicating with Express backend

const BASE_URL = '/api';

// --- AUTH & USER ---
export async function registerUser({ name, email, password }) {
  const res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Registration failed');
  return data;
}

export async function loginUser({ email, password }) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

export async function fetchUserProfile(userId) {
  const res = await fetch(`${BASE_URL}/auth/me?userId=${userId || 1}`);
  if (!res.ok) throw new Error('Failed to fetch profile');
  return res.json();
}

// --- ADMIN PANEL ---
export async function adminLogin(password) {
  const res = await fetch(`${BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Admin login failed');
  return data;
}

export async function adminChangePassword({ currentPassword, newPassword }) {
  const res = await fetch(`${BASE_URL}/admin/change-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update password');
  return data;
}

export async function fetchAdminStats() {
  const res = await fetch(`${BASE_URL}/admin/stats`);
  if (!res.ok) throw new Error('Failed to fetch admin stats');
  return res.json();
}

export async function fetchAdminUsers() {
  const res = await fetch(`${BASE_URL}/admin/users`);
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function deleteUser(id) {
  const res = await fetch(`${BASE_URL}/admin/users/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete user');
  return res.json();
}

// --- FAMILY GROUPS ---
export async function createFamilyGroup({ name, userId }) {
  const res = await fetch(`${BASE_URL}/groups/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create group');
  return data;
}

export async function joinFamilyGroup({ groupCode, userId }) {
  const res = await fetch(`${BASE_URL}/groups/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupCode, userId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to join group');
  return data;
}

export async function inviteFamilyMember({ groupId, targetUserCode }) {
  const res = await fetch(`${BASE_URL}/groups/invite`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupId, targetUserCode }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to invite user');
  return data;
}

export async function fetchMyGroups(userId) {
  const res = await fetch(`${BASE_URL}/groups/my?userId=${userId || 1}`);
  if (!res.ok) throw new Error('Failed to fetch groups');
  return res.json();
}

export async function fetchGroupBoard(groupId, dateStr) {
  const url = dateStr
    ? `${BASE_URL}/groups/${groupId}/board?date=${dateStr}`
    : `${BASE_URL}/groups/${groupId}/board`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch group board');
  return res.json();
}

export async function fetchGroupMessages(groupId) {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/messages`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function sendGroupMessage({ groupId, userId, userName, message }) {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userName, message }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send message');
  return data;
}

// --- SALAH & QURAN ---
export async function fetchTodaySalah(dateStr, userId) {
  const uId = userId || 1;
  const url = dateStr
    ? `${BASE_URL}/salah/today?date=${dateStr}&userId=${uId}`
    : `${BASE_URL}/salah/today?userId=${uId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch today salah');
  return res.json();
}

export async function logSalahStatus(prayer_name, status, date, userId) {
  const res = await fetch(`${BASE_URL}/salah/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prayer_name, status, date, userId: userId || 1 }),
  });
  if (!res.ok) throw new Error('Failed to log prayer status');
  return res.json();
}

export async function fetchSalahHistory(days = 30, userId) {
  const res = await fetch(`${BASE_URL}/salah/history?days=${days}&userId=${userId || 1}`);
  if (!res.ok) throw new Error('Failed to fetch salah history');
  return res.json();
}

export async function fetchYearlyStats(year = 2026, userId) {
  const res = await fetch(`${BASE_URL}/salah/yearly-stats?year=${year}&userId=${userId || 1}`);
  if (!res.ok) throw new Error('Failed to fetch yearly stats');
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

export async function fetchQuranToday(dateStr, userId) {
  const uId = userId || 1;
  const url = dateStr
    ? `${BASE_URL}/quran/today?date=${dateStr}&userId=${uId}`
    : `${BASE_URL}/quran/today?userId=${uId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch Quran status');
  return res.json();
}

export async function logQuranReading({ completed, amount_read, surah_name, notes, date, userId }) {
  const res = await fetch(`${BASE_URL}/quran/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed, amount_read, surah_name, notes, date, userId: userId || 1 }),
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
  } catch (e) {}
  return {
    message: 'Maintain your prayers with devotion; peace follows true submission.',
    source: 'Reflection',
  };
}
