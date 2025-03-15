import { db } from "../db";

export const withTransaction = async (operations: Promise<any>[]) => {
    try {
      await db.transaction(async (tx) => {
        await Promise.all(operations);
      });
      return { success: true };
    } catch (error) {
      return { success: false, message: `Transaction failed: ${error}` };
    }
  };
  