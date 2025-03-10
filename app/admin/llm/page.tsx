'use client';
import { useTranslations } from 'next-intl';

const LLMSettings = () => {
  const t = useTranslations('Admin.Models');
  return (
    <div className='container flex flex-row max-w-3xl h-full items-center justify-center mb-6'>
      <h2 className="text-gray-500 mb-4">{t('modelSettingsNotice')}</h2>
    </div>
  )
}

export default LLMSettings