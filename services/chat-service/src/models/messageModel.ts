import { openDB } from '../database/db';
import { v4 as uuidv4 } from 'uuid';


export type Message = {
    id: string;
    senderId: string;
    receiverId: string;
    content: string;
    sentAt: string;
    readAt?: string | null;
};

export async function getConvMessages(userId: string, friendId: string): Promise<Message[]> {
    const db = await openDB();
    const messages = await db.all<Message[]>(
        `SELECT * FROM message 
         WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
         ORDER BY datetime(sentAt) DESC`,
        [userId, friendId, friendId, userId]
    );
    return messages;
}

export async function getMsgById(id: string): Promise<Message | null> {
    const db = await openDB();
    const msg = await db.get<Message>('SELECT * FROM message WHERE id = ?', [id]);
    return msg || null;
}

export async function getUserConversations(userId: string): Promise<Message[][]> {
    const db = await openDB();
    const messages = await db.all<Message[]>(
        `SELECT * FROM message 
         WHERE senderId = ? OR receiverId = ?
         ORDER BY datetime(sentAt) DESC`,
        [userId, userId]
    );

    const convMap = new Map<string, Message[]>();
    for (const msg of messages) {
        const otherUser = msg.senderId === userId ? msg.receiverId : msg.senderId;
        const key = [userId, otherUser].sort().join('_'); // sort to avoid duplication
        if (!convMap.has(key)) convMap.set(key, []);
        convMap.get(key)?.push(msg);
    }

    return Array.from(convMap.values());
}

export async function sendMessage(messageData: {
    senderId: string;
    receiverId: string;
    content: string;
}): Promise<Message> {
    const db = await openDB();
    const id = uuidv4();
    const sentAt = new Date().toISOString();
    
    await db.run(
        `INSERT INTO message (id, senderId, receiverId, content, sentAt) 
         VALUES (?, ?, ?, ?, ?)`,
        [id, messageData.senderId, messageData.receiverId, messageData.content, sentAt]
    );
    
    return {
        id,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        sentAt,
        readAt: null
    };
}


export async function markMsgAsRead(msgId: string): Promise<Message | null> {
    const db = await openDB();
    const readAt = new Date().toISOString();

    try {
        await db.run(
            `UPDATE message SET readAt = ? WHERE id = ?`,
            [readAt, msgId]
        );
        return getMsgById(msgId);
    } catch (err) {
        console.error(err);
        return null;
    }
}

export async function deleteMessage(msgId: string): Promise<boolean> {
    const db = await openDB();
    try {
        await db.run(`DELETE FROM message WHERE id = ?`, [msgId]);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export default {
    getConvMessages,
    getMsgById,
    getUserConversations,
    sendMessage,
    markMsgAsRead,
    deleteMessage,
};