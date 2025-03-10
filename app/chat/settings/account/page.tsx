'use client'
import React, { useState, useEffect } from 'react';
import { updatePassword } from '../actions';
import { Button, Modal, Form, Input, Select, message } from 'antd';
import { TranslationOutlined } from '@ant-design/icons';
import { useSession, signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';

type FormValues = {
  oldPassword: string;
  password: string;
  repeatPassword: string;
}

const AccountPage = () => {
  const t = useTranslations('Settings');
  const [currentLang, setCurrentLang] = useState('zh');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    // 从 cookie 中获取语言设置
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return undefined;
    };

    // 获取浏览器语言
    const getBrowserLanguage = () => {
      const lang = navigator.language.toLowerCase();
      if (lang.startsWith('zh')) return 'zh';
      return 'en'; // 默认返回英文
    };

    // 设置当前语言
    const savedLang = getCookie('language');
    if (savedLang && ['zh', 'en'].includes(savedLang)) {
      setCurrentLang(savedLang);
    } else {
      const browserLang = getBrowserLanguage();
      setCurrentLang(browserLang);
      document.cookie = `language=${browserLang}; path=/`;
    }
  }, []);

  const handleOk = () => {
    form.submit();
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    const result = await updatePassword(session?.user.email || 'x', values.oldPassword, values.password);
    if (result.success) {
      message.success('更新成功');
      form.resetFields();
      setIsModalOpen(false);
    } else {
      message.error(result.message)
    }
    setLoading(false);
  };

  return (
    <div>
      <div className='flex flex-row justify-between mt-6 p-6 border border-gray-200 rounded-md'>
        {session?.user.name ?
          <div className='flex items-center'>
            <span className='text-sm font-medium'>昵称:</span>
            <span className='text-sm ml-2'>{session.user.name}</span>
          </div>
          :
          <div className='flex items-center'>
            <span className='text-sm font-medium'>Email:</span>
            <span className='text-sm ml-2'>{session?.user.email}</span>
          </div>
        }
        <div className='flex items-center'>
          <Button type='link' onClick={() => {
            setIsModalOpen(true);
          }}>{t('changePassword')}</Button>
          <Button className='ml-2' onClick={() => {
            signOut({
              redirect: true,
              redirectTo: '/chat'
            });
          }}>{t('logout')}</Button>
        </div>
      </div>

      <div className='flex flex-row justify-between mt-6 p-6 border border-gray-200 rounded-md'>
        <div className='flex items-center'>
          <span className='text-sm font-medium'>{t('language')}</span>
        </div>
        <div className='flex items-center'>
          <Select
            prefix={<TranslationOutlined style={{ 'color': '#666' }} />}
            value={currentLang}
            onChange={(value) => {
              document.cookie = `language=${value}; path=/`;
              window.location.reload();
            }}
            options={[
              { value: 'zh', label: '简体中文' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>
      </div>

      <Modal
        title={t('changePassword')}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
        width={400}
        confirmLoading={loading}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          validateTrigger='onBlur'
        >
          <Form.Item label={<span className='font-medium'>{t('oldPassword')}</span>} name='oldPassword'
            rules={[{ required: true, message: t('inputPassword') }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label={<span className='font-medium'>{t('newPassword')}</span>} name='password'
            rules={[{ required: true, message: t('inputPassword') }, {
              min: 8,
              message: t('lengthLimit')
            }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label={<span className='font-medium'>{t('repeatNewPassword')}</span>} name='repeatPassword'
            rules={[{ required: true, message: t('inputPassword') }, {
              min: 8,
              message: t('lengthLimit')
            }]}>
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AccountPage