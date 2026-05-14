const mysql = require('mysql2/promise');
const knex = require('./src/config/knex');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pamflow_db'
};

/**
 * Ensures the database exists and runs Knex migrations/seeds.
 */
async function initializeDB(retries = 5, delay = 5000) {
  while (retries > 0) {
    try {
      // 1. Connect without database first to ensure it exists
      const connection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        connectTimeout: 30000
      });

      console.log(`[DB] Ensuring database '${dbConfig.database}' exists...`);
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\``);
      await connection.end();

      // 2. Run Knex Migrations
      console.log('[DB] Running Knex migrations...');
      await knex.migrate.latest();
      console.log('[DB] Migrations completed.');

      // 3. Run Knex Seeds
      console.log('[DB] Running Knex seeds...');
      await knex.seed.run();
      console.log('[DB] Seeds completed.');

      // 4. Return the pool from config/db for the rest of the app
      const pool = require('./src/config/db');
      console.log('[DB] Database initialization successful.');
      return pool;
    } catch (err) {
      console.error(`[DB] Initialization failed (${retries} retries left):`, err.message);
      retries -= 1;
      if (retries === 0) {
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

module.exports = initializeDB;
