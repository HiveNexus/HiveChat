import NextAuth from "next-auth";
import { ZodError } from "zod";
import Credentials from "next-auth/providers/credentials";
import { signInSchema } from "@/app/lib/zod";
import { verifyPassword } from "@/app/utils/password";
import { db } from '@/app/db';
import { users } from '@/app/db/schema';
import Feishu from "@/app/auth/providers/feishu";
import Wecom from "@/app/auth/providers/wecom";
import Dingding from "@/app/auth/providers/dingding";
import { eq } from 'drizzle-orm';

let authProviders: any[] = [];
if (process.env.FEISHU_AUTH_STATUS === 'ON') {
  const feishuAuth = Feishu({
    clientId: process.env.FEISHU_CLIENT_ID!,
    clientSecret: process.env.FEISHU_CLIENT_SECRET!,
  });
  authProviders.push(feishuAuth);
}
if (process.env.WECOM_AUTH_STATUS === 'ON') {
  const wecomAuth = Wecom({
    clientId: process.env.WECOM_CLIENT_ID!,
    clientSecret: process.env.WECOM_CLIENT_SECRET!,
  });
  authProviders.push(wecomAuth);
}
if (process.env.DINGDING_AUTH_STATUS === 'ON') {
  const dingdingAuth = Dingding({
    clientId: process.env.DINGDING_CLIENT_ID!,
    clientSecret: process.env.DINGDING_CLIENT_SECRET!,
  });
  authProviders.push(dingdingAuth);
}
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    ...authProviders,
    Credentials({
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = await signInSchema.parseAsync(credentials);
          const user = await db.query.users
            .findFirst({
              where: eq(users.email, email)
            })
          if (!user || !user.password) {
            return null;
          }
          const passwordMatch = await verifyPassword(password, user.password);
          if (passwordMatch) {
            return {
              id: user.id,
              name: user.name,
              email: user.email,
              isAdmin: user.isAdmin || false,
            };
          } else {
            return null;
          }
        } catch (error) {
          if (error instanceof ZodError) {
            // 如果验证失败，返回 null 表示凭据无效
            return null;
          }
          // 处理其他错误
          throw error;
        }
      },
    }),

  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin;
      }
      if (account?.provider === "credentials" && token.sub) {
        token.provider = 'credentials';
      }
      if (account?.provider === "feishu" && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.feishuUserId, account.providerAccountId)
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin || false;
        }
        token.provider = 'feishu';
      }
      if (account?.provider === "wecom" && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.wecomUserId, account.providerAccountId)
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin || false;
        }
        token.provider = 'wecom';
      }
      if (account?.provider === "dingding" && token.sub) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.dingdingUnionId, account.providerAccountId)
        });

        if (dbUser) {
          token.id = dbUser.id;
          token.isAdmin = dbUser.isAdmin || false;
        }
        token.provider = 'dingding';
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user, // 保留已有的属性
          id: String(token.id),
          isAdmin: Boolean(token.isAdmin), // 添加 isAdmin
          provider: token.provider as string,
        };
      }
      return session;
    },
  },
})