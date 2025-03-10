import React, { useEffect, useState } from 'react';
import { Modal, Form, Switch, message } from 'antd';
import { fetchAppSettings, adminAndSetAppSettings } from '@/app/admin/system/actions';
import { getActiveAuthProvides } from '@/app/(auth)/actions';
import { useTranslations } from 'next-intl';

type EmailSettingsModalProps = {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
};

const EmailSettingsModal: React.FC<EmailSettingsModalProps> = ({
  isModalOpen,
  setIsModalOpen,
}) => {
  const t = useTranslations('Admin.Models');
  const [isEmailActive, setIsEmailActive] = useState(false);
  const [settingForm] = Form.useForm();

  const onModelFormSubmit = async (values: {
    isActive: boolean;
    isRegistrationOpen: boolean;
  }) => {
    await adminAndSetAppSettings('isRegistrationOpen', String(values.isRegistrationOpen))
    message.success('保存成功');
    setIsModalOpen(false);
  };

  useEffect(() => {
    if (isModalOpen) {
      const fetchSettings = async () => {
        const activeAuthProvides = await getActiveAuthProvides();
        activeAuthProvides.includes('email') && setIsEmailActive(true);
        const resultValue = await fetchAppSettings('isRegistrationOpen');
        settingForm.setFieldsValue({
          isRegistrationOpen: resultValue === 'true',
        })
      }
      fetchSettings();
    }
  }, [isModalOpen, settingForm]);

  return (
    <Modal
      title='设置 Email 登录'
      maskClosable={false}
      keyboard={false}
      centered={true}
      okText={t('okText')}
      cancelText={t('cancelText')}
      open={isModalOpen}
      onOk={() => settingForm.submit()}
      onCancel={() => setIsModalOpen(false)}
    >
      <div className='mt-4'>
        <Form
          layout="vertical"
          form={settingForm}
          onFinish={onModelFormSubmit}
        >
          <div className='mt-2 mb-6 bg-slate-100 p-4 rounded-md'>
            <span className='font-medium text-base'>当前状态</span>
            {isEmailActive ?
              <div className='flex flex-row items-center my-4'>
                <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                <span className='ml-2 text-sm'>已启用</span>
              </div> :
              <div className='flex flex-row items-center my-4'>
                <div className='w-3 h-3 bg-gray-400 rounded-full'></div>
                <span className='ml-2 text-sm'>未启用</span>
              </div>
            }
            <span className='text-gray-500'>如需禁用 Email 登录，请修改根目录 .env 文件，并重新编译并启动程序，详情请查看帮助文档。</span>
          </div>
          <Form.Item
            name='isRegistrationOpen'
            valuePropName="checked"
            label={<span className='font-medium'>开放注册</span>}
            extra="用户可通过邮箱自助申请账号，内部团队使用请勿开启"
          >
            <Switch defaultChecked={false} />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
};

export default EmailSettingsModal;