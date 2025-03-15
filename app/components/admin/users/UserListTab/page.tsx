'use client';
import React, { useEffect, useState } from 'react'
import { getUserList, addUser, updateUser, deleteUser } from './actions';
import { Tag, Button, Modal, Form, Input, Switch, Divider, message, Skeleton, Select } from 'antd';
import { UserType } from '@/app/db/schema';
import { useTranslations } from 'next-intl';
import { groupType } from '../GroupManagementTab/page';
import { getGroupList } from '../GroupManagementTab/actions';
type FormValues = {
  email: string;
  password: string;
  isAdmin: boolean;
  groupId: string;
}

const UserListTab = () => {
  const t = useTranslations('Admin.Users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditUserModalOpen, setIsEditUserModalOpen] = useState(false);
  const [userList, setUserList] = useState<UserType[]>([]);
  const [userFetchStatus, setUserFetchStatus] = useState(true);
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [groupList, setGroupList] = useState<groupType[]>([]);
  const [groupSelectValue, setGroupSelectValue] = useState<string>('_all');

  const groupsSelectOptions = [
    ...groupList.map((group) => ({
      value: group.id,
      label: group.name
    }))
  ]

  const groupsAndAllSelectOptions = [
    { value: '_all', label: '全部' },
    ...groupsSelectOptions
  ]



  const showAddUserModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    form.submit();
  };

  const handleEditUserOk = () => {
    editForm.submit();
  };

  const handleCancel = () => {
    form.resetFields();
    setIsModalOpen(false);
  };

  const handleEditUserModalCancel: () => void = () => {
    editForm.resetFields();
    setIsEditUserModalOpen(false);
  };

  useEffect(() => {
    const fetchGroupList = async (): Promise<void> => {
      const groupList = await getGroupList();
      setGroupList(groupList);
    };
    fetchGroupList();
  }, [])

  useEffect(() => {
    const fetchUserList = async (): Promise<void> => {
      const userList = await getUserList(groupSelectValue);
      setUserList(userList);
      setUserFetchStatus(false)
    };
    fetchUserList();
  }, [groupSelectValue]);



  const onFinish = async (values: FormValues) => {
    const result = await addUser(values);
    if (result.success) {
      const userList = await getUserList(groupSelectValue);
      setUserList(userList);
      message.success(t('addUserSuccess'));
      form.resetFields();
      setIsModalOpen(false);
    } else {
      message.error(result.message)
    }
  };

  const onEditUserFinish = async (values: FormValues) => {
    const result = await updateUser(values.email, values);
    if (result.success) {
      const userList = await getUserList(groupSelectValue);
      setUserList(userList);
      message.success(t('updateUserSuccess'));
      editForm.resetFields();
      setIsEditUserModalOpen(false);
    } else {
      message.error(result.message)
    }
  };

  const handleEditUser = async (userInfo: UserType) => {
    editForm.setFieldsValue({
      'groupId': userInfo.groupId,
      'email': userInfo.email,
      'isAdmin': userInfo.isAdmin,
    })
    setIsEditUserModalOpen(true);
  }

  const handleDeleteUser = async (email: string) => {
    if (confirm(t('deleteNotice'))) {
      const result = await deleteUser(email);
      if (result.success) {
        const userList = await getUserList();
        setUserList(userList);
        message.success(t('deleteUserSuccess'));
      } else {
        message.error(result.message)
      }
    }
  }
  return (
    <div className='container max-w-4xl mb-6 px-4 md:px-0 pt-4'>
      <div className='w-full mb-6 flex flex-row justify-between items-center'>
        <section>
          分组：
          <Select
            className='w-40'
            defaultValue={groupsAndAllSelectOptions[0].value}
            options={groupsAndAllSelectOptions}
            onChange={(value) => {
              setGroupSelectValue(value)
            }}
          />
        </section>
        <Button type='primary' onClick={showAddUserModal}>{t('addUser')}</Button>
      </div>
      {userFetchStatus ? <><Skeleton active /></> :
        <><div className="overflow-hidden rounded-lg border border-slate-300">
          <table className='border-collapse w-full'>
            <thead>
              <tr className="bg-slate-100">
                <th className='border-b border-r border-slate-300 p-2'>#</th>
                <th className='border-b border-r border-slate-300 p-2'>昵称</th>
                <th className='border-b border-r border-slate-300 p-2'>Email</th>
                <th className='border-b border-r border-slate-300 p-2'>{t('role')}</th>
                <th className='border-b border-r border-slate-300 p-2'>所属分组</th>
                <th className='border-b border-r border-slate-300 p-2'>{t('registerAt')}</th>
                <th className='border-b border-slate-300 p-2 w-36'>{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {userList.map((user, index) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className='border-t border-r text-center text-sm border-slate-300 p-2'>{index + 1}</td>
                  <td className='border-t border-r text-sm border-slate-300 p-2'>{user.name ? user.name : '-'}</td>
                  <td className='border-t border-r text-sm border-slate-300 p-2'>{user.email ? user.email : '-'}</td>
                  <td className='border-t border-r text-sm text-center border-slate-300 p-2'>{user.isAdmin ? <Tag color="blue">{t('roleAdmin')}</Tag> : <Tag>{t('roleUser')}</Tag>}</td>
                  <td className='border-t border-r text-sm text-center w-48 border-slate-300 p-2'>{user.groupId ? groupList.filter((group) => group.id === user.groupId)[0].name : '-'}</td>
                  <td className='border-t border-r text-sm text-center w-48 border-slate-300 p-2'>{user.createdAt?.toLocaleString('sv-SE')}</td>
                  <td className='border-t text-center text-sm w-32 border-slate-300 p-2'>
                    <Button
                      size='small'
                      className='text-sm'
                      type='link'
                      onClick={() => {
                        handleEditUser(user)
                      }}
                    >{t('edit')}</Button>
                    <Divider type="vertical" />
                    <Button
                      size='small'
                      className='text-sm'
                      type='link'
                      onClick={() => {
                        handleDeleteUser(user.email as string)
                      }}
                    >{t('delete')}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          <div className='h-8'></div>
        </>
      }
      <Modal
        title={t('addUser')}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
          validateTrigger='onBlur'
          
        >
          <Form.Item label={<span className='font-medium'>Email</span>} name='email'
            rules={[{ required: true, message: t('emailNotice') }, { type: 'email', message: t('emailNotice') }]}>
            <Input type='email' />
          </Form.Item>
          <Form.Item label={<span className='font-medium'>{t('password')}</span>} name='password'
            rules={[{ required: true, message: t('passwordNotice') }, {
              min: 8,
              message: t('lengthLimit')
            }]}>
            <Input.Password
              placeholder=""
              visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
            />
          </Form.Item>
          <Form.Item label={<span className='font-medium'>所属分组</span>} name='groupId' rules={[{ required: true, message: '请选择分组' }]}>
            <Select
              options={groupsSelectOptions} />
          </Form.Item>
          <Form.Item label={<span className='font-medium'>{t('roleAdmin')}</span>} name='isAdmin'>
            <Switch defaultChecked={false} value={false} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('editUser')}
        open={isEditUserModalOpen}
        onOk={handleEditUserOk}
        onCancel={handleEditUserModalCancel}
      >
        <Form
          layout="vertical"
          form={editForm}
          onFinish={onEditUserFinish}
          validateTrigger='onBlur'
        >
          <Form.Item label={<span className='font-medium'>Email</span>} name='email'
            rules={[{ type: 'email', message: t('emailNotice') }]}>
            <Input type='email' disabled />
          </Form.Item>
          <Form.Item rules={[{ required: true, message: '请选择分组' }]} label={<span className='font-medium'>所属分组</span>} name='groupId'>
            <Select
              options={groupsSelectOptions}
            />
          </Form.Item>
          <Form.Item label={<span className='font-medium'>{t('roleAdmin')}</span>} name='isAdmin'>
            <Switch defaultChecked={false} value={false} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserListTab;