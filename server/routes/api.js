import express from 'express';
import pool from '../db.js';
import * as adhan from 'adhan';

const router = express.Router();

// Helper: Calculate prayer times based on settings and date
function computePrayerTimes(settings, targetDate = new Date()) {
  if (settings.use_custom_times) {
    const pad = (t) => (t ? t.toString().slice(0, 5) : '00:00');
    return {
      fajr: pad(settings.custom_fajr),
      sunrise: '06:00',
      dhuhr: pad(settings.custom_dhuhr),
      asr: pad(settings.custom_asr),
      maghrib: pad(settings.custom_maghrib),
      isha: pad(settings.custom_isha),
      source: 'custom',
    };
  }

  const coordinates = new adhan.Coordinates(
    Number(settings.latitude) || 21.4225,
    Number(settings.longitude) || 39.8262
  );

  let params;
  switch (settings.calculation_method) {
    case 'MuslimWorldLeague':
      params = adhan.CalculationMethod.MuslimWorldLeague();
      break;
    case 'Egyptian':
      params = adhan.CalculationMethod.Egyptian();
      break;
    case 'Karachi':
      params = adhan.CalculationMethod.Karachi();
      break;
    case 'UmmAlQura':
      params = adhan.CalculationMethod.UmmAlQura();
      break;
    case 'Dubai':
      params = adhan.CalculationMethod.Dubai();
      break;
    case 'MoonsightingCommittee':
      params = adhan.CalculationMethod.MoonsightingCommittee();
      break;
    case 'NorthAmerica':
    case 'ISNA':
      params = adhan.CalculationMethod.NorthAmerica();
      break;
    case 'Kuwait':
      params = adhan.CalculationMethod.Kuwait();
      break;
    case 'Qatar':
      params = adhan.CalculationMethod.Qatar();
      break;
    case 'Singapore':
      params = adhan.CalculationMethod.Singapore();
      break;
    case 'Tehran':
      params = adhan.CalculationMethod.Tehran();
      break;
    case 'Turkey':
      params = adhan.CalculationMethod.Turkey();
      break;
    default:
      params = adhan.CalculationMethod.MuslimWorldLeague();
  }

  if (settings.asr_juristic === 'hanafi') {
    params.madhab = adhan.Madhab.Hanafi;
  } else {
    params.madhab = adhan.Madhab.Shafi;
  }

  params.fajrAngle = params.fajrAngle || 18;
  params.ishaAngle = params.ishaAngle || 17;

  // Apply manual offsets in minutes
  params.adjustments.fajr = Number(settings.fajr_offset) || 0;
  params.adjustments.dhuhr = Number(settings.dhuhr_offset) || 0;
  params.adjustments.asr = Number(settings.asr_offset) || 0;
  params.adjustments.maghrib = Number(settings.maghrib_offset) || 0;
  params.adjustments.isha = Number(settings.isha_offset) || 0;

  const prayerTimes = new adhan.PrayerTimes(coordinates, targetDate, params);

  const formatTime = (dateObj) => {
    if (!dateObj) return '00:00';
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
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

// 1. GET Settings (Prayer + Quran)
router.get('/settings', async (req, res) => {
  try {
    const [prayerRows] = await pool.query('SELECT * FROM prayer_settings WHERE id = 1');
    const [quranRows] = await pool.query('SELECT * FROM quran_settings WHERE id = 1');
    res.json({
      prayer: prayerRows[0] || { city: 'Mecca', country: 'Saudi Arabia', calculation_method: 'MuslimWorldLeague' },
      quran: quranRows[0] || { daily_goal_target: 2, reminder_time: '20:30:00' },
    });
  } catch (err) {
    console.warn('Fallback settings used due to DB notice:', err.message);
    res.json({
      prayer: { city: 'Mecca', country: 'Saudi Arabia', latitude: 21.4225, longitude: 39.8262, calculation_method: 'MuslimWorldLeague', followup_reminder_minutes: 30, enable_sound: true },
      quran: { daily_goal_type: 'pages', daily_goal_target: 2, reminder_time: '20:30:00', reminder_enabled: true },
    });
  }
});

// 2. PUT Prayer Settings
router.put('/settings/prayer', async (req, res) => {
  try {
    const {
      city,
      country,
      latitude,
      longitude,
      calculation_method,
      asr_juristic,
      fajr_offset,
      dhuhr_offset,
      asr_offset,
      maghrib_offset,
      isha_offset,
      use_custom_times,
      custom_fajr,
      custom_dhuhr,
      custom_asr,
      custom_maghrib,
      custom_isha,
      followup_reminder_minutes,
      early_reminder_minutes,
      enable_notifications,
      enable_sound,
      sound_type,
    } = req.body;

    await pool.query(
      `UPDATE prayer_settings SET 
        city = COALESCE(?, city),
        country = COALESCE(?, country),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        calculation_method = COALESCE(?, calculation_method),
        asr_juristic = COALESCE(?, asr_juristic),
        fajr_offset = COALESCE(?, fajr_offset),
        dhuhr_offset = COALESCE(?, dhuhr_offset),
        asr_offset = COALESCE(?, asr_offset),
        maghrib_offset = COALESCE(?, maghrib_offset),
        isha_offset = COALESCE(?, isha_offset),
        use_custom_times = COALESCE(?, use_custom_times),
        custom_fajr = COALESCE(?, custom_fajr),
        custom_dhuhr = COALESCE(?, custom_dhuhr),
        custom_asr = COALESCE(?, custom_asr),
        custom_maghrib = COALESCE(?, custom_maghrib),
        custom_isha = COALESCE(?, custom_isha),
        followup_reminder_minutes = COALESCE(?, followup_reminder_minutes),
        early_reminder_minutes = COALESCE(?, early_reminder_minutes),
        enable_notifications = COALESCE(?, enable_notifications),
        enable_sound = COALESCE(?, enable_sound),
        sound_type = COALESCE(?, sound_type)
      WHERE id = 1`,
      [
        city,
        country,
        latitude,
        longitude,
        calculation_method,
        asr_juristic,
        fajr_offset,
        dhuhr_offset,
        asr_offset,
        maghrib_offset,
        isha_offset,
        use_custom_times,
        custom_fajr,
        custom_dhuhr,
        custom_asr,
        custom_maghrib,
        custom_isha,
        followup_reminder_minutes,
        early_reminder_minutes,
        enable_notifications,
        enable_sound,
        sound_type,
      ]
    );

    const [updated] = await pool.query('SELECT * FROM prayer_settings WHERE id = 1');
    res.json({ success: true, settings: updated[0] });
  } catch (err) {
    console.error('Error updating prayer settings:', err);
    res.status(500).json({ error: 'Failed to update prayer settings' });
  }
});

// 3. PUT Quran Settings
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
    console.error('Error updating quran settings:', err);
    res.status(500).json({ error: 'Failed to update quran settings' });
  }
});

