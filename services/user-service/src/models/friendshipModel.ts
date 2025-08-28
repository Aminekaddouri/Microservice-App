import { openDB } from "../database/db";
import { FriendshipStatus } from "../types/FriendshipStatus";
import { v4 as uuidv4 } from "uuid";

export type Friendship = {
  id: string;
  user1ID: string;
  user2ID: string;
  status: FriendshipStatus;
  createdAt: string;
};

function normalizePair(userA: string, userB: string): [string, string] {
  return userA < userB ? [userA, userB] : [userB, userA];
}

async function createFriendRequest(
  userA: string,
  userB: string
): Promise<Friendship> {
  const db = await openDB();
  const [user1ID, user2ID] = normalizePair(userA, userB);
  const id = uuidv4();

  await db.run(
    `INSERT INTO Friendship (id, user1ID, user2ID, status) VALUES (?, ?, ?, ?)`,
    [id, user1ID, user2ID, FriendshipStatus.Pending]
  );

  return {
    id,
    user1ID,
    user2ID,
    status: FriendshipStatus.Pending,
    createdAt: new Date().toISOString(),
  };
}

async function changeFriendshipStatus(
  userA: string,
  userB: string,
  status: string
): Promise<void> {
  const db = await openDB();
  const [user1ID, user2ID] = normalizePair(userA, userB);

  await db.run(
    `UPDATE Friendship SET status = ? WHERE user1ID = ? AND user2ID = ?`,
    [status, user1ID, user2ID]
  );
}

async function deleteFriendship(userA: string, userB: string): Promise<void> {
  const db = await openDB();
  const [user1ID, user2ID] = normalizePair(userA, userB);

  await db.run(`DELETE FROM Friendship WHERE user1ID = ? AND user2ID = ?`, [
    user1ID,
    user2ID,
  ]);
}

async function getFriendship(
  userA: string,
  userB: string
): Promise<Friendship | null> {
  const db = await openDB();
  const [user1ID, user2ID] = normalizePair(userA, userB);
  const firendship = await db.get<Friendship>(
    `SELECT * FROM Friendship WHERE user1ID = ? AND user2ID = ?`,
    [user1ID, user2ID]
  );
  return firendship || null;
}

async function getUserFriends(
  userId: string,
  status: FriendshipStatus
): Promise<Friendship[]> {
  const db = await openDB();
  console.log("status: ", status);
  return await db.all<Friendship[]>(
    `SELECT * FROM Friendship 
      WHERE (user1ID = ? OR user2ID = ?) AND status = ?`,
    [userId, userId, status]
  );
}

async function acceptFriendRequestById(friendshipId: string, userId: string) {
  try {
    const db = await openDB();
    console.log(
      "Accepting friend request by ID:",
      friendshipId,
      "for user:",
      userId
    );

    // First, check if the friendship exists at all (regardless of status)
    const anyFriendship = await db.get<Friendship>(
      `SELECT * FROM Friendship WHERE id = ?`,
      [friendshipId]
    );

    console.log("Found friendship record:", anyFriendship);

    if (!anyFriendship) {
      throw new Error(
        `Friendship with ID ${friendshipId} does not exist in database`
      );
    }

    // Check the current status
    if (anyFriendship.status !== FriendshipStatus.Pending) {
      throw new Error(
        `Friend request is in status '${anyFriendship.status}', expected 'Pending'. Cannot accept.`
      );
    }

    // Now get the pending friendship record
    const friendship = await db.get<Friendship>(
      `SELECT * FROM Friendship WHERE id = ? AND status = ?`,
      [friendshipId, FriendshipStatus.Pending]
    );

    if (!friendship) {
      throw new Error("Friend request not found or already processed");
    }

    // Check if the user has permission (either user1ID or user2ID)
    if (friendship.user1ID !== userId && friendship.user2ID !== userId) {
      throw new Error(
        "You do not have permission to accept this friend request"
      );
    }

    // Update the friendship status to accepted
    await db.run(`UPDATE Friendship SET status = ? WHERE id = ?`, [
      FriendshipStatus.Accepted,
      friendshipId,
    ]);

    // Get the updated friendship
    const updatedFriendship = await db.get<Friendship>(
      `SELECT * FROM Friendship WHERE id = ?`,
      [friendshipId]
    );

    return updatedFriendship;
  } catch (error) {
    console.error("Error accepting friend request by ID:", error);
    throw error;
  }
}

/**
 * Rejects/deletes a friend request by friendship ID using SQLite
 */
async function deleteFriendshipById(friendshipId: string, userId: string) {
  try {
    const db = await openDB();

    // First, get the friendship record to verify it exists and user has permission
    const friendship = await db.get<Friendship>(
      `SELECT * FROM Friendship WHERE id = ? AND status = ?`,
      [friendshipId, FriendshipStatus.Pending]
    );

    if (!friendship) {
      throw new Error("Friend request not found or already processed");
    }

    // Check if the user has permission (either user1ID or user2ID)
    if (friendship.user1ID !== userId && friendship.user2ID !== userId) {
      throw new Error(
        "You do not have permission to delete this friend request"
      );
    }

    // Delete the friendship record
    await db.run(`DELETE FROM Friendship WHERE id = ?`, [friendshipId]);

    return friendship;
  } catch (error) {
    console.error("Error deleting friendship by ID:", error);
    throw error;
  }
}

async function getFriendshipById(
  friendshipId: string
): Promise<Friendship | null> {
  try {
    const db = await openDB();
    const friendship = await db.get<Friendship>(
      `SELECT * FROM Friendship WHERE id = ?`,
      [friendshipId]
    );
    return friendship || null;
  } catch (error) {
    console.error("Error getting friendship by ID:", error);
    throw error;
  }
}

/**
 * Debug function to get all friendships for a user - helps with debugging
 */
async function getAllFriendshipsForUser(userId: string): Promise<Friendship[]> {
  try {
    const db = await openDB();
    const friendships = await db.all<Friendship[]>(
      `SELECT * FROM Friendship WHERE user1ID = ? OR user2ID = ?`,
      [userId, userId]
    );
    console.log(`Debug: All friendships for user ${userId}:`, friendships);
    return friendships;
  } catch (error) {
    console.error("Error getting all friendships for user:", error);
    throw error;
  }
}

/**
 * Debug function to get all pending friend requests
 */
async function getAllPendingRequests(): Promise<Friendship[]> {
  try {
    const db = await openDB();
    const requests = await db.all<Friendship[]>(
      `SELECT * FROM Friendship WHERE status = ?`,
      [FriendshipStatus.Pending]
    );
    console.log("Debug: All pending friend requests:", requests);
    return requests;
  } catch (error) {
    console.error("Error getting all pending requests:", error);
    throw error;
  }
}

export default {
  createFriendRequest,
  changeFriendshipStatus,
  deleteFriendship,
  getFriendship,
  getUserFriends,
  acceptFriendRequestById,
  deleteFriendshipById,
  getFriendshipById,
  getAllFriendshipsForUser,
  getAllPendingRequests,
};
