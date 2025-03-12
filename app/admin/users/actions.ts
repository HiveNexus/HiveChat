'use server';
import { users, llmSettingsTable, userLlmSettings } from '@/app/db/schema';
import { db } from '@/app/db';
import { desc, eq } from 'drizzle-orm';
import { auth } from "@/auth";
import bcrypt from "bcryptjs";

export async function getUserList() {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const result = await db.query.users.findMany({
      orderBy: [desc(users.createdAt)],
    });
    return result;
  } catch (error) {
    throw new Error('query user list fail');
  }
}

export async function addUser(userBasicInfo: { email: string, password: string, isAdmin: boolean, llmProviders?: string[] }) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, userBasicInfo.email),
    });

    if (existingUser) {
      return {
        success: false,
        message: '邮箱已被注册',
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userBasicInfo.password, salt);

    const result = await db.insert(users).values({
      email: userBasicInfo.email,
      password: hashedPassword,
      isAdmin: userBasicInfo.isAdmin,
    })
      .returning()
    if (userBasicInfo.llmProviders) {
      for (const provider of userBasicInfo.llmProviders) {
        await db.insert(userLlmSettings)
          .values({
            userId: result[0].id,
            llmProvider: provider,
          })
      }
    }
    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      message: 'database add error'
    }
  }
}

export async function deleteUser(email: string) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    await db.delete(users).where(eq(users.email, email));
    return {
      success: true,
      message: '未找到对应邮箱的用户'
    }
  } catch (error) {
    return {
      success: false,
      message: 'database delete error'
    }
  }
}

export async function updateUser(email: string, userBasicInfo: { email: string, password?: string, isAdmin: boolean, llmProviders?: string[] }) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!existingUser) {
      return {
        success: false,
        message: '该用户不存在',
      };
    }
    let updateResult = null;
    if (userBasicInfo.password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userBasicInfo.password, salt);
      // 更新用户信息
      updateResult = await db.update(users)
        .set({
          email: userBasicInfo.email,
          password: hashedPassword,
          isAdmin: userBasicInfo.isAdmin,
        })
        .where(eq(users.email, email));
    } else {
      updateResult = await db.update(users)
        .set({
          email: userBasicInfo.email,
          isAdmin: userBasicInfo.isAdmin,
        })
        .where(eq(users.email, email));
    }
    if (userBasicInfo.llmProviders) {
      await db.delete(userLlmSettings).where(eq(userLlmSettings.userId, existingUser.id));
      for (const provider of userBasicInfo.llmProviders) {
        await db.insert(userLlmSettings)
          .values({
            userId: existingUser.id,
            llmProvider: provider,
          })
      }
    }
    return {
      success: true,
      message: '用户信息已更新',
    };
  } catch (error) {
    return {
      success: false,
      message: 'database update error'
    }
  }
}

export async function getLlmSettings() {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    return await db.select().from(llmSettingsTable)
      .where(eq(llmSettingsTable.isActive, true))
  } catch (error) {
    throw new Error('Failed to fetch LLM settings');
  }
}

export async function getUserLlmSettings(email: string) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });
    if (!user) {
      return [];
    }
    const result = await db
      .select({ llmProvider: userLlmSettings.llmProvider })
      .from(userLlmSettings)
      .where(eq(userLlmSettings.userId, user.id));
    return result.map(r => r.llmProvider)
  } catch (error) {
    throw new Error('Failed to fetch user LLM settings');

  }
}