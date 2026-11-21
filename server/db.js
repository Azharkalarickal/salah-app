import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'srv932.hstgr.io',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'u918480384_salah',
  password: process.env.DB_PASSWORD || 'mydaY@1997',
  database: process.env.DB_NAME || 'u918480384_salah',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
});

pool.getConnection()
  .then((conn) => {
    console.log('✅ MySQL Pool connected to', process.env.DB_NAME || 'u918480384_salah');
    conn.release();
  })
  .catch((err) => {
    console.error('❌ MySQL Pool connection error:', err.message);
  });

export default pool;
