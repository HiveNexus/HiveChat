'use server';
import bcrypt from "bcryptjs";
import { eq } from 'drizzle-orm';
import { users } from '@/app/db/schema';
import { db } from '@/app/db';
import { signIn } from '@/auth';
import { fetchAppSettings, setAppSettings } from "@/app/admin/system/actions";
import { auth } from '@/auth';

export async function register(email: string, password: string) {
  const resultValue = await fetchAppSettings('isRegistrationOpen');
  if (resultValue !== 'true') {
    return {
      status: 'fail',
      message: '未开放注册',
    };
  }
  try {
    const user = await db.query.users
      .findFirst({
        where: eq(users.email, email)
      })
    if (user) {
      return {
        status: 'fail',
        message: '该邮箱已被注册',
      };
    }
    // 生成盐值 (salt)，指定盐值的回合次数（通常是 10）
    const salt = await bcrypt.genSalt(10);

    // 使用盐值对密码进行哈希处理
    const hashedPassword = await bcrypt.hash(password, salt);

    // 将新用户数据插入数据库
    const result = await db.insert(users).values({
      email,
      password: hashedPassword,
    });
    // 注册成功后，自动登录
    const signInResponse = await signIn("credentials", {
      redirect: false, // 不跳转页面
      email,
      password,
    });
    // 返回成功消息或其他所需数据
    return {
      status: 'success',
    }
  } catch (error) {
    console.log(error)
    throw new Error('用户注册失败，请稍后再试');
  }
}

export async function adminSetup(email: string, password: string, adminCode: string) {
  try {
    const user = await db.query.users
      .findFirst({
        where: eq(users.email, email)
      })
    if (user) {
      return {
        status: 'fail',
        message: '该邮箱已被注册',
      };
    }
    const envAdminCode = process.env.ADMIN_CODE;
    if (envAdminCode !== adminCode) {
      return {
        status: 'fail',
        message: 'Admin Code 错误',
      };
    }
    // 生成盐值 (salt)，指定盐值的回合次数（通常是 10）
    const salt = await bcrypt.genSalt(10);

    // 使用盐值对密码进行哈希处理
    const hashedPassword = await bcrypt.hash(password, salt);

    // 将新用户数据插入数据库
    const result = await db.insert(users).values({
      email,
      password: hashedPassword,
      isAdmin: true,
    });
    // 注册成功后，自动登录
    const signInResponse = await signIn("credentials", {
      redirect: false, // 不跳转页面
      email,
      password,
    });
    await setAppSettings('hasSetup', 'true');
    return {
      status: 'success',
    }
  } catch (error) {
    console.log(error)
    throw new Error('用户注册失败，请稍后再试');
  }
}

export async function adminSetupLogined(adminCode: string) {
  const session = await auth();
  if (!session?.user) {
    return {
      status: 'fail',
      message: '请先登录',
    };
  }
  const envAdminCode = process.env.ADMIN_CODE;
  if (envAdminCode !== adminCode) {
    return {
      status: 'fail',
      message: 'Admin Code 错误',
    };
  }
  await db.update(users).set({
    isAdmin: true,
  })
    .where(eq(users.id, session.user.id));
  // 注册成功后，自动登录
  await setAppSettings('hasSetup', 'true');
  // await signIn("feishu");
  return {
    status: 'success',
  }
}

export async function getActiveAuthProvides() {
  const activeAuthProvides = [];
  // 兼容历史版本，只要没配置 OFF，就默认启用 Email 登录
  if (!process.env.EMAIL_AUTH_STATUS || (process.env.EMAIL_AUTH_STATUS.toLowerCase() !== 'off')) {
    activeAuthProvides.push('email')
  }
  if (process.env.FEISHU_AUTH_STATUS && process.env.FEISHU_AUTH_STATUS.toLowerCase() === 'on') {
    activeAuthProvides.push('feishu')
  }
  if (process.env.WECOM_AUTH_STATUS && process.env.WECOM_AUTH_STATUS.toLowerCase() === 'on') {
    activeAuthProvides.push('wecom')
  }
  if (process.env.DINGDING_AUTH_STATUS && process.env.DINGDING_AUTH_STATUS.toLowerCase() === 'on') {
    activeAuthProvides.push('dingding')
  }
  return activeAuthProvides;
}

export async function getFeishuAuthInfo() {
  const session = await auth();
  if (!session?.user.isAdmin) {
    return {
      isActive: false,
      appId: '',
      appSecret: '',
    }
  }
  return {
    isActive: process.env.FEISHU_AUTH_STATUS?.toLowerCase() === 'on',
    appId: process.env.FEISHU_CLIENT_ID || '',
    appSecret: process.env.FEISHU_CLIENT_SECRET || '',
  }
}

export async function getWecomAuthInfo() {
  const session = await auth();
  if (!session?.user.isAdmin) {
    return {
      isActive: false,
      appId: '',
      agentId: '',
      appSecret: '',
    }
  }
  return {
    isActive: process.env.WECOM_AUTH_STATUS?.toLowerCase() === 'on',
    appId: process.env.WECOM_CLIENT_ID || '',
    agentId: process.env.WECOM_AGENT_ID || '',
    appSecret: process.env.WECOM_CLIENT_SECRET || '',
  }
}

export async function getDingdingAuthInfo() {
  const session = await auth();
  if (!session?.user.isAdmin) {
    return {
      isActive: false,
      appId: '',
      appSecret: '',
    }
  }
  return {
    isActive: process.env.DINGDING_AUTH_STATUS?.toLowerCase() === 'on',
    appId: process.env.DINGDING_CLIENT_ID || '',
    appSecret: process.env.DINGDING_CLIENT_SECRET || '',
  }
}