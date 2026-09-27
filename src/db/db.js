const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

let dbType = 'sqlite';
let pool = null;
let sqliteDb = null;

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (dbUrl) {
  dbType = 'postgres';
  // Supabase PostgreSQL Connection
  const connectionString = dbUrl.startsWith('postgres://') 
    ? dbUrl.replace('postgres://', 'postgresql://') 
    : dbUrl;

  pool = new Pool({
    connectionString: connectionString,
    ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false }
  });
  console.log('⚡ Connected to Supabase PostgreSQL Database');
} else {
  dbType = 'sqlite';
  const dbPath = path.join(__dirname, '../../knowledge.db');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error connecting to SQLite database:', err);
    } else {
      console.log(`📁 Connected to SQLite Database at ${dbPath}`);
    }
  });
}

/**
 * Execute SQL Query across Postgres (Supabase) or SQLite seamlessly
 */
async function query(text, params = []) {
  if (dbType === 'postgres') {
    // Postgres uses $1, $2, etc. If query uses ?, convert ? to $1, $2
    let paramIndex = 1;
    const pgText = text.replace(/\?/g, () => `$${paramIndex++}`);
    const res = await pool.query(pgText, params);
    return res.rows;
  } else {
    // SQLite
    return new Promise((resolve, reject) => {
      const isSelect = text.trim().toUpperCase().startsWith('SELECT') || text.trim().toUpperCase().startsWith('PRAGMA');
      if (isSelect) {
        sqliteDb.all(text, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      } else {
        sqliteDb.run(text, params, function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      }
    });
  }
}

async function queryOne(text, params = []) {
  const rows = await query(text, params);
  return rows && rows.length > 0 ? rows[0] : null;
}

module.exports = {
  query,
  queryOne,
  dbType
};
