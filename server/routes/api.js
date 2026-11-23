import express from 'express';
import pool from '../db.js';
import * as adhan from 'adhan';

const router = express.Router();

function getLocalDateStr(dateInput) {
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput.trim())) {
    return dateInput.trim();
  }
  const d = dateInput ? new Date(dateInput) : new Date();
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d);
}

// Helper: Calculate prayer times based on settings and date
function computePrayerTimes(settings, targetDate = new Date()) {
  if (settings?.use_custom_times) {
    const pad = (t) => (t ? t.toString().slice(0, 5) : '00:00');
    return {
      fajr: pad(settings.custom_fajr),
      sunrise: '06:15',
      dhuhr: pad(settings.custom_dhuhr),
      asr: pad(settings.custom_asr),
      maghrib: pad(settings.custom_maghrib),
      isha: pad(settings.custom_isha),
      source: 'custom',
    };
  }

  // Default to Kochi, Kerala (lat: 9.9312, lng: 76.2673)
  const coordinates = new adhan.Coordinates(
    Number(settings?.latitude) || 9.9312,
    Number(settings?.longitude) || 76.2673
  );

  let params;
  switch (settings?.calculation_method) {
    case 'Karachi':
      params = adhan.CalculationMethod.Karachi();
      break;
    case 'Egyptian':
      params = adhan.CalculationMethod.Egyptian();
      break;
    case 'UmmAlQura':
      params = adhan.CalculationMethod.UmmAlQura();
      break;
    case 'Dubai':
      params = adhan.CalculationMethod.Dubai();
      break;
    case 'NorthAmerica':
    case 'ISNA':
      params = adhan.CalculationMethod.NorthAmerica();
      break;
    case 'MuslimWorldLeague':
    default:
      params = adhan.CalculationMethod.MuslimWorldLeague();
  }

  if (settings?.asr_juristic === 'hanafi') {
    params.madhab = adhan.Madhab.Hanafi;
  } else {
    params.madhab = adhan.Madhab.Shafi;
  }

  params.adjustments.fajr = Number(settings?.fajr_offset) || 0;
  params.adjustments.dhuhr = Number(settings?.dhuhr_offset) || 0;
  params.adjustments.asr = Number(settings?.asr_offset) || 0;
  params.adjustments.maghrib = Number(settings?.maghrib_offset) || 0;
  params.adjustments.isha = Number(settings?.isha_offset) || 0;

  const prayerTimes = new adhan.PrayerTimes(coordinates, targetDate, params);

  // Format in user's device/local timezone (defaulting to Asia/Kolkata for Kerala)
  const formatTime = (dateObj) => {
    if (!dateObj) return '00:00';
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).formatToParts(dateObj);
      const h = parts.find((p) => p.type === 'hour')?.value || '00';
      const m = parts.find((p) => p.type === 'minute')?.value || '00';
      return `${h}:${m}`;
    } catch (e) {
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    }
  };

  return {
    fajr: formatTime(prayerTimes.fajr),
    sunrise: formatTime(prayerTimes.sunrise),
    dhuhr: formatTime(prayerTimes.dhuhr),
    asr: formatTime(prayerTimes.asr),
    maghrib: formatTime(prayerTimes.maghrib),
    isha: formatTime(prayerTimes.isha),
    rawDates: {
      fajr: prayerTimes.fajr,
      sunrise: prayerTimes.sunrise,
      dhuhr: prayerTimes.dhuhr,
      asr: prayerTimes.asr,
      maghrib: prayerTimes.maghrib,
      isha: prayerTimes.isha,
    },
    source: 'calculated',
  };
}

// ==========================================
// 1. AUTHENTICATION & USERS
// ==========================================

router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required' });
    }

    const userCode = 'USR-' + Math.floor(1000 + Math.random() * 9000);
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO users (user_code, name, email, password) VALUES (?, ?, ?, ?)',
      [userCode, name, email, password]
    );

    const user = { id: result.insertId, user_code: userCode, name, email, avatar: '🕌' };
    res.json({ success: true, user });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query(
      'SELECT id, user_code, name, email, avatar, password FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0 || rows[0].password !== password) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = {
      id: rows[0].id,
      user_code: rows[0].user_code,
      name: rows[0].name,
      email: rows[0].email,
      avatar: rows[0].avatar,
    };
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

router.get('/auth/me', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const [rows] = await pool.query(
      'SELECT id, user_code, name, email, avatar, created_at FROM users WHERE id = ?',
      [userId]
    );
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// 2. ADMIN PANEL (Default Password: 1234)
// ==========================================

router.post('/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    const [rows] = await pool.query('SELECT password FROM admin_auth WHERE id = 1');
    const adminPass = rows[0]?.password || '1234';

    if (password === adminPass) {
      res.json({ success: true, token: 'admin-authorized-token' });
    } else {
      res.status(401).json({ error: 'Incorrect Admin Password' });
    }
  } catch (err) {
    if (req.body.password === '1234') {
      return res.json({ success: true, token: 'admin-authorized-token' });
    }
    res.status(401).json({ error: 'Invalid password' });
  }
});

