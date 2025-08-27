import { openDB } from '../database/db';
import { v4 as uuidv4 } from 'uuid';


export type Notification = {
    id: string;
    senderId: string;
    content: string;
    type: string;
    sentAt: string;
};

export type notificationInput = {
    senderID: string;
    receiversIDs: string[];
    content: string;
    type: string;
};

async function getNotifications(userId: string): Promise<Notification[]> {
    const db = await openDB();
    console.log("YES IS BASTA BASE");
    const notifications = await db.all<Notification[]>(
        `SELECT n.* FROM notification n
         JOIN NotificationReceiver nr ON n.id = nr.notificationId
         WHERE nr.receiverId = ?
         ORDER BY datetime(n.sentAt) DESC`,
        [userId]
    );
    return notifications;
}

async function sendNotification(data: notificationInput): Promise<void> {
    const db = await openDB();
    const notificationId = uuidv4();
    const sentAt = new Date().toISOString();

    try {
        // Insert the notification
        await db.run(
            `INSERT INTO notification (id, senderId, content, type, sentAt)
             VALUES (?, ?, ?, ?, ?)`,
            [notificationId, data.senderID, data.content, data.type, sentAt]
        );

        // Prepare statement for inserting receivers
        const insertReceiverStmt = await db.prepare(
            `INSERT INTO NotificationReceiver (id, notificationId, receiverId)
             VALUES (?, ?, ?)`
        );

        for (const receiverId of data.receiversIDs) {
            await insertReceiverStmt.run(uuidv4(), notificationId, receiverId);
        }

        await insertReceiverStmt.finalize();
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function clearAllNotifications(userId: string): Promise<void> {
    const db = await openDB();
    try {
        // Delete all notifications for the user
        await db.run(
            `DELETE FROM NotificationReceiver WHERE receiverId = ?`,
            [userId]
        );
        await db.run(
            `DELETE FROM notification WHERE id IN (SELECT notificationId FROM NotificationReceiver WHERE receiverId = ?)`,
            [userId]
        );
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function deleteNotification(notificationId: string): Promise<void> {
    const db = await openDB();
    try {
        // First delete from NotificationReceiver to avoid foreign key conflicts
        await db.run(
            `DELETE FROM NotificationReceiver WHERE notificationId = ?`,
            [notificationId]
        );

        // Then delete the notification itself
        await db.run(
            `DELETE FROM notification WHERE id = ?`,
            [notificationId]
        );

    } catch (error) {
        console.error(error);
        throw error;
    }
}


export default {
    getNotifications,
    sendNotification,
    clearAllNotifications,
    deleteNotification
};