import type { User } from '@/types/user';

let currentUser: User | null = null;

export function setCurrentUser(user: User) {
  currentUser = user;
}

export function getCurrentUser(): User | null {
  return currentUser;
}

export function clearCurrentUser() {
  currentUser = null;
}