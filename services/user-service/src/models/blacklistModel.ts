import { openDB } from "../database/db";
import { v4 as uuidv4 } from 'uuid';


export type BlacklistedToken = {
    id: string;
    token: string;
    userId: string;
    expiresAt: string;
    createdAt: string;
};

async function addToBlacklist(
    token: string,
    userId: string,
    expiresAt: Date
): Promise<BlacklistedToken> {
    const db = await openDB();
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const expiresAtISO = expiresAt.toISOString();

    // Create table if it doesn't exist
    await db.run(`
        CREATE TABLE IF NOT EXISTS BlacklistedTokens (
            id TEXT PRIMARY KEY,
            token TEXT NOT NULL UNIQUE,
            userId TEXT NOT NULL,
            expiresAt TEXT NOT NULL,
            createdAt TEXT NOT NULL
        )
    `);

    await db.run(
        `INSERT INTO BlacklistedTokens (id, token, userId, expiresAt, createdAt)
         VALUES (?, ?, ?, ?, ?)`,
        [id, token, userId, expiresAtISO, createdAt]
    );

    await db.close();

    return {
        id,
        token,
        userId,
        expiresAt: expiresAtISO,
        createdAt,
    };
}

async function isTokenBlacklisted(token: string): Promise<boolean> {
    const db = await openDB();
    
    // Create table if it doesn't exist
    await db.run(`
        CREATE TABLE IF NOT EXISTS BlacklistedTokens (
            id TEXT PRIMARY KEY,
            token TEXT NOT NULL UNIQUE,
            userId TEXT NOT NULL,
            expiresAt TEXT NOT NULL,
            createdAt TEXT NOT NULL
        )
    `);

    const result = await db.get(
        `SELECT id FROM BlacklistedTokens WHERE token = ? AND expiresAt > ?`,
        [token, new Date().toISOString()]
    );

    await db.close();
    return !!result;
}

async function cleanupExpiredTokens(): Promise<void> {
    const db = await openDB();
    
    // Create table if it doesn't exist
    await db.run(`
        CREATE TABLE IF NOT EXISTS BlacklistedTokens (
            id TEXT PRIMARY KEY,
            token TEXT NOT NULL UNIQUE,
            userId TEXT NOT NULL,
            expiresAt TEXT NOT NULL,
            createdAt TEXT NOT NULL
        )
    `);

    await db.run(
        `DELETE FROM BlacklistedTokens WHERE expiresAt <= ?`,
        [new Date().toISOString()]
    );

    await db.close();
}

export default {
    addToBlacklist,
    isTokenBlacklisted,
    cleanupExpiredTokens,
};