import { db } from '@/app/db';
import { eq } from 'drizzle-orm';
import { users } from '@/app/db/schema';
import { OAuthConfig } from "next-auth/providers";

export interface FeishuProfile {
  sub: string;
  name?: string;
  email?: string;
  avatar?: string;
  user_id: string;
  open_id: string;
  union_id: string;
  en_name?: string;
}


export default function Feishu(options: {
  clientId: string;
  clientSecret: string;
}): OAuthConfig<FeishuProfile> {
  const apiUserUrl = 'https://open.feishu.cn/open-apis/authen/v1/user_info';
  const apiAuthUrl = 'https://open.feishu.cn/open-apis/authen/v1/authorize';
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return {
    id: "feishu",
    name: "Feishu",
    type: "oauth",
    checks: ["pkce"],
    authorization: {
      url: apiAuthUrl,
      params: {
        scope: '',
        app_id: options.clientId,
        redirect_uri: encodeURI(
          `${baseUrl}/api/auth/callback/feishu`
        ),
      },
      endpoint: ''
    },
    token: {
      url: "https://open.feishu.cn/open-apis/authen/v2/oauth/token",
    },

    userinfo: {
      url: apiUserUrl,
      async request({ tokens, provider }: any) {
        // 拿到上一步获取到的token，调用飞书获取用户信息的接口，获取用户信息
        const profile = await fetch(provider.userinfo?.url as URL, {
          headers: {
            Authorization: `Bearer ${tokens.access_token}`,
          },
        }).then(async (res) => await res.json());
        const userData = profile.data;
        const existingUser = await db
          .query
          .users
          .findFirst({
            where: eq(users.feishuUserId, userData.user_id)
          });
        if (existingUser) {
          await db.update(users).set({
            name: userData.name || userData.en_name,
            email: userData.email || `${userData.user_id}@feishu.cn`,
            image: userData.avatar,
            feishuOpenId: userData.open_id,
            feishuUnionId: userData.union_id,
          }).where(eq(users.feishuUserId, userData.user_id));
        } else {
          await db.insert(users).values({
            feishuUserId: userData.user_id,
            name: userData.name || userData.en_name,
            email: userData.email || `${userData.user_id}@feishu.cn`,
            image: userData.avatar,
            feishuOpenId: userData.open_id,
            feishuUnionId: userData.union_id,
          });
        }
        return userData;
      },
    },
    profile(profile: FeishuProfile) {
      return {
        id: profile.user_id,
        open_id: profile.open_id,
        union_id: profile.union_id,
        name: profile.name || profile.en_name,
        email: profile.email,
        image: profile.avatar,
      };
    },
    clientId: options.clientId,
    clientSecret: options.clientSecret,
  };
}