router.post('/admin/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || !String(newPassword).trim()) {
      return res.status(400).json({ error: 'New password cannot be empty' });
    }

    const [rows] = await pool.query('SELECT password FROM admin_auth WHERE id = 1');
    const adminPass = rows[0]?.password || '1234';

    if (String(currentPassword).trim() !== String(adminPass).trim()) {
      return res.status(401).json({ error: 'Current password does not match' });
    }

    await pool.query(
      `INSERT INTO admin_auth (id, password) VALUES (1, ?)
       ON DUPLICATE KEY UPDATE password = VALUES(password)`,
      [String(newPassword).trim()]
    );
    res.json({ success: true, message: 'Admin password updated successfully' });
  } catch (err) {
    console.error('Failed to update admin password:', err);
    res.status(500).json({ error: 'Failed to update admin password: ' + err.message });
  }
});

router.get('/admin/stats', async (req, res) => {
  try {
    const [[userCount]] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [[groupCount]] = await pool.query('SELECT COUNT(*) as count FROM family_groups');
    const [[prayerCount]] = await pool.query('SELECT COUNT(*) as count FROM salah_logs WHERE status != "pending"');
    const [[quranCount]] = await pool.query('SELECT COUNT(*) as count FROM quran_logs WHERE completed = TRUE');

    res.json({
      totalUsers: userCount.count,
      totalGroups: groupCount.count,
      totalPrayersLogged: prayerCount.count,
      totalQuranLogs: quranCount.count,
    });
  } catch (err) {
    res.json({ totalUsers: 1, totalGroups: 1, totalPrayersLogged: 12, totalQuranLogs: 5 });
  }
});

router.get('/admin/users', async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, user_code, name, email, avatar, created_at FROM users ORDER BY id DESC'
    );
    res.json(users);
  } catch (err) {
    res.json([]);
  }
});

