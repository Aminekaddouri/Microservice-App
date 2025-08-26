import { openDB } from '../database/db';
import { v4 as uuidv4 } from 'uuid';

export type Notification = {
  id: string;
  senderId: string;
  content: string;
  type: string;
  sentAt: string;
};

export type NotificationInput = {
  senderID: string;
  receiversIDs: string[];
  content: string;
  type: string;
};

export async function getNotifications(userId: string): Promise<Notification[]> {
  const db = await openDB();
  return await db.all<Notification[]>(
    `SELECT n.* FROM notification n
     JOIN NotificationReceiver nr ON n.id = nr.notificationId
     WHERE nr.receiverId = ?
     ORDER BY datetime(n.sentAt) DESC`,
    [userId]
  );
}

export async function sendNotification(data: NotificationInput): Promise<void> {
  const db = await openDB();
  const notificationId = uuidv4();
  const sentAt = new Date().toISOString();

  const insert = await db.prepare(
    `INSERT INTO notification (id, senderId, content, type, sentAt)
     VALUES (?, ?, ?, ?, ?)`
  );

  await insert.run(notificationId, data.senderID, data.content, data.type, sentAt);
  await insert.finalize();

  const receiverStmt = await db.prepare(
    `INSERT INTO NotificationReceiver (id, notificationId, receiverId)
     VALUES (?, ?, ?)`
  );

  for (const receiverId of data.receiversIDs) {
    await receiverStmt.run(uuidv4(), notificationId, receiverId);
  }

  await receiverStmt.finalize();
}

export async function clearAllNotifications(userId: string): Promise<void> {
  const db = await openDB();
  await db.run(`DELETE FROM NotificationReceiver WHERE receiverId = ?`, [userId]);
}