'use client';
import { Button } from 'antd';
import FeishuLogo from '@/app/images/loginProvider/feishu.svg'
import { signIn } from "next-auth/react";

export default function FeishuLoginButton(props: { callbackUrl?: string, text?: string }) {
  const handleLogin = async () => {
    await signIn("feishu", { callbackUrl: props.callbackUrl ? props.callbackUrl : "/" });
  };

  return (
    <Button
      onClick={handleLogin}
      className='w-full'
      size='large'
      icon={<FeishuLogo className="w-4 h-4" />}
    >{props.text ? props.text : '使用飞书登录'}</Button>
  );
}