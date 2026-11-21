import pool from './db.js';

export async function initializeDatabase() {
  let conn;
  try {
    console.log('🔄 Checking MySQL database connection (with 5s timeout)...');
    
    // Timeout wrapper to guarantee it never hangs startup
    const connectionPromise = pool.getConnection();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out after 5000ms')), 5000)
    );

    conn = await Promise.race([connectionPromise, timeoutPromise]);
    console.log('✅ Connected to MySQL database, ensuring tables exist...');

    // 1. Prayer Settings Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS prayer_settings (
        id INT PRIMARY KEY DEFAULT 1,
        city VARCHAR(100) DEFAULT 'Mecca',
        country VARCHAR(100) DEFAULT 'Saudi Arabia',
        latitude DECIMAL(10, 7) DEFAULT 21.4225,
        longitude DECIMAL(10, 7) DEFAULT 39.8262,
        calculation_method VARCHAR(50) DEFAULT 'MuslimWorldLeague',
        asr_juristic VARCHAR(20) DEFAULT 'standard',
        fajr_offset INT DEFAULT 0,
        dhuhr_offset INT DEFAULT 0,
        asr_offset INT DEFAULT 0,
        maghrib_offset INT DEFAULT 0,
        isha_offset INT DEFAULT 0,
        use_custom_times BOOLEAN DEFAULT FALSE,
        custom_fajr TIME DEFAULT '05:00:00',
        custom_dhuhr TIME DEFAULT '12:30:00',
        custom_asr TIME DEFAULT '15:45:00',
        custom_maghrib TIME DEFAULT '18:15:00',
        custom_isha TIME DEFAULT '19:45:00',
        followup_reminder_minutes INT DEFAULT 30,
        early_reminder_minutes INT DEFAULT 10,
        enable_notifications BOOLEAN DEFAULT TRUE,
        enable_sound BOOLEAN DEFAULT TRUE,
        sound_type VARCHAR(50) DEFAULT 'takbeer',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure default settings exist
    await conn.query(`
      INSERT IGNORE INTO prayer_settings (id, city, country, latitude, longitude)
      VALUES (1, 'Mecca', 'Saudi Arabia', 21.4225, 39.8262);
    `);

    // 2. Salah Logs Table (Daily record for each prayer)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS salah_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        log_date DATE NOT NULL,
        prayer_name VARCHAR(20) NOT NULL,
        status ENUM('completed', 'jamaah', 'late', 'missed', 'pending') DEFAULT 'pending',
        completed_at DATETIME NULL,
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_date_prayer (log_date, prayer_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Quran Settings Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS quran_settings (
        id INT PRIMARY KEY DEFAULT 1,
        daily_goal_type VARCHAR(20) DEFAULT 'pages',
        daily_goal_target INT DEFAULT 2,
        reminder_time TIME DEFAULT '20:30:00',
        reminder_enabled BOOLEAN DEFAULT TRUE,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      INSERT IGNORE INTO quran_settings (id, daily_goal_type, daily_goal_target, reminder_time)
      VALUES (1, 'pages', 2, '20:30:00');
    `);

    // 4. Quran Logs Table (Daily reading log)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS quran_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        log_date DATE NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        amount_read INT DEFAULT 0,
        surah_name VARCHAR(100) NULL,
        notes VARCHAR(255) NULL,
        completed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_date_quran (log_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Motivational Messages Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS motivational_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        source VARCHAR(100) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    const [msgs] = await conn.query('SELECT COUNT(*) as count FROM motivational_messages');
    if (msgs[0].count === 0) {
      const seedMessages = [
        ['fajr', 'Prayer is better than sleep. Begin your day with light and the protection of Allah.', 'Sahih Muslim'],
        ['fajr', 'Whoever prays the dawn prayer is under the protection of Allah.', 'Sahih Muslim 657'],
        ['dhuhr', 'Pause your busy workday. Reconnect your heart to the Creator of all success.', 'Reflections'],
        ['asr', 'Guard strictly the prayers, especially the middle prayer (Asr). Take 5 minutes now.', 'Surah Al-Baqarah 2:238'],
        ['maghrib', 'Maghrib time is precious and passes quickly. Stand before your Lord before dinner.', 'Daily Reminder'],
        ['isha', 'End your night in peace and forgiveness. Do not let sleep overtake you before Isha.', 'Sahih al-Bukhari'],
        ['general', 'Success begins with Salah. Take 5 minutes to fulfill your covenant with Allah.', 'Surah Al-Mu’minun 23:1-2'],
        ['quran', 'Take 5 minutes to recite the Quran today. It will be an intercessor on the Day of Resurrection.', 'Sahih Muslim 804']
      ];
      await conn.query(
        'INSERT INTO motivational_messages (category, message, source) VALUES ?',
        [seedMessages]
      );
    }

    console.log('✅ Database schema verified and ready!');
  } catch (err) {
    console.warn('⚠️ Database notice (App will run with built-in calculations):', err.message);
    console.warn('Tip: If using Hostinger, ensure Remote MySQL allows % (Any Host).');
  } finally {
    if (conn) {
      try { conn.release(); } catch (e) {}
    }
  }
}