// 4. GET Today's Salah Status & Times
router.get('/salah/today', async (req, res) => {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const dateStr = targetDate.toISOString().slice(0, 10);

    const [settingsRows] = await pool.query('SELECT * FROM prayer_settings WHERE id = 1');
    const settings = settingsRows[0] || {};
    const times = computePrayerTimes(settings, targetDate);

    // Fetch existing logs for today
    const [logs] = await pool.query(
      'SELECT prayer_name, status, completed_at, notes FROM salah_logs WHERE log_date = ?',
      [dateStr]
    );

    const logMap = {};
    logs.forEach((l) => {
      logMap[l.prayer_name] = l;
    });

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
    console.warn('Fallback prayer calculations used due to DB notice:', err.message);
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    const dateStr = targetDate.toISOString().slice(0, 10);
    const defaultSettings = {
      city: 'Mecca',
      country: 'Saudi Arabia',
      latitude: 21.4225,
      longitude: 39.8262,
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

// 5. POST Log Salah status (e.g. 'completed', 'jamaah', 'late', 'missed', 'pending')
router.post('/salah/log', async (req, res) => {
  try {
    const { prayer_name, status, date, notes } = req.body;
    const logDate = date || new Date().toISOString().slice(0, 10);
    const validPrayers = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

    if (!validPrayers.includes(prayer_name)) {
      return res.status(400).json({ error: 'Invalid prayer name' });
    }

    const completedAt = (status === 'completed' || status === 'jamaah' || status === 'late')
      ? new Date()
      : null;

    await pool.query(
      `INSERT INTO salah_logs (log_date, prayer_name, status, completed_at, notes)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         status = VALUES(status),
         completed_at = VALUES(completed_at),
         notes = VALUES(notes),
         updated_at = CURRENT_TIMESTAMP`,
      [logDate, prayer_name, status, completedAt, notes || null]
    );

    res.json({ success: true, logDate, prayer_name, status, completed_at: completedAt });
  } catch (err) {
    console.error('Error updating salah log:', err);
    res.status(500).json({ error: 'Failed to record prayer status' });
  }
});

// 6. GET Salah History (Last 30 days)
router.get('/salah/history', async (req, res) => {
  try {
    const limit = Number(req.query.days) || 30;
    const [rows] = await pool.query(
      `SELECT log_date, prayer_name, status, completed_at 
       FROM salah_logs 
       WHERE log_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       ORDER BY log_date DESC, id ASC`,
      [limit]
    );

    // Calculate total completed vs pending
    const stats = {
      totalPrayers: 0,
      completed: 0,
      jamaah: 0,
      late: 0,
      missed: 0,
    };

    rows.forEach((r) => {
      stats.totalPrayers++;
      if (r.status === 'completed') stats.completed++;
      if (r.status === 'jamaah') stats.jamaah++;
      if (r.status === 'late') stats.late++;
      if (r.status === 'missed') stats.missed++;
    });

    res.json({ logs: rows, stats });
  } catch (err) {
    console.error('Error fetching salah history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// 7. GET Quran Today Status
router.get('/quran/today', async (req, res) => {
  try {
    const dateStr = req.query.date || new Date().toISOString().slice(0, 10);
    const [settings] = await pool.query('SELECT * FROM quran_settings WHERE id = 1');
    const [logs] = await pool.query('SELECT * FROM quran_logs WHERE log_date = ?', [dateStr]);

    // Calculate current streak
    const [streakRows] = await pool.query(
      `SELECT log_date, completed FROM quran_logs 
       WHERE completed = TRUE 
       ORDER BY log_date DESC LIMIT 60`
    );

    let streak = 0;
    let checkDate = new Date();
    // Allow today to not break streak if not yet completed
    const todayStr = checkDate.toISOString().slice(0, 10);
    const completedDates = new Set(
      streakRows.map((r) => {
        const d = new Date(r.log_date);
        return d.toISOString().slice(0, 10);
      })
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
    console.error('Error fetching quran status:', err);
    res.status(500).json({ error: 'Failed to fetch Quran status' });
  }
});

// 8. POST Quran Log
router.post('/quran/log', async (req, res) => {
  try {
    const { date, completed, amount_read, surah_name, notes } = req.body;
    const logDate = date || new Date().toISOString().slice(0, 10);
    const completedAt = completed ? new Date() : null;

    await pool.query(
      `INSERT INTO quran_logs (log_date, completed, amount_read, surah_name, notes, completed_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         completed = VALUES(completed),
         amount_read = VALUES(amount_read),
         surah_name = VALUES(surah_name),
         notes = VALUES(notes),
         completed_at = VALUES(completed_at)`,
      [logDate, Boolean(completed), amount_read || 0, surah_name || null, notes || null, completedAt]
    );

    res.json({ success: true, date: logDate, completed });
  } catch (err) {
    console.error('Error logging Quran habit:', err);
    res.status(500).json({ error: 'Failed to log Quran habit' });
  }
});

// 9. GET Motivational Message (for prayer or quran)
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
        message: 'Salah is your direct conversation with Allah. Never delay it.',
        source: 'Reflection',
      });
    }
  } catch (err) {
    res.json({
      message: 'Come to prayer, come to success.',
      source: 'Adhan',
    });
  }
});

export default router;
