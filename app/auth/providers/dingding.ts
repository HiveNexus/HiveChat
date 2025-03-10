import { db } from '@/app/db';
import { eq } from 'drizzle-orm';
import { users } from '@/app/db/schema';
import { OAuthConfig } from "next-auth/providers";

export interface DingdingProfile {
  unionId: string;
  nick?: string;
  email?: string;
  avatarUrl?: string;
}


export default function Dingding(options: {
  clientId: string;
  clientSecret: string;
}): OAuthConfig<DingdingProfile> {
  const apiUserUrl = 'https://api.dingtalk.com/v1.0/contact/users/me';
  const apiAuthUrl = 'https://login.dingtalk.com/oauth2/auth';
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return {
    id: "dingding",
    name: "dingding",
    type: "oauth",
    checks: ["pkce"],
    authorization: {
      url: apiAuthUrl,
      params: {
        client_id: options.clientId,
        response_type: 'code',
        scope: 'openid',
        prompt: 'consent',
        redirect_uri: encodeURI(`${baseUrl}/api/auth/callback/dingding`),
      }
    },
    token: {
      url: `${process.env.NEXTAUTH_URL}/api/dingdingProxy?clientId=${options.clientId}&clientSecret=${options.clientSecret}`,
    },

    userinfo: {
      url: apiUserUrl,
      async request({ tokens, provider }: any) {
        const request = await fetch(provider.userinfo?.url as URL, {
          headers: {
            'x-acs-dingtalk-access-token': tokens.access_token,
          },
        });
        const userData = await request.json();
        const existingUser = await db
          .query
          .users
          .findFirst({
            where: eq(users.dingdingUnionId, userData.unionId)
          });
        if (existingUser) {
          await db.update(users).set({
            name: userData.nick,
            email: userData.email || `${userData.unionId}@dingtalk.com`,
            image: userData.avatarUrl || null,
          }).where(eq(users.dingdingUnionId, userData.unionId));
        } else {
          await db.insert(users).values({
            name: userData.nick,
            email: userData.email || `${userData.unionId}@dingtalk.com`,
            image: userData.avatarUrl || null,
            dingdingUnionId: userData.unionId,
          });
        }
        return userData;
      },
    },
    profile(profile: DingdingProfile) {
      return {
        id: profile.unionId,
        unionId: profile.unionId,
        name: profile.nick,
        email: profile.email,
        image: profile.avatarUrl,
      };
    },
    clientId: options.clientId,
    clientSecret: options.clientSecret,
  };
}