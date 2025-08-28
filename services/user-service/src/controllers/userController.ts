import { FastifyRequest, FastifyReply } from "fastify";
import userModel, { User } from "../models/userModel";
import { openDB } from "../database/db"; //************//

async function getAllUsers(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const users = await userModel.findAllUsers();
    if (users.length === 0) {
      reply.status(404).send({
        success: false,
        message: "Users not found!",
      });
      return;
    }

    const safeUsers = users.map(({ password, ...rest }) => rest);
    reply.send({
      success: true,
      users: safeUsers,
    });
  } catch (error) {
    console.error(error);
    reply.status(500).send({
      success: false,
      message: "Failed to fetch users",
    });
  }
}

async function getUserById(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;
    const user = await userModel.findUserById(id);
    if (!user) {
      reply.status(404).send({
        success: false,
        message: "User not found!",
      });
      return;
    }

    const { password, ...safeUser } = user;
    reply.send({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error(error);
    reply.status(500).send({
      success: false,
      message: "Failed to fetch user!",
    });
  }
}

async function updateUser(
  request: FastifyRequest<{
    Params: { id: string };
    Body: Partial<Omit<User, "id" | "joinedAt">>;
  }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const userId = request.params.id;
    const updated = await userModel.updateUserById(userId, request.body);

    if (!updated) {
      reply.status(404).send({ error: "User not found!" });
      return;
    }

    const { password, ...safeUser } = updated;
    reply.status(200).send(safeUser);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: "Failed to update user!" });
  }
}

async function deleteUser(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const userId = request.params.id;
    const deleted = await userModel.deleteUserById(userId);

    if (!deleted) {
      reply.status(404).send({ error: "User not found!" });
      return;
    }

    reply
      .status(203)
      .send({ message: `User with id ${userId} deleted successfully!` });
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: "Failed to delete user!" });
  }
}

//*************//
async function syncUser(
  request: FastifyRequest<{ Body: User }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const user = request.body;
    const existing = await userModel.findUserById(user.id);

    if (existing) {
      // Update existing user
      await userModel.updateUserById(user.id, {
        fullName: user.fullName,
        nickName: user.nickName,
        email: user.email,
        picture: user.picture,
        isGoogleUser: user.isGoogleUser,
        twoFactorEnabled: user.twoFactorEnabled,
        twoFactorSecret: user.twoFactorSecret,
        twoFactorBackupCodes: user.twoFactorBackupCodes,
      });
    } else {
      // Insert new user (without password)
      const db = await openDB();
      await db.run(
        `INSERT INTO User (id, fullName, nickName, email, picture, verified, isGoogleUser, twoFactorEnabled, twoFactorSecret, twoFactorBackupCodes, joinedAt) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id,
          user.fullName,
          user.nickName,
          user.email,
          user.picture,
          user.verified,
          user.isGoogleUser,
          user.twoFactorEnabled,
          user.twoFactorSecret,
          user.twoFactorBackupCodes,
          user.joinedAt,
        ]
      );
    }

    reply.send({ success: true, message: "User synced successfully" });
  } catch (error) {
    console.error("Sync failed:", error);
    reply.status(500).send({ success: false, message: "Failed to sync user" });
  }
}

export default {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  syncUser,
};
