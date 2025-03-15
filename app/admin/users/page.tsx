'use client';
import React from 'react'
import { Tabs } from 'antd';
import UserListTab from '@/app/components/admin/users/UserListTab/page';
import GroupManagementTab from '@/app/components/admin/users/GroupManagementTab/page';
import { useTranslations } from 'next-intl';


const UserListPage = () => {
  const t = useTranslations('Admin.Users');

  const tabConfig = [{
    label: t('userList'),
    key: 'user-list',
    children: <UserListTab />
  }, {
    label: t('groupManagement'),
    key: 'group-management',
    children: <GroupManagementTab />
  }
  ]
  return (
    <div className='container max-w-4xl mb-6 px-4 md:px-0 pt-4'>
      <Tabs items={tabConfig} />
    </div>
  );
};

export default UserListPage;