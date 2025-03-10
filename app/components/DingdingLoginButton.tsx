'use client';
import { Button } from 'antd';
import DingdingLogo from '@/app/images/loginProvider/dingding.svg'
import { signIn } from "next-auth/react";

export default function DingdingLoginButton(props: { callbackUrl?: string, text?: string }) {
  const handleLogin = async () => {
    await signIn("dingding", { callbackUrl: props.callbackUrl ? props.callbackUrl : "/" });
  };

  return (
    <Button
      onClick={handleLogin}
      className='w-full'
      size='large'
      icon={<DingdingLogo className="w-4 h-4" />}
    >{props.text ? props.text : '使用钉钉登录'}</Button>
  );
}