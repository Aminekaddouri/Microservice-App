import sqlite3 from 'sqlite3';
import { openDB } from '../tools/tools';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();


sqlite3.verbose();

export type Verification = {
    id: string;
    userId: string;
    token: string;
    type?: string;
    createdAt: string;
    expiresAt: string;
    verifiedAt: string | null;
};

async function createVerification(
    userId: string,
    token: string,
): Promise<Verification> {
    await deleteExpiredVerifications();
    const db = await openDB();
    const id = uuidv4();
    const createdAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + (10 * 60 * 1000)).toISOString();
    const hashedToken = await bcrypt.hash(token, 10);

    await db.run(
        `INSERT INTO Verification (id, userId, token, createdAt, expiresAt)
         VALUES (?, ?, ?, ?, ?)`,
        [id, userId, hashedToken, createdAt, expiresAt]
    );

    return {
        id,
        userId,
        token,
        createdAt,
        expiresAt,
        verifiedAt: null,
    };
}

async function findVerificationByUserId(
    userId: string,
): Promise<Verification | null> {
    await deleteExpiredVerifications();
    const db = await openDB();

    if (!userId) return null;
    const verification =  await db.get<Verification>(
        `SELECT * FROM verification WHERE userId = ?`,
        [userId],
    );
    return verification || null;
}

async function deleteVerification(id: string): Promise<boolean> {
    const db = await openDB();
    try {
        await db.run(`DELETE FROM Verification WHERE userId = ?`, [id]);
        return true;
    } catch (error) {
        return false;
    }
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
    name: 'gmail-smtp-forwarder'
});


async function sendVerificationEmail(to: string, link: string): Promise<boolean> {
    try {
        await transporter.sendMail({
            from: `"Ft_Trancedance" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Verify Your Email',
            html: `
        <h3>Confirm your email</h3>
        <p>Please click the link below to verify your email:</p>
        <p><a href="${link}">Verify My Email</a></p>
        <p>This link will expire in 10 minutes.</p>
      `,
        });
        return true;
    } catch (error) {
        console.log('email error: ', error);
        return false;
    }
}

async function deleteExpiredVerifications() {
  const db = await openDB();
  await db.run(
    `DELETE FROM Verification WHERE expiresAt <= ? AND verifiedAt IS NOT NULL;`,
    [new Date().toISOString()]
  );
}

async function setVerificationDate(userId: string): Promise<boolean> {
    const db = await openDB();

    try {
        const result = await db.run(`UPDATE Verification SET verifiedAt = ? WHERE userId = ?;`,
            [new Date().toISOString(), userId],
        );
        return true;
    } catch (error) {
        console.error('Failed to set verification date:', error);
        return false;
    }
}

export default {
    createVerification,
    deleteVerification,
    sendVerificationEmail,
    deleteExpiredVerifications,
    findVerificationByUserId,
    setVerificationDate,
};