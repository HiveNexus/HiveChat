'use client';
import ChatNaming from '@/app/components/admin/ChatNaming';
import AuthProviderConfig from '@/app/components/admin/AuthProviderConfig';
import { useTranslations } from 'next-intl';

const Userpage = () => {
  const t = useTranslations('Admin.System');
  return (
    <div className='container max-w-3xl mb-6 px-4 md:px-0 pt-4 pb-8 h-auto'>
      <div className='h-4 w-full mb-10'>
        <h2 className="text-xl font-bold mb-4 mt-6">{t('system')}</h2>
      </div>
      <ChatNaming />
      <AuthProviderConfig />
      <div className='h-6'></div>
    </div>
  )
}

export default Userpage