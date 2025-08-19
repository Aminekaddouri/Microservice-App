import jwt, {Secret, SignOptions} from 'jsonwebtoken';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';

const DB_PATH = '/app/data/auth.sqlite';


export function generateJWT(userId: string, expiresIn: string): string {
    const JWT_SECRET = process.env.JWT_SECRET as Secret;
    if (!JWT_SECRET)
        throw new Error('JWT_SECRET is not defined');
    const token = jwt.sign(
        { id: userId },
        JWT_SECRET,
        { expiresIn: expiresIn as SignOptions['expiresIn']}
    );
    return token;
}

export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export async function openDB() {
    return open({
        filename: DB_PATH,
        driver: sqlite3.Database,
    });
}