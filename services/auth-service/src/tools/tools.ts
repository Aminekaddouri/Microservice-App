import jwt, {Secret, SignOptions} from 'jsonwebtoken';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import crypto from 'crypto';

const DB_PATH = '/app/data/auth.sqlite';


export function validateJWTEnvironment(): void {
    const requiredEnvVars = {
        JWT_SECRET: process.env.JWT_SECRET,
        ACCESS_TOKEN_EXP: process.env.ACCESS_TOKEN_EXP,
        REFRESH_TOKEN_EXP: process.env.REFRESH_TOKEN_EXP
    };

    const missingVars = Object.entries(requiredEnvVars)
        .filter(([_, value]) => !value)
        .map(([key, _]) => key);

    if (missingVars.length > 0) {
        throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    // Validate JWT_SECRET strength
    const jwtSecret = process.env.JWT_SECRET!;
    if (jwtSecret.length < 32) {
        throw new Error('JWT_SECRET must be at least 32 characters long for security');
    }

    // Validate token expiration formats
    const timeRegex = /^\d+[smhd]$/;
    if (!timeRegex.test(process.env.ACCESS_TOKEN_EXP!)) {
        throw new Error('ACCESS_TOKEN_EXP must be in format like "15m", "1h", "7d"');
    }
    if (!timeRegex.test(process.env.REFRESH_TOKEN_EXP!)) {
        throw new Error('REFRESH_TOKEN_EXP must be in format like "15m", "1h", "7d"');
    }
}

export function generateJWT(userId: string, expiresIn: string): string {
    validateJWTEnvironment();
    
    const JWT_SECRET = process.env.JWT_SECRET as Secret;
    const token = jwt.sign(
        { id: userId },
        JWT_SECRET,
        { 
            expiresIn: expiresIn as SignOptions['expiresIn'],
            issuer: 'your-app-name',
            audience: 'your-app-users'
        }
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