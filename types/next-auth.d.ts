import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      provider: string;
      isAdmin?: boolean;
    }
  }

  interface User {
    id: string;
    name: string;
    email: string;
    isAdmin?: boolean;
  }

  interface JWT {
    id: string;
    name?: string;
    email?: string;
    provider: string;
    isAdmin?: boolean;
  }
}