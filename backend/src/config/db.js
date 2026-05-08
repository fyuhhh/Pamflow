const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pamflow_db',
  connectionLimit: 100,
  waitForConnections: true,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;
