import  db  from './db';

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS User (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    nickName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    picture TEXT NOT NULL,
    password TEXT,
    verified BOOLEAN DEFAULT FALSE,
    joinedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS Verification (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL UNIQUE,
    token TEXT NOT NULL,
    type TEXT DEFAULT 'email',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME NOT NULL,
    verifiedAt DATETIME,
    FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
  );
`);

console.log('Auth database initialized.');