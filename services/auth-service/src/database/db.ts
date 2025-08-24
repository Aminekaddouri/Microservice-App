import sqlite3 from 'sqlite3';

const dbPath = process.env.DATABASE_PATH || '/app/data/auth.sqlite';

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Could not connect to database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

export default db;

