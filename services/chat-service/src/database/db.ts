import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import dotenv from 'dotenv';

dotenv.config();

const dbPath = process.env.DATABASE_PATH || '/app/data/chat.sqlite';

export const openDB = async () => {
  return await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
};