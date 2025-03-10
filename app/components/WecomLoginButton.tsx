'use client';
import { Button } from 'antd';
import WecomLogo from '@/app/images/loginProvider/wecom.svg'
import { signIn } from "next-auth/react";

export default function WecomLoginButton(props: { callbackUrl?: string, text?: string }) {
  const handleLogin = async () => {
    await signIn("wecom", { callbackUrl: props.callbackUrl ? props.callbackUrl : "/" });
  };

  return (
    <Button
      onClick={handleLogin}
      className='w-full'
      size='large'
      icon={<WecomLogo className="w-4 h-4" />}
    >{props.text ? props.text : '使用企业微信登录'}</Button>
  );
}