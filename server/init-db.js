import pool from './db.js';

export async function initializeDatabase() {
  let conn;
  try {
    console.log('🔄 Checking MySQL database connection (with 5s timeout)...');
    
    const connectionPromise = pool.getConnection();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Connection timed out after 5000ms')), 5000)
    );

    conn = await Promise.race([connectionPromise, timeoutPromise]);
    console.log('✅ Connected to MySQL database, ensuring tables exist...');

    // 1. Prayer Settings Table (Default: Kochi, Kerala)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS prayer_settings (
        id INT PRIMARY KEY DEFAULT 1,
        city VARCHAR(100) DEFAULT 'Kochi',
        country VARCHAR(100) DEFAULT 'India (Kerala)',
        latitude DECIMAL(10, 7) DEFAULT 9.9312,
        longitude DECIMAL(10, 7) DEFAULT 76.2673,
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
        sound_type VARCHAR(50) DEFAULT 'bell',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Ensure Kochi is updated
    await conn.query(`
      UPDATE prayer_settings SET 
        city = 'Kochi', 
        country = 'India (Kerala)', 
        latitude = 9.9312, 
        longitude = 76.2673,
        calculation_method = 'MuslimWorldLeague',
        asr_juristic = 'standard'
      WHERE id = 1;
    `);

    // 2. Users Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_code VARCHAR(30) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar VARCHAR(50) DEFAULT '🕌',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. User Custom Prayer Times (Allows each user to set custom adhan times)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_prayer_times (
        user_id INT PRIMARY KEY,
        use_custom BOOLEAN DEFAULT TRUE,
        fajr TIME DEFAULT '05:15:00',
        dhuhr TIME DEFAULT '12:30:00',
        asr TIME DEFAULT '15:45:00',
        maghrib TIME DEFAULT '18:15:00',
        isha TIME DEFAULT '19:30:00',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Admin Auth Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admin_auth (
        id INT PRIMARY KEY DEFAULT 1,
        password VARCHAR(255) NOT NULL DEFAULT '1234',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      INSERT IGNORE INTO admin_auth (id, password) VALUES (1, '1234');
    `);

    // 5. Salah Logs Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS salah_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT 1,
        log_date DATE NOT NULL,
        prayer_name VARCHAR(20) NOT NULL,
        status ENUM('completed', 'jamaah', 'late', 'missed', 'pending') DEFAULT 'pending',
        completed_at DATETIME NULL,
        notes VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_date_prayer (user_id, log_date, prayer_name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Quran Settings & Logs
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
      CREATE TABLE IF NOT EXISTS quran_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT 1,
        log_date DATE NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        amount_read INT DEFAULT 0,
        surah_name VARCHAR(100) NULL,
        notes VARCHAR(255) NULL,
        completed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_user_date_quran (user_id, log_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 7. Family Groups Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS family_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        group_code VARCHAR(30) UNIQUE NOT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Group Members Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS group_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        role ENUM('admin', 'member') DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_group_user (group_id, user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. Group Messages (Chat with photo support)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS group_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        user_id INT NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        image MEDIUMTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Add image column if missing
    try {
      await conn.query(`ALTER TABLE group_messages ADD COLUMN image MEDIUMTEXT NULL`);
    } catch (e) {}

    // 10. Motivational Messages Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS motivational_messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        source VARCHAR(100) NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 11. Admin Announcements / Broadcast Notifications Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS admin_announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed Malayalam Hadiths & Quran quotes if table is empty
    const [msgCount] = await conn.query('SELECT COUNT(*) as count FROM motivational_messages');
    if (msgCount[0].count === 0) {
      const malayalamQuotes = [
        ['general', 'നിശ്ചയമായും നമസ്കാരം വിശ്വാസികൾക്ക് നിർണ്ണയിക്കപ്പെട്ട സമയങ്ങളിൽ നിർബന്ധമാക്കപ്പെട്ട ബാധ്യതയാകുന്നു.', 'വിശുദ്ധ ഖുർആൻ (സൂറഃ അന്നിസാഅ് 103)'],
        ['general', 'നമസ്കാരം ഇസ്ലാമിന്റെ തൂണാകുന്നു; അത് നിർവ്വഹിച്ചവൻ ദീനിനെ നിലനിർത്തി.', 'നബി വചനം (ബൈഹഖി)'],
        ['general', 'അന്ത്യദിനത്തിൽ ഒരടിമയോട് ആദ്യമായി വിചാരണ ചെയ്യപ്പെടുന്നത് അവന്റെ നമസ്കാരത്തെ കുറിച്ചായിരിക്കും.', 'നബി വചനം (ജാമിഉത്-തിർമിദി)'],
        ['general', 'സ്വർഗ്ഗത്തിന്റെ താക്കോൽ നമസ്കാരമാണ്.', 'നബി വചനം (ജാമിഉത്-തിർമിദി)'],
        ['general', 'അറിയുക, അല്ലാഹുവിന്റെ സ്മരണ കൊണ്ടത്രെ ഹൃദയങ്ങൾക്ക് ശാന്തി കൈവരുന്നത്.', 'വിശുദ്ധ ഖുർആൻ (സൂറഃ അർറഅ്ദ് 28)'],
        ['general', 'നിങ്ങൾ ക്ഷമ കൊണ്ടും നമസ്കാരം കൊണ്ടും അല്ലാഹുവിന്റെ സഹായം തേടുക.', 'വിശുദ്ധ ഖുർആൻ (സൂറഃ അൽബഖറ 45)'],
        ['general', 'ഒരാളും ശിർക്കും കുഫ്റും തമ്മിലുള്ള അതിർവരമ്പ് നമസ്കാരം ഉപേക്ഷിക്കലാണ്.', 'നബി വചനം (സ്വഹീഹ് മുസ്ലിം)'],
        ['fajr', 'ഫജ്ർ നമസ്കാരത്തിന് മുമ്പുള്ള രണ്ട് റക്അത്ത് ഈ ദുനിയാവിനേക്കാളും അതിലുള്ളതിനേക്കാളും ഉത്തമമാണ്.', 'നബി വചനം (സ്വഹീഹ് മുസ്ലിം)'],
        ['quran', 'ഖുർആൻ പാരായണം ചെയ്യുക; അത് അന്ത്യദിനത്തിൽ അതിന്റെ ആളുകൾക്ക് ശുപാർശകനായി വരുന്നതാണ്.', 'നബി വചനം (സ്വഹീഹ് മുസ്ലിം)'],
        ['general', 'നിശ്ചയമായും നമസ്കാരം നീചവൃത്തികളിൽ നിന്നും തിന്മകളിൽ നിന്നും തടയുന്നു.', 'വിശുദ്ധ ഖുർആൻ (സൂറഃ അൽഅൻകബൂത് 45)'],
        ['general', 'ഒരു അടിമ തന്റെ റബ്ബിലേക്ക് ഏറ്റവും അടുക്കുന്ന അവസ്ഥ അവൻ സുജൂദിലായിരിക്കുമ്പോഴാണ്.', 'നബി വചനം (സ്വഹീഹ് മുസ്ലിം)'],
      ];
      for (const [cat, msg, src] of malayalamQuotes) {
        await conn.query(
          'INSERT INTO motivational_messages (category, message, source) VALUES (?, ?, ?)',
          [cat, msg, src]
        );
      }
    }

    console.log('✅ Database upgraded: admin announcements & Malayalam hadith seeds active!');
  } catch (err) {
    console.warn('⚠️ Database schema init notice:', err.message);
  } finally {
    if (conn) {
      try { conn.release(); } catch (e) {}
    }
  }
}

if (process.argv[1] && process.argv[1].endsWith('init-db.js')) {
  initializeDatabase().then(() => process.exit(0)).catch(() => process.exit(1));
}
