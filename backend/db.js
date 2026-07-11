const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:              process.env.DB_HOST     || '127.0.0.1',
  port:              process.env.DB_PORT     || 3306,
  user:              process.env.DB_USER     || 'root',
  password:          process.env.DB_PASSWORD || '',
  database:          process.env.DB_NAME     || 'casmart_db',
  waitForConnections: true,
  connectionLimit:   10,
  queueLimit:        0,
  timezone:          '+07:00',
});

// Test connection on startup
pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected to database:', process.env.DB_NAME || 'casmart_db');
    conn.release();
  })
  .catch(err => {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Make sure Laragon MySQL is running and casmart.sql has been imported.');
  });

module.exports = pool;
