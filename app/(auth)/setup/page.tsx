"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from 'next/link';
import { adminSetup, adminSetupLogined, getActiveAuthProvides } from '../actions';
import { fetchAppSettings, } from '@/app/admin/system/actions';
import { Form, Input, Button, Alert } from 'antd';
import logo from "@/app/images/logo.png";
import FeishuLogin from "@/app/components/FeishuLoginButton"
import WecomLogin from "@/app/components/WecomLoginButton"
import DingdingLogin from "@/app/components/DingdingLoginButton"
import Hivechat from "@/app/images/hivechat.svg";
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

interface SetupFormValues {
  email: string;
  password: string;
  repeatPassword: string;
  adminCode: string;
}
interface LoginedSetupFormValues {
  adminCode: string;
}

export default function SetupPage() {
  const t = useTranslations('Auth');
  const { data: session } = useSession();
  const [form] = Form.useForm<SetupFormValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSetup, setHasSetup] = useState(true);
  const [authProviders, setAuthProviders] = useState<string[]>([]);

  useEffect(() => {
    const fetchSettings = async () => {
      const resultValue = await fetchAppSettings('hasSetup');
      const activeAuthProvides = await getActiveAuthProvides();
      setAuthProviders(activeAuthProvides)
      if (resultValue === 'true') {
        setHasSetup(true);
        window.location.href = "/chat";
      } else {
        setHasSetup(false);
      }
    }
    fetchSettings();
  }, []);

  async function handleLoginedSubmit(values: LoginedSetupFormValues) {
    setLoading(true);
    try {
      const result = await adminSetupLogined(values.adminCode);
      if (result?.status === 'success') {
        
        signIn('feishu');
      } else {
        setError(result?.message || t('registerFail'));
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || t('registerFail'));
      setLoading(false);
    }
  }

  async function handleSubmit(values: SetupFormValues) {
    setLoading(true);
    if (values.password.length < 8 || values.repeatPassword.length < 8) {
      setError(t('passwordLengthLimit'));
      setLoading(false);
      return;
    }
    if (values.password !== values.repeatPassword) {
      setError(t('passwordNotSame'));
      setLoading(false);
      return;
    }
    try {
      const result = await adminSetup(values.email, values.password, values.adminCode);
      if (result?.status === 'success') {
        window.location.href = "/chat";
      } else {
        setError(result?.message || t('registerFail'));
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || t('registerFail'));
      setLoading(false);
    }
  }

  if (hasSetup) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50">
      <div className="flex items-center flex-row my-6">
        <Link href="/" className='flex items-center'>
          <Image src={logo} className="ml-1" alt="HiveChat logo" width={32} height={32} />
          <Hivechat className="ml-1" alt="HiveChat text" width={156} height={39} />
        </Link>
      </div>
      <div className="w-full max-w-sm rounded-lg bg-white p-6 mb-6 shadow-xl">
        <h2 className="text-center text-2xl">{t('setupAdminAccount')}</h2>
        {session?.user && <>
          <div className="font-medium mt-4">当前登录账号</div>
          <div className="bg-gray-100 rounded-md p-4 my-4">
            <div>
              <span className="mr-3 font-medium">昵称:</span>
              {session?.user.name ? session?.user.name : '-'}
            </div>
            <div className="mt-2">
              <span className="mr-3 font-medium">邮箱:</span>
              {session?.user.email ? session?.user.email : '-'}
            </div>
          </div>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleLoginedSubmit}
            requiredMark='optional'
          >
            <Form.Item
              name="adminCode"
              label={<span className="font-medium">Admin Code</span>}
              rules={[{ required: true, message: t('adminCodeRequired') }]}
            >
              <Input.Password size="large" />
            </Form.Item>
            <div className="text-sm text-gray-400 -mt-2 mb-2">{t('adminCodeNotice')}</div>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                {t('setupAdminAccount')}
              </Button>
            </Form.Item>
          </Form>
        </>}
        {error && <Alert message={error} type="error" />}
        {authProviders.includes('email') && !session &&
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark='optional'
          >
            <div className="text-sm text-gray-400 my-2">{t('setupNotice')}</div>
            <Form.Item
              name="email"
              label={<span className="font-medium">Email</span>}
              rules={[{ required: true, message: t('emailNotice') }]}
            >
              <Input size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              label={<span className="font-medium">{t('password')}</span>}
              rules={[{ required: true, message: t('passwordNotice') }]}
            >
              <Input.Password size="large" />
            </Form.Item>
            <Form.Item
              name="repeatPassword"
              label={<span className="font-medium">{t('repeatPassword')}</span>}
              rules={[{ required: true, message: t('passwordNotice') }]}
            >
              <Input.Password size="large" />
            </Form.Item>

            <Form.Item
              name="adminCode"
              label={<span className="font-medium">Admin Code</span>}
              rules={[{ required: true, message: t('adminCodeRequired') }]}
            >
              <Input.Password size="large" />
            </Form.Item>
            <div className="text-sm text-gray-400 -mt-2 mb-2">{t('adminCodeNotice')}</div>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
              >
                {t('setupAdminAccount')}
              </Button>
            </Form.Item>
          </Form>
        }
        {
          authProviders.includes('email') && authProviders.length > 1 && !session &&
          <div className="w-full text-center text-gray-500 text-sm">或</div>
        }
        {
          authProviders.includes('wecom') && !session && <div className='my-2'><WecomLogin text="使用企业微信登录后设置" callbackUrl="/setup" /></div>
        }
        {
          authProviders.includes('feishu') && !session && <div className='my-2'><FeishuLogin text="使用飞书登录后设置" callbackUrl="/setup" /></div>
        }
        {
          authProviders.includes('dingding') && !session && <div className='my-2'><DingdingLogin text="使用钉钉登录后设置" callbackUrl="/setup" /></div>
        }
      </div>
    </div >
  );
}