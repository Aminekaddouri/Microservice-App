import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';
import { openDB } from '../tools/tools';

sqlite3.verbose();

export type User = {
    id: string;
    fullName: string;
    nickName: string;
    email: string;
    picture: string;
    password: string | null;
    verified?: boolean;
    joinedAt?: string;
};

async function registerUser(user: Omit<User, 'id'  | 'joinedAt'>): Promise<User> {
    const db = await openDB();
    let hashedPassword = null;
    if (user.password)
        hashedPassword = await bcrypt.hash(user.password, 10);
    const id = uuidv4();
    const joinedAt = new Date().toISOString();

    await db.run(
        `INSERT INTO user (id, fullName, nickName, email, picture, password, verified, joinedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            user.fullName,
            user.nickName,
            user.email,
            user.picture,
            hashedPassword,
            user.verified || false,
            joinedAt
        ]
    );

    return {
        id,
        ...user,
        password: hashedPassword,
        joinedAt,
    };
}

async function loginUser(email: string, password: string): Promise<User | null> {
    const db = await openDB();
    const user = await db.get<User>(
        `SELECT * FROM user WHERE email = ?`,
        [email]
    );
    if (!user) return null;
    if (!user.password)
        return null;
    const isMatch = await bcrypt.compare(password, user.password!);
    return isMatch ? user : null;
}

async function findAllUsers(): Promise<User[]> {
    const db = await openDB();
    return await db.all<User[]>(`SELECT * FROM user`);
}

async function findUserById(id: string): Promise<User | null> {
    const db = await openDB();
    if (!id) return null;
    const user = await db.get<User>(`SELECT * FROM user WHERE id = ?`, [id]);
    return user || null;
}

async function findUserByEmail(email: string): Promise<User | null> {
    const db = await openDB();
    const user = await db.get<User>(`SELECT * FROM user WHERE email = ?`, [email]);
    return user || null;
}

async function updateUserById(
    id: string,
    data: Partial<Omit<User, 'id' | 'verified' | 'joinedAt'>>
): Promise<User | null> {
    const db = await openDB();

    const fields = Object.keys(data)
        .filter((key) => key !== 'id' && key !== 'verified' && key !== 'joinedAt')
        .map((key) => `${key} = ?`)
        .join(', ');

    const values = Object.values(data);

    if (!fields) return null;

    try {
        await db.run(
            `UPDATE user SET ${fields} WHERE id = ?`,
            [...values, id]
        );

        return await findUserById(id);
    } catch (err) {
        console.error(err);
        return null;
    }
}

async function deleteUserById(id: string): Promise<boolean> {
    const db = await openDB();
    try {
        await db.run(`DELETE FROM user WHERE id = ?`, [id]);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

async function markUserAsVerified(id: string): Promise<boolean> {
    const db = await openDB();

    try {
        await db.run(`UPDATE USER SET verified = ? WHERE id = ? AND verified = ?;`,
            [1, id, 0],
        );
        return true;
    } catch (error) {
        console.error('Failed to mark user as verified:', error);
        return false;
    }
}

export default {
    registerUser,
    loginUser,
    findAllUsers,
    findUserById,
    findUserByEmail,
    updateUserById,
    deleteUserById,
    markUserAsVerified,
};