router.delete('/admin/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    await pool.query('DELETE FROM group_members WHERE user_id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ==========================================
// 3. FAMILY GROUPS, CHAT & PHOTO SHARING
// ==========================================

router.post('/groups/create', async (req, res) => {
  try {
    const { name, userId } = req.body;
    if (!name || !userId) {
      return res.status(400).json({ error: 'Group name and userId required' });
    }

    const groupCode = 'FAM-' + Math.floor(1000 + Math.random() * 9000);
    const [result] = await pool.query(
      'INSERT INTO family_groups (name, group_code, created_by) VALUES (?, ?, ?)',
      [name, groupCode, userId]
    );

    const groupId = result.insertId;
    await pool.query(
      'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, "admin")',
      [groupId, userId]
    );

    res.json({ success: true, groupId, groupCode, name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create group' });
  }
});

router.post('/groups/join', async (req, res) => {
  try {
    const { groupCode, userId } = req.body;
    const [groups] = await pool.query(
      'SELECT id, name FROM family_groups WHERE group_code = ?',
      [groupCode?.toUpperCase()]
    );

    if (groups.length === 0) {
      return res.status(404).json({ error: 'Group not found with this code' });
    }

    const groupId = groups[0].id;
    await pool.query(
      'INSERT IGNORE INTO group_members (group_id, user_id, role) VALUES (?, ?, "member")',
      [groupId, userId]
    );

    res.json({ success: true, groupId, name: groups[0].name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join group' });
  }
});

router.post('/groups/invite', async (req, res) => {
  try {
    const { groupId, targetUserCode } = req.body;
    const [users] = await pool.query(
      'SELECT id, name FROM users WHERE user_code = ?',
      [targetUserCode?.toUpperCase()]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found with this User ID' });
    }

    const targetUserId = users[0].id;
    await pool.query(
      'INSERT IGNORE INTO group_members (group_id, user_id, role) VALUES (?, ?, "member")',
      [groupId, targetUserId]
    );

    res.json({ success: true, invitedName: users[0].name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to invite member' });
  }
});

router.get('/groups/my', async (req, res) => {
  try {
    const userId = req.query.userId || 1;
    const [rows] = await pool.query(
      `SELECT g.id, g.name, g.group_code, gm.role,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as memberCount
       FROM family_groups g
       JOIN group_members gm ON g.id = gm.group_id
       WHERE gm.user_id = ?`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.json([]);
  }
});

router.get('/groups/:groupId/board', async (req, res) => {
  try {
    const { groupId } = req.params;
    const dateStr = req.query.date || new Date().toISOString().slice(0, 10);

    const [members] = await pool.query(
      `SELECT u.id, u.user_code, u.name, u.avatar, gm.role 
       FROM group_members gm
       JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = ?`,
      [groupId]
    );

    const [salahLogs] = await pool.query(
      `SELECT user_id, prayer_name, status, completed_at 
       FROM salah_logs 
       WHERE log_date = ?`,
      [dateStr]
    );

    const [quranLogs] = await pool.query(
      `SELECT user_id, completed, amount_read, surah_name 
       FROM quran_logs 
       WHERE log_date = ?`,
      [dateStr]
    );

    const memberProgress = members.map((m) => {
      const userPrayers = {};
      ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach((p) => {
        const found = salahLogs.find((l) => l.user_id === m.id && l.prayer_name === p);
        userPrayers[p] = found ? found.status : 'pending';
      });

      const userQuran = quranLogs.find((q) => q.user_id === m.id) || {
        completed: false,
        amount_read: 0,
      };

      const completedSalahCount = Object.values(userPrayers).filter(
        (st) => st === 'completed' || st === 'jamaah'
      ).length;

      return {
        ...m,
        prayers: userPrayers,
        completedCount: completedSalahCount,
        quran: userQuran,
      };
    });

    res.json({ date: dateStr, members: memberProgress });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load group board' });
  }
});

// Group Messages (Chat with photo support)
router.get('/groups/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    const [rows] = await pool.query(
      `SELECT id, group_id, user_id, user_name, message, image, created_at 
       FROM group_messages 
       WHERE group_id = ? 
       ORDER BY id DESC LIMIT 60`,
      [groupId]
    );
    res.json(rows.reverse());
  } catch (err) {
    res.json([]);
  }
});

router.post('/groups/:groupId/messages', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, userName, message, image } = req.body;
    if ((!message || !message.trim()) && !image) {
      return res.status(400).json({ error: 'Message or photo is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO group_messages (group_id, user_id, user_name, message, image) VALUES (?, ?, ?, ?, ?)',
      [groupId, userId, userName || 'Family Member', (message || '').trim(), image || null]
    );

    res.json({
      id: result.insertId,
      group_id: groupId,
      user_id: userId,
      user_name: userName || 'Family Member',
      message: (message || '').trim(),
      image: image || null,
      created_at: new Date(),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ==========================================
// 3.5 GROUP VOICE CALLING
// ==========================================

// Start a Group Voice Call
router.post('/groups/:groupId/calls/start', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, userName } = req.body;
    if (!groupId || !userId) {
      return res.status(400).json({ error: 'groupId and userId required' });
    }

    // End any previous active call for this group
    await pool.query(
      'UPDATE group_calls SET status = "ended", ended_at = NOW() WHERE group_id = ? AND status = "active"',
      [groupId]
    );

    const [callResult] = await pool.query(
      'INSERT INTO group_calls (group_id, caller_id, caller_name, status) VALUES (?, ?, ?, "active")',
      [groupId, userId, userName || 'Family Member']
    );

    const callId = callResult.insertId;

    // Caller joins as host/first participant
    await pool.query(
      'INSERT INTO group_call_participants (call_id, user_id, user_name, status, is_speaking) VALUES (?, ?, ?, "talking", TRUE)',
      [callId, userId, userName || 'Family Member']
    );

    // Announce in group chat
    await pool.query(
      'INSERT INTO group_messages (group_id, user_id, user_name, message) VALUES (?, ?, ?, ?)',
      [groupId, userId, userName || 'Family Member', '📞 Started a family group voice call']
    );

    res.json({
      success: true,
      call: {
        id: callId,
        group_id: Number(groupId),
        caller_id: Number(userId),
        caller_name: userName || 'Family Member',
        status: 'active',
      },
    });
  } catch (err) {
    console.error('Start call error:', err);
    res.status(500).json({ error: 'Failed to start group call' });
  }
});

// Get Active Call in a Group with Participants
router.get('/groups/:groupId/calls/active', async (req, res) => {
  try {
    const { groupId } = req.params;
    const [calls] = await pool.query(
      'SELECT * FROM group_calls WHERE group_id = ? AND status = "active" ORDER BY id DESC LIMIT 1',
      [groupId]
    );

    if (calls.length === 0) {
      return res.json({ active: false, call: null, participants: [] });
    }

    const call = calls[0];
    const [participants] = await pool.query(
      'SELECT user_id, user_name, status, is_speaking, joined_at FROM group_call_participants WHERE call_id = ? AND status != "left"',
      [call.id]
    );

    res.json({
      active: true,
      call,
      participants,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active call' });
  }
});

// Join Group Call
router.post('/groups/calls/:callId/join', async (req, res) => {
  try {
    const { callId } = req.params;
    const { userId, userName } = req.body;

    await pool.query(
      `INSERT INTO group_call_participants (call_id, user_id, user_name, status, is_speaking)
       VALUES (?, ?, ?, "talking", FALSE)
       ON DUPLICATE KEY UPDATE status = "talking"`,
      [callId, userId, userName || 'Family Member']
    );

    const [participants] = await pool.query(
      'SELECT user_id, user_name, status, is_speaking, joined_at FROM group_call_participants WHERE call_id = ? AND status != "left"',
      [callId]
    );

    res.json({ success: true, participants });
  } catch (err) {
    res.status(500).json({ error: 'Failed to join group call' });
  }
});

// Leave Group Call
router.post('/groups/calls/:callId/leave', async (req, res) => {
  try {
    const { callId } = req.params;
    const { userId } = req.body;

    await pool.query(
      'UPDATE group_call_participants SET status = "left", is_speaking = FALSE WHERE call_id = ? AND user_id = ?',
      [callId, userId]
    );

    // If no active participants remain, mark call as ended
    const [remaining] = await pool.query(
      'SELECT COUNT(*) as count FROM group_call_participants WHERE call_id = ? AND status != "left"',
      [callId]
    );

    if (remaining[0].count === 0) {
      await pool.query(
        'UPDATE group_calls SET status = "ended", ended_at = NOW() WHERE id = ?',
        [callId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to leave group call' });
  }
});

// End Group Call (by host or participant)
router.post('/groups/calls/:callId/end', async (req, res) => {
  try {
    const { callId } = req.params;
    const { groupId, userId, userName } = req.body;

    await pool.query(
      'UPDATE group_calls SET status = "ended", ended_at = NOW() WHERE id = ?',
      [callId]
    );

    await pool.query(
      'UPDATE group_call_participants SET status = "left", is_speaking = FALSE WHERE call_id = ?',
      [callId]
    );

    if (groupId) {
      await pool.query(
        'INSERT INTO group_messages (group_id, user_id, user_name, message) VALUES (?, ?, ?, ?)',
        [groupId, userId || 1, userName || 'System', '📞 Group voice call ended']
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to end group call' });
  }
});

// Update Speaking/Mute Status
router.post('/groups/calls/:callId/status', async (req, res) => {
  try {
    const { callId } = req.params;
    const { userId, isSpeaking, isMuted } = req.body;

    const status = isMuted ? 'muted' : 'talking';
    await pool.query(
      'UPDATE group_call_participants SET is_speaking = ?, status = ? WHERE call_id = ? AND user_id = ?',
      [Boolean(isSpeaking), status, callId, userId]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update speaking status' });
  }
});

// Check if any group user belongs to has an active call (for incoming ringing alert)
router.get('/groups/calls/my-incoming', async (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!userId) return res.json({ hasCall: false });

    const [rows] = await pool.query(
      `SELECT c.*, g.name as group_name
       FROM group_calls c
       JOIN group_members gm ON c.group_id = gm.group_id
       JOIN family_groups g ON c.group_id = g.id
       WHERE gm.user_id = ? AND c.status = "active"
       ORDER BY c.id DESC LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.json({ hasCall: false });
    }

    const call = rows[0];

    // Check if user is already participating
    const [myPart] = await pool.query(
      'SELECT status FROM group_call_participants WHERE call_id = ? AND user_id = ?',
      [call.id, userId]
    );

    const isParticipating = myPart.length > 0 && myPart[0].status === 'talking';
    const hasDeclined = myPart.length > 0 && myPart[0].status === 'left';

    const [participants] = await pool.query(
      'SELECT user_id, user_name, status, is_speaking FROM group_call_participants WHERE call_id = ? AND status != "left"',
      [call.id]
    );

    res.json({
      hasCall: !hasDeclined,
      isParticipating,
      call,
      participants,
    });
  } catch (err) {
    res.json({ hasCall: false });
  }
});

// ==========================================
// 4. USER CUSTOM PRAYER / ADHAN TIMES
// ==========================================

router.get('/salah/custom-times', async (req, res) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : null;
    if (!userId) {
      return res.json({ useCustom: false, times: null });
    }
    const [rows] = await pool.query(
      'SELECT * FROM user_prayer_times WHERE user_id = ?',
      [userId]
    );
    if (rows.length > 0) {
      res.json({ useCustom: Boolean(rows[0].use_custom), times: rows[0] });
    } else {
      res.json({ useCustom: false, times: null });
    }
  } catch (err) {
    res.json({ useCustom: false, times: null });
  }
});

router.put('/salah/custom-times', async (req, res) => {
  try {
    const { userId, use_custom, fajr, dhuhr, asr, maghrib, isha } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'Login required to set custom times' });
    }
    const uId = Number(userId);

    await pool.query(
      `INSERT INTO user_prayer_times (user_id, use_custom, fajr, dhuhr, asr, maghrib, isha)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         use_custom = VALUES(use_custom),
         fajr = VALUES(fajr),
         dhuhr = VALUES(dhuhr),
         asr = VALUES(asr),
         maghrib = VALUES(maghrib),
         isha = VALUES(isha)`,
      [uId, Boolean(use_custom), fajr || '05:15:00', dhuhr || '12:30:00', asr || '15:45:00', maghrib || '18:15:00', isha || '19:30:00']
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update custom times' });
  }
});

// ==========================================
// 5. FULL YEAR INSIGHTS & STATS
// ==========================================

router.get('/salah/yearly-stats', async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const userId = req.query.userId ? Number(req.query.userId) : null;
    if (!userId) {
      return res.json({
        year,
        yearlyTotalPrayers: 0,
        yearlyOnTimeRatio: 0,
        yearlyQuranPages: 0,
        months: [],
      });
    }

    const [monthlySalah] = await pool.query(
      `SELECT MONTH(log_date) as month, status, COUNT(*) as count 
       FROM salah_logs 
       WHERE YEAR(log_date) = ? AND user_id = ?
       GROUP BY MONTH(log_date), status`,
      [year, userId]
    );

    const [monthlyQuran] = await pool.query(
      `SELECT MONTH(log_date) as month, SUM(amount_read) as total_pages, COUNT(IF(completed = TRUE, 1, NULL)) as days_read
       FROM quran_logs 
       WHERE YEAR(log_date) = ? AND user_id = ?
       GROUP BY MONTH(log_date)`,
      [year, userId]
    );

    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const monthsData = monthNames.map((name, idx) => {
      const monthNum = idx + 1;
      const statuses = monthlySalah.filter((r) => r.month === monthNum);
      let completed = 0;
      let jamaah = 0;
      let late = 0;
      let missed = 0;

      statuses.forEach((s) => {
        if (s.status === 'completed') completed = s.count;
        if (s.status === 'jamaah') jamaah = s.count;
        if (s.status === 'late') late = s.count;
        if (s.status === 'missed') missed = s.count;
      });

      const quran = monthlyQuran.find((q) => q.month === monthNum) || { total_pages: 0, days_read: 0 };
      const totalRecorded = completed + jamaah + late + missed;
      const onTimeRatio = totalRecorded > 0 ? Math.round(((completed + jamaah) / totalRecorded) * 100) : 0;

      return {
        month: name,
        monthNum,
        completed,
        jamaah,
        late,
        missed,
        totalRecorded,
        onTimeRatio,
        quranPages: Number(quran.total_pages) || 0,
        quranDaysRead: Number(quran.days_read) || 0,
      };
    });

    const yearlyTotalPrayers = monthsData.reduce((acc, m) => acc + m.totalRecorded, 0);
    const yearlyOnTimePrayers = monthsData.reduce((acc, m) => acc + (m.completed + m.jamaah), 0);
    const yearlyQuranPages = monthsData.reduce((acc, m) => acc + m.quranPages, 0);
    const yearlyRatio = yearlyTotalPrayers > 0 ? Math.round((yearlyOnTimePrayers / yearlyTotalPrayers) * 100) : 0;

    res.json({
      year,
      yearlyTotalPrayers,
      yearlyOnTimeRatio: yearlyRatio,
      yearlyQuranPages,
      months: monthsData,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch yearly stats' });
  }
});

// ==========================================
// 6. TODAY'S PRAYER & SALAH LOGGING
// ==========================================

router.get('/settings', async (req, res) => {
  try {
    const [prayerRows] = await pool.query('SELECT * FROM prayer_settings WHERE id = 1');
    const [quranRows] = await pool.query('SELECT * FROM quran_settings WHERE id = 1');
    res.json({
      prayer: prayerRows[0] || { city: 'Kochi', country: 'India (Kerala)', calculation_method: 'MuslimWorldLeague' },
      quran: quranRows[0] || { daily_goal_target: 2, reminder_time: '20:30:00' },
    });
  } catch (err) {
    res.json({
      prayer: { city: 'Kochi', country: 'India (Kerala)', latitude: 9.9312, longitude: 76.2673, calculation_method: 'MuslimWorldLeague', followup_reminder_minutes: 30, enable_sound: true },
      quran: { daily_goal_type: 'pages', daily_goal_target: 2, reminder_time: '20:30:00', reminder_enabled: true },
    });
  }
});

router.put('/settings/prayer', async (req, res) => {
  try {
    const {
      city, country, latitude, longitude, calculation_method, asr_juristic,
      fajr_offset, dhuhr_offset, asr_offset, maghrib_offset, isha_offset,
      use_custom_times, custom_fajr, custom_dhuhr, custom_asr, custom_maghrib, custom_isha,
      followup_reminder_minutes, early_reminder_minutes, enable_notifications, enable_sound, sound_type
    } = req.body;

    await pool.query(
      `UPDATE prayer_settings SET 
        city = COALESCE(?, city), country = COALESCE(?, country),
        latitude = COALESCE(?, latitude), longitude = COALESCE(?, longitude),
        calculation_method = COALESCE(?, calculation_method), asr_juristic = COALESCE(?, asr_juristic),
        fajr_offset = COALESCE(?, fajr_offset), dhuhr_offset = COALESCE(?, dhuhr_offset),
        asr_offset = COALESCE(?, asr_offset), maghrib_offset = COALESCE(?, maghrib_offset),
        isha_offset = COALESCE(?, isha_offset), use_custom_times = COALESCE(?, use_custom_times),
        custom_fajr = COALESCE(?, custom_fajr), custom_dhuhr = COALESCE(?, custom_dhuhr),
        custom_asr = COALESCE(?, custom_asr), custom_maghrib = COALESCE(?, custom_maghrib),
        custom_isha = COALESCE(?, custom_isha),
        followup_reminder_minutes = COALESCE(?, followup_reminder_minutes),
        early_reminder_minutes = COALESCE(?, early_reminder_minutes),
        enable_notifications = COALESCE(?, enable_notifications),
        enable_sound = COALESCE(?, enable_sound), sound_type = COALESCE(?, sound_type)
      WHERE id = 1`,
      [
        city, country, latitude, longitude, calculation_method, asr_juristic,
        fajr_offset, dhuhr_offset, asr_offset, maghrib_offset, isha_offset,
        use_custom_times, custom_fajr, custom_dhuhr, custom_asr, custom_maghrib, custom_isha,
        followup_reminder_minutes, early_reminder_minutes, enable_notifications, enable_sound, sound_type
      ]
    );

    const [updated] = await pool.query('SELECT * FROM prayer_settings WHERE id = 1');
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update prayer settings' });
  }
});

router.get('/salah/today', async (req, res) => {
  try {
    const dateStr = getLocalDateStr(req.query.date);
    const targetDate = new Date(`${dateStr}T12:00:00+05:30`);
    const userId = req.query.userId ? Number(req.query.userId) : null;

    // Check if user has personal custom adhan times
    let userCustomRows = [];
    if (userId) {
      const [custom] = await pool.query(
        'SELECT * FROM user_prayer_times WHERE user_id = ? AND use_custom = TRUE',
        [userId]
      );
      userCustomRows = custom;
    }

    const [settingsRows] = await pool.query('SELECT * FROM prayer_settings WHERE id = 1');
    const settings = settingsRows[0] || { city: 'Kochi', country: 'India (Kerala)', latitude: 9.9312, longitude: 76.2673 };

    let times;
    if (userCustomRows.length > 0) {
      const uTimes = userCustomRows[0];
      const pad = (t) => (t ? t.toString().slice(0, 5) : '00:00');
      times = {
        fajr: pad(uTimes.fajr),
        sunrise: '06:15',
        dhuhr: pad(uTimes.dhuhr),
        asr: pad(uTimes.asr),
        maghrib: pad(uTimes.maghrib),
        isha: pad(uTimes.isha),
        source: 'user_custom',
      };
    } else {
      times = computePrayerTimes(settings, targetDate);
    }

    let logs = [];
    if (userId) {
      const [userLogs] = await pool.query(
        'SELECT prayer_name, status, completed_at, notes FROM salah_logs WHERE log_date = ? AND user_id = ?',
        [dateStr, userId]
      );
      logs = userLogs;
    }

    const logMap = {};
    logs.forEach((l) => { logMap[l.prayer_name] = l; });

    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => {
      const log = logMap[p] || { status: 'pending', completed_at: null };
      return {
        name: p,
        time: times[p],
        status: log.status,
        completed_at: log.completed_at,
        notes: log.notes,
      };
    });

    res.json({
      date: dateStr,
      city: settings.city,
      country: settings.country,
      followup_reminder_minutes: settings.followup_reminder_minutes,
      early_reminder_minutes: settings.early_reminder_minutes,
      enable_notifications: settings.enable_notifications,
      enable_sound: settings.enable_sound,
      sound_type: settings.sound_type,
      times,
      prayers,
    });
  } catch (err) {
    const dateStr = getLocalDateStr(req.query.date);
    const targetDate = new Date(`${dateStr}T12:00:00+05:30`);
    const defaultSettings = {
      city: 'Kochi',
      country: 'India (Kerala)',
      latitude: 9.9312,
      longitude: 76.2673,
      calculation_method: 'MuslimWorldLeague',
      asr_juristic: 'standard',
    };
    const times = computePrayerTimes(defaultSettings, targetDate);
    const prayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((p) => ({
      name: p,
      time: times[p],
      status: 'pending',
      completed_at: null,
      notes: null,
    }));
    res.json({
      date: dateStr,
      city: defaultSettings.city,
      country: defaultSettings.country,
      followup_reminder_minutes: 30,
      early_reminder_minutes: 10,
      enable_notifications: true,
      enable_sound: true,
      sound_type: 'takbeer',
      times,
      prayers,
    });
  }
});

router.post('/salah/log', async (req, res) => {
  try {
    const { prayer_name, status, date, notes, userId } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'Login required to record prayer status' });
    }
    const logDate = getLocalDateStr(date);
    const currentUserId = Number(userId);
    const validPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

    if (!validPrayers.includes(prayer_name)) {
      return res.status(400).json({ error: 'Invalid prayer name' });
    }

    const completedAt = (status === 'completed' || status === 'jamaah' || status === 'late')
      ? new Date()
      : null;

    await pool.query(
      `INSERT INTO salah_logs (user_id, log_date, prayer_name, status, completed_at, notes)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         status = VALUES(status),
         completed_at = VALUES(completed_at),
         notes = VALUES(notes),
         updated_at = CURRENT_TIMESTAMP`,
      [currentUserId, logDate, prayer_name, status, completedAt, notes || null]
    );

    res.json({ success: true, logDate, prayer_name, status, completed_at: completedAt });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record prayer status' });
  }
});

router.get('/salah/history', async (req, res) => {
  try {
    const limit = Number(req.query.days) || 30;
    const userId = req.query.userId ? Number(req.query.userId) : null;
    if (!userId) {
      return res.json({ logs: [], stats: { totalPrayers: 0, completed: 0, jamaah: 0, late: 0, missed: 0 } });
    }

    const [rows] = await pool.query(
      `SELECT log_date, prayer_name, status, completed_at 
       FROM salah_logs 
       WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY) AND user_id = ?
       ORDER BY log_date DESC, id ASC`,
      [limit, userId]
    );

    const stats = { totalPrayers: 0, completed: 0, jamaah: 0, late: 0, missed: 0 };
    rows.forEach((r) => {
      stats.totalPrayers++;
      if (r.status === 'completed') stats.completed++;
      if (r.status === 'jamaah') stats.jamaah++;
      if (r.status === 'late') stats.late++;
      if (r.status === 'missed') stats.missed++;
    });

    res.json({ logs: rows, stats });
  } catch (err) {
    res.json({ logs: [], stats: { totalPrayers: 0, completed: 0, jamaah: 0, late: 0, missed: 0 } });
  }
});

// ==========================================
// 7. QURAN HABIT TRACKER
// ==========================================

router.get('/quran/today', async (req, res) => {
  try {
    const dateStr = getLocalDateStr(req.query.date);
    const userId = req.query.userId ? Number(req.query.userId) : null;

    const [settings] = await pool.query('SELECT * FROM quran_settings WHERE id = 1');

    if (!userId) {
      return res.json({
        date: dateStr,
        settings: settings[0] || { daily_goal_target: 2 },
        todayLog: { completed: false, amount_read: 0, surah_name: '' },
        streak: 0,
      });
    }

    const [logs] = await pool.query(
      'SELECT * FROM quran_logs WHERE log_date = ? AND user_id = ?',
      [dateStr, userId]
    );

    const [streakRows] = await pool.query(
      `SELECT log_date, completed FROM quran_logs 
       WHERE completed = TRUE AND user_id = ?
       ORDER BY log_date DESC LIMIT 60`,
      [userId]
    );

    let streak = 0;
    let checkDate = new Date();
    const todayStr = checkDate.toISOString().slice(0, 10);
    const completedDates = new Set(
      streakRows.map((r) => new Date(r.log_date).toISOString().slice(0, 10))
    );

    if (!completedDates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = checkDate.toISOString().slice(0, 10);
      if (completedDates.has(dStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    res.json({
      date: dateStr,
      settings: settings[0] || {},
      todayLog: logs[0] || { completed: false, amount_read: 0, surah_name: '' },
      streak,
    });
  } catch (err) {
    res.json({
      date: new Date().toISOString().slice(0, 10),
      settings: { daily_goal_target: 2 },
      todayLog: { completed: false, amount_read: 0 },
      streak: 0,
    });
  }
});

router.post('/quran/log', async (req, res) => {
  try {
    const { date, completed, amount_read, surah_name, notes, userId } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'Login required to log Quran reading' });
    }
    const logDate = date || new Date().toISOString().slice(0, 10);
    const currentUserId = Number(userId);
    const completedAt = completed ? new Date() : null;

    await pool.query(
      `INSERT INTO quran_logs (user_id, log_date, completed, amount_read, surah_name, notes, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         completed = VALUES(completed),
         amount_read = VALUES(amount_read),
         surah_name = VALUES(surah_name),
         notes = VALUES(notes),
         completed_at = VALUES(completed_at)`,
      [currentUserId, logDate, Boolean(completed), amount_read || 0, surah_name || null, notes || null, completedAt]
    );

    res.json({ success: true, date: logDate, completed });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log Quran habit' });
  }
});

router.put('/settings/quran', async (req, res) => {
  try {
    const { daily_goal_type, daily_goal_target, reminder_time, reminder_enabled } = req.body;
    await pool.query(
      `UPDATE quran_settings SET 
        daily_goal_type = COALESCE(?, daily_goal_type),
        daily_goal_target = COALESCE(?, daily_goal_target),
        reminder_time = COALESCE(?, reminder_time),
        reminder_enabled = COALESCE(?, reminder_enabled)
      WHERE id = 1`,
      [daily_goal_type, daily_goal_target, reminder_time, reminder_enabled]
    );
    const [updated] = await pool.query('SELECT * FROM quran_settings WHERE id = 1');
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update quran settings' });
  }
});

// ==========================================
// 8. ADMIN BROADCAST NOTIFICATIONS & PRAYER TIMES
// ==========================================

// PUT Admin Set Global Prayer Times
router.put('/admin/prayer-times', async (req, res) => {
  try {
    const { use_custom, fajr, dhuhr, asr, maghrib, isha } = req.body;
    await pool.query(
      `UPDATE prayer_settings SET
         use_custom_times = ?,
         custom_fajr = ?,
         custom_dhuhr = ?,
         custom_asr = ?,
         custom_maghrib = ?,
         custom_isha = ?
       WHERE id = 1`,
      [
        Boolean(use_custom),
        fajr || '05:00:00',
        dhuhr || '12:30:00',
        asr || '15:45:00',
        maghrib || '18:15:00',
        isha || '19:45:00',
      ]
    );
    const [updated] = await pool.query('SELECT * FROM prayer_settings WHERE id = 1');
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update global prayer times' });
  }
});

// GET Specific User's Prayer Times for Admin
router.get('/admin/users/:userId/prayer-times', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const [rows] = await pool.query('SELECT * FROM user_prayer_times WHERE user_id = ?', [userId]);
    if (rows.length > 0) {
      res.json({ useCustom: Boolean(rows[0].use_custom), times: rows[0] });
    } else {
      res.json({ useCustom: false, times: null });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user prayer times' });
  }
});

// PUT Specific User's Prayer Times for Admin
router.put('/admin/users/:userId/prayer-times', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { use_custom, fajr, dhuhr, asr, maghrib, isha } = req.body;
    await pool.query(
      `INSERT INTO user_prayer_times (user_id, use_custom, fajr, dhuhr, asr, maghrib, isha)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         use_custom = VALUES(use_custom),
         fajr = VALUES(fajr),
         dhuhr = VALUES(dhuhr),
         asr = VALUES(asr),
         maghrib = VALUES(maghrib),
         isha = VALUES(isha)`,
      [userId, Boolean(use_custom), fajr, dhuhr, asr, maghrib, isha]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save user prayer times' });
  }
});

// POST Admin Send Broadcast Notification with Expiry
router.post('/admin/broadcast', async (req, res) => {
  try {
    const { title, message, expiryHours } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required' });
    }

    let expiresAt = null;
    if (expiryHours && Number(expiryHours) > 0) {
      expiresAt = new Date(Date.now() + Number(expiryHours) * 3600 * 1000);
    }

    const [result] = await pool.query(
      'INSERT INTO admin_announcements (title, message, expires_at) VALUES (?, ?, ?)',
      [title.trim(), message.trim(), expiresAt]
    );

    res.json({
      success: true,
      broadcast: {
        id: result.insertId,
        title: title.trim(),
        message: message.trim(),
        expires_at: expiresAt,
        created_at: new Date(),
      },
    });
  } catch (err) {
    console.error('Error sending broadcast:', err);
    res.status(500).json({ error: 'Failed to send broadcast notification' });
  }
});

// GET Admin Broadcasts List
router.get('/admin/broadcasts', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, message, expires_at, created_at FROM admin_announcements ORDER BY id DESC LIMIT 20'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch broadcasts' });
  }
});

// DELETE Admin Broadcast by ID
router.delete('/admin/broadcasts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM admin_announcements WHERE id = ?', [id]);
    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Delete broadcast error:', err);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// DELETE All Admin Broadcasts
router.delete('/admin/broadcasts', async (req, res) => {
  try {
    await pool.query('DELETE FROM admin_announcements');
    res.json({ success: true, message: 'All notifications deleted successfully' });
  } catch (err) {
    console.error('Delete all broadcasts error:', err);
    res.status(500).json({ error: 'Failed to delete all notifications' });
  }
});

// GET Latest Notification for Users (Filtering Out Expired)
router.get('/notifications/latest', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, message, expires_at, created_at FROM admin_announcements WHERE expires_at IS NULL OR expires_at > NOW() ORDER BY id DESC LIMIT 1'
    );
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json(null);
    }
  } catch (err) {
    res.json(null);
  }
});

// ==========================================
// 9. MALAYALAM HADITH, TIME & AKHIRAH MOTIVATION
// ==========================================

// GET Hourly Reflection on Time & Life after Death
router.get('/motivation/hourly', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT message, source FROM motivational_messages WHERE category = "hourly" ORDER BY RAND() LIMIT 1'
    );
    if (rows.length > 0) {
      return res.json(rows[0]);
    }
  } catch (e) { }

  const hourlyFallbacks = [
    {
      message: 'സമയം വിലപ്പെട്ടതാണ് — ഈ ജീവിതം അല്പസമയത്തെ പരീക്ഷണമാണ്; പരലോകമാണ് ശാശ്വതമായ വീട്. സമയം പാഴാക്കാതെ നമസ്കാരം കൃത്യസമയത്ത് നിർവഹിക്കുക.',
      source: 'സമയവും പരലോകവും'
    },
    {
      message: 'മരണം എപ്പോൾ വേണമെങ്കിലും മുന്നിലെത്താം. ഖബറിലെ ഇരുട്ടിൽ ആദ്യം വെളിച്ചമായി മാറുന്നത് നിങ്ങളുടെ കൃത്യനിഷ്ഠയുള്ള നമസ്കാരമാണ്.',
      source: 'പരലോക സ്മരണ'
    },
    {
      message: 'നിങ്ങളുടെ സമയം വെറുതെ പാഴാക്കാതിരിക്കുക. നാളെ അല്ലാഹുവിന്റെ മുന്നിൽ ആദ്യമായി വിചാരണ ചെയ്യപ്പെടുന്നത് നമസ്കാരത്തെ കുറിച്ചായിരിക്കും.',
      source: 'നബി വചനം (ജാമിഉത്-തിർമിദി)'
    },
    {
      message: 'ഈ ദുനിയാവിന്റെ മായക്കാഴ്ചകളിൽ മുഴുകി സമയം കളയരുത്. മരണശേഷമുള്ള ജീവിതത്തിന് നമസ്കാരം ഒരു കരുതലാക്കുക.',
      source: 'ആത്മീയ ചിന്ത'
    },
    {
      message: 'അറിയുക, ഐഹിക ജീവിതം വെറും കളിയും നേരമ്പോക്കും മാത്രമാണ്; പരലോക ഭവനമാണ് ശാശ്വതമായ വിജയം.',
      source: 'വിശുദ്ധ ഖുർആൻ (സൂറഃ അൽഅൻകബൂത് 64)'
    }
  ];

  const pick = hourlyFallbacks[Math.floor(Math.random() * hourlyFallbacks.length)];
  res.json(pick);
});

router.get('/motivation/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const [rows] = await pool.query(
      'SELECT message, source FROM motivational_messages WHERE category = ? OR category = "general" ORDER BY RAND() LIMIT 1',
      [category]
    );

    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.json({
        message: 'നിശ്ചയമായും നമസ്കാരം വിശ്വാസികൾക്ക് നിർണ്ണയിക്കപ്പെട്ട സമയങ്ങളിൽ നിർബന്ധമാക്കപ്പെട്ട ബാധ്യതയാകുന്നു.',
        source: 'വിശുദ്ധ ഖുർആൻ (സൂറഃ അന്നിസാഅ് 103)',
      });
    }
  } catch (err) {
    res.json({
      message: 'നമസ്കാരം ഇസ്ലാമിന്റെ തൂണാകുന്നു; അത് നിർവ്വഹിച്ചവൻ ദീനിനെ നിലനിർത്തി.',
      source: 'നബി വചനം (ബൈഹഖി)',
    });
  }
});

export default router;
