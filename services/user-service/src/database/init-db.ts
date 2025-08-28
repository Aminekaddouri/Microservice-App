import { openDB } from "./db";

export async function initDb() {
  const db = await openDB();

  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS User (
      id TEXT PRIMARY KEY,
      fullName TEXT NOT NULL,
      nickName TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      picture TEXT NOT NULL,
      verified BOOLEAN DEFAULT FALSE,
      isGoogleUser BOOLEAN DEFAULT FALSE,
      twoFactorEnabled BOOLEAN DEFAULT FALSE,
      twoFactorSecret TEXT,
      twoFactorBackupCodes TEXT,
      joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS Friendship (
      id TEXT PRIMARY KEY,
      user1ID TEXT NOT NULL,
      user2ID TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')),
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user1ID) REFERENCES User(id) ON DELETE CASCADE,
      FOREIGN KEY (user2ID) REFERENCES User(id) ON DELETE CASCADE,
      UNIQUE(user1ID, user2ID)
    );

    CREATE TABLE IF NOT EXISTS Theme (
      id TEXT PRIMARY KEY,
      userId TEXT,
      name TEXT NOT NULL,
      board TEXT NOT NULL,
      colors TEXT NOT NULL,
      board_color VARCHAR(7) DEFAULT '#000000',
      left_paddle_color VARCHAR(7) DEFAULT '#FFFFFF',
      right_paddle_color VARCHAR(7) DEFAULT '#FFFFFF',
      ball_color VARCHAR(7) DEFAULT '#FFFFFF',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
    );
  `);

  console.log("✅ User Service: Database initialized");
}
