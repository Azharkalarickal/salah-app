import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
  console.log('Testing MySQL connection to:', process.env.DB_HOST, 'Database:', process.env.DB_NAME);
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      connectTimeout: 10000,
    });
    console.log('✅ Connected successfully to MySQL database!');
    const [rows] = await connection.query('SELECT 1 + 1 AS result');
    console.log('✅ Query test result:', rows);
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Note: Hostinger may require Remote MySQL IP authorization (add your IP or % in Hostinger hPanel -> Remote MySQL).');
    }
  }
}

testConnection();
