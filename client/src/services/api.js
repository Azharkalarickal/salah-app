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

export async function sendGroupMessage({ groupId, userId, userName, message, image }) {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userName, message, image }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send message');
  return data;
}

// --- GROUP VOICE CALLING ---
export async function startGroupCall({ groupId, userId, userName }) {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/calls/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to start group call');
  return data;
}

export async function fetchActiveGroupCall(groupId) {
  const res = await fetch(`${BASE_URL}/groups/${groupId}/calls/active`);
  if (!res.ok) throw new Error('Failed to fetch active call');
  return res.json();
}

export async function joinGroupCall({ callId, userId, userName }) {
  const res = await fetch(`${BASE_URL}/groups/calls/${callId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userName }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to join call');
  return data;
}

export async function leaveGroupCall({ callId, userId }) {
  const res = await fetch(`${BASE_URL}/groups/calls/${callId}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId }),
  });
  return res.json();
}

export async function endGroupCall({ callId, groupId, userId, userName }) {
  const res = await fetch(`${BASE_URL}/groups/calls/${callId}/end`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ groupId, userId, userName }),
  });
  return res.json();
}

export async function updateCallSpeakingStatus({ callId, userId, isSpeaking, isMuted }) {
  const res = await fetch(`${BASE_URL}/groups/calls/${callId}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, isSpeaking, isMuted }),
  });
  return res.json();
}

export async function fetchMyIncomingGroupCall(userId) {
  try {
    const res = await fetch(`${BASE_URL}/groups/calls/my-incoming?userId=${userId || 1}`);
    if (res.ok) return res.json();
  } catch (e) {}
  return { hasCall: false };
}

// --- USER CUSTOM ADHAN TIMES ---
export async function fetchUserCustomTimes(userId) {
  const res = await fetch(`${BASE_URL}/salah/custom-times?userId=${userId || 1}`);
  if (!res.ok) throw new Error('Failed to fetch custom times');
  return res.json();
}

export async function saveUserCustomTimes(payload) {
  const res = await fetch(`${BASE_URL}/salah/custom-times`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to save custom times');
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
    message: 'നിശ്ചയമായും നമസ്കാരം വിശ്വാസികൾക്ക് നിർണ്ണയിക്കപ്പെട്ട സമയങ്ങളിൽ നിർബന്ധമാക്കപ്പെട്ട ബാധ്യതയാകുന്നു.',
    source: 'വിശുദ്ധ ഖുർആൻ (സൂറഃ അന്നിസാഅ് 103)',
  };
}

export async function fetchHourlyMotivation() {
  try {
    const res = await fetch(`${BASE_URL}/motivation/hourly`);
    if (res.ok) return res.json();
  } catch (e) {}
  return {
    message: 'സമയം വിലപ്പെട്ടതാണ് — ഈ ജീവിതം അല്പസമയത്തെ പരീക്ഷണമാണ്; പരലോകമാണ് ശാശ്വതമായ വീട്.',
    source: 'സമയവും പരലോകവും',
  };
}

// --- ADMIN BROADCAST NOTIFICATIONS & PRAYER MANAGEMENT ---
export async function sendAdminBroadcast({ title, message, expiryHours }) {
  const res = await fetch(`${BASE_URL}/admin/broadcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, message, expiryHours }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send notification');
  return data;
}

export async function fetchAdminBroadcasts() {
  const res = await fetch(`${BASE_URL}/admin/broadcasts`);
  if (!res.ok) throw new Error('Failed to fetch broadcasts');
  return res.json();
}

export async function fetchLatestBroadcast() {
  try {
    const res = await fetch(`${BASE_URL}/notifications/latest`);
    if (res.ok) return res.json();
  } catch (e) {}
  return null;
}

export async function adminSaveGlobalPrayerTimes(payload) {
  const res = await fetch(`${BASE_URL}/admin/prayer-times`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to set global prayer times');
  return data;
}

export async function adminFetchUserPrayerTimes(userId) {
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/prayer-times`);
  if (!res.ok) throw new Error('Failed to fetch user prayer times');
  return res.json();
}

export async function adminSaveUserPrayerTimes(userId, payload) {
  const res = await fetch(`${BASE_URL}/admin/users/${userId}/prayer-times`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to set user prayer times');
  return data;
}
