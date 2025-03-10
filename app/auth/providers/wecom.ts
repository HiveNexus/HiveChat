import { db } from '@/app/db';
import { eq } from 'drizzle-orm';
import { users } from '@/app/db/schema';
import { OAuthConfig } from "next-auth/providers";

export interface WecomProfile {
  userid: string;
  name: string;
  email: string;
}


export default function Wecom(options: {
  clientId: string;
  clientSecret: string;
}): OAuthConfig<WecomProfile> {
  const apiUserUrl = 'https://qyapi.weixin.qq.com/cgi-bin/auth/getuserinfo';
  const apiAuthUrl = 'https://login.work.weixin.qq.com/wwlogin/sso/login';
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return {
    id: "wecom",
    name: "Wecom",
    type: "oauth",
    authorization: {
      url: 'https://login.work.weixin.qq.com/wwlogin/sso/login',
      params: {
        login_type: 'CorpApp',
        appid: options.clientId,
        agentid: process.env.WECOM_AGENT_ID,
        redirect_uri: encodeURI(`${baseUrl}/api/auth/callback/wecom`),
      }
    },
    token: {
      url: `${process.env.NEXTAUTH_URL}/api/wecomProxy?corpid=${options.clientId}&corpsecret=${options.clientSecret}`,
    },
    userinfo: {
      url: apiUserUrl,
      async request({ tokens }: any) {
        // 已经在token步骤获取了用户ID
        const userId = tokens.userId;
        if (!userId) {
          throw new Error("未能获取用户ID");
        }
        const existingUser = await db
          .query
          .users
          .findFirst({
            where: eq(users.wecomUserId, userId)
          });
        if (existingUser) {
          return {
            name: existingUser.name,
            email: existingUser.email,
            userid: userId,
          };
        } else {
          const userInfo = {
            name: userId,
            wecomUserId: userId,
            email: `${userId}@wecom.com`,
          }
          await db.insert(users).values(userInfo);
          return userInfo;
        }
      },
    },

    profile(profile: WecomProfile) {
      return {
        id: profile.userid,
        name: profile.name,
        email: profile.email,
      };
    },
    clientId: options.clientId,
    clientSecret: options.clientSecret,
  };
}