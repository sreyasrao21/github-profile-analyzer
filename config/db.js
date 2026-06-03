const mysql = require('mysql2/promise');

function getConfig() {
  if (process.env.MYSQL_URL) {
    const url = new URL(process.env.MYSQL_URL);
    return {
      host: url.hostname,
      port: parseInt(url.port, 10) || 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.slice(1),
    };
  }
  return {
    host: process.env.MYSQL_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT, 10) || 3306,
    user: process.env.MYSQL_USER || process.env.DB_USER || 'root',
    password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || process.env.DB_NAME || 'github_profile_analyzer',
  };
}

const pool = mysql.createPool({
  ...getConfig(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function initDb() {
  const conn = await pool.getConnection();
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255),
      avatar_url VARCHAR(500),
      bio TEXT,
      company VARCHAR(255),
      blog VARCHAR(500),
      location VARCHAR(255),
      email VARCHAR(255),
      twitter_username VARCHAR(255),
      public_repos INT DEFAULT 0,
      public_gists INT DEFAULT 0,
      followers INT DEFAULT 0,
      following INT DEFAULT 0,
      github_created_at DATETIME,
      profile_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  conn.release();
}

module.exports = { pool, initDb };
