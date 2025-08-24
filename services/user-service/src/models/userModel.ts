import { openDB } from '../database/db';

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

export async function findAllUsers(): Promise<User[]> {
  const db = await openDB();
  return await db.all<User[]>(`SELECT * FROM User`);
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await openDB();
  const user = await db.get<User>('SELECT * FROM User WHERE id = ?', [id]);
  return user || null;
}

export async function updateUserById(
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

export async function deleteUserById(id: string): Promise<boolean> {
  const db = await openDB();
  try {
    await db.run(`DELETE FROM User WHERE id = ?`, [id]);
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

export default {
  findAllUsers,
  findUserById,
  updateUserById,
  deleteUserById,
};