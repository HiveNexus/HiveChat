import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Button } from 'antd';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { getDingdingAuthInfo } from '@/app/(auth)/actions';

type settingsModalProps = {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
};

interface FormValues {
  appId: string;
  appSecret: string;
}

const SettingsModal: React.FC<settingsModalProps> = ({
  isModalOpen,
  setIsModalOpen,
}) => {
  const t = useTranslations('Admin.Models');
  const [isActive, setIsActive] = useState(false);
  const [settingForm] = Form.useForm<FormValues>();

  useEffect(() => {
    if (isModalOpen) {
      const fetchSettings = async () => {
        const activeAuthProvides = await getDingdingAuthInfo();
        setIsActive(activeAuthProvides.isActive);
        settingForm.setFieldsValue({
          appId: activeAuthProvides.appId,
          appSecret: activeAuthProvides.appSecret,
        })
      }
      fetchSettings();
    }
  }, [isModalOpen, settingForm]);

  return (
    <Modal
      title='设置钉钉登录'
      maskClosable={false}
      keyboard={false}
      centered={true}
      okText={t('okText')}
      cancelText={t('cancelText')}
      open={isModalOpen}
      onCancel={() => setIsModalOpen(false)}
      footer={<Button onClick={() => setIsModalOpen(false)}>关闭</Button>}
    >
      <div className='mt-4'>
        <Form
          layout="vertical"
          form={settingForm}
        >
          <div className='mt-2 mb-6 bg-slate-100 p-4 rounded-md'>
            <span className='font-medium text-base'>当前状态</span>
            {isActive ?
              <div className='flex flex-row items-center my-4'>
                <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                <span className='ml-2 text-sm'>已启用</span>
              </div> :
              <div className='flex flex-row items-center my-4'>
                <div className='w-3 h-3 bg-gray-400 rounded-full'></div>
                <span className='ml-2 text-sm'>未启用</span>
              </div>
            }
            <div className='text-gray-500'>如需启用或禁用飞书登录，请修改根目录 .env 文件，并重新编译并启动程序，详情请<Link href="https://k2swpw8zgf.feishu.cn/wiki/PcLVwBMcsiCm8Ikcp3pc7rVXn3f" target='_blank'>查看帮助文档</Link>。</div>
          </div>
          <Form.Item
            name='appId'
            label={<span className='font-medium'>App ID</span>}
            rules={[{ required: true, message: '当前项为必填' }]}
          >
            <Input disabled />
          </Form.Item>
          <Form.Item
            name='appSecret'
            label={<span className='font-medium'>App Secret</span>}
            rules={[{ required: true, message: '当前项为必填' }]}
          >
            <Input type='text' disabled />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default SettingsModal;