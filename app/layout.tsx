import React from 'react';
import type { Metadata } from "next";
import type { Viewport } from 'next'
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { SessionProvider } from 'next-auth/react';
import AppPrepare from "@/app/components/AppPrepare";
import "./globals.css";


export const metadata: Metadata = {
  title: "Hivechat - Chat With All AI",
  description: "同时和多个机器人聊天，最快获取最佳结果",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            <AntdRegistry>
            <AppPrepare />
              {children}
            </AntdRegistry>
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
