import { openDB } from './db';

export async function initDb() {
  const db = await openDB();

  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS Message (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      receiverId TEXT NOT NULL,
      content TEXT NOT NULL,
      sentAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      readAt DATETIME,
      FOREIGN KEY (senderId) REFERENCES User(id) ON DELETE CASCADE,
      FOREIGN KEY (receiverId) REFERENCES User(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_message_senderId ON Message(senderId);
    CREATE INDEX IF NOT EXISTS idx_message_receiverId ON Message(receiverId);
  `);

  console.log('✅ Chat Service: Database initialized');
}
