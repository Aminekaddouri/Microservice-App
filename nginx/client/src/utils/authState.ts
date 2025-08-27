import type { User } from '@/types/user';

let currentUser: User | null = null;

export function setCurrentUser(user: User) {
  currentUser = user;
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch {}
}

export function getCurrentUser(): User | null {
  // Lazily hydrate from localStorage if not set in memory yet
  if (!currentUser) {
    try {
      const stored = localStorage.getItem('user');
      if (stored) currentUser = JSON.parse(stored) as User;
    } catch {}
  }
  return currentUser;
}

export function clearCurrentUser() {
  currentUser = null;
  try {
    localStorage.removeItem('user');
  } catch {}
}