'use client';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { BotType } from '@/app/db/schema';
import { getBotListInServer } from '@/app/chat/actions/bot';
import { Button, Skeleton, Input, Empty } from 'antd';
import { useSession } from 'next-auth/react';
import { useLoginModal } from '@/app/contexts/loginModalContext';
import { useTranslations } from 'next-intl';
import CustomPagination from '@/app/components/CustomPagination';
import BackToTop from '@/app/components/BackToTop';
import { debounce } from 'lodash';

const BotDiscover = () => {
  const t = useTranslations('Chat');
  const { status } = useSession();
  const { showLogin } = useLoginModal();
  const [botList, setBotList] = useState<BotType[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(12);

  useEffect(() => {
    if (status === 'unauthenticated') {
      showLogin();
    }
  }, [status, showLogin]);

  const fetchBots = useCallback(async (page: number, size: number, query?: string) => {
    setIsPending(true);
    try {
      const bots = await getBotListInServer(page, size, query);
      setBotList(bots.data as BotType[]);
      setTotal(bots.total || 0);
    } catch (error) {
      console.error('Failed to fetch bots:', error);
    } finally {
      setIsPending(false);
    }
  }, []);

  const debouncedFetchRef = useRef(
    debounce((query: string) => {
      setCurrentPage(1);
      fetchBots(1, pageSize, query);
    }, 300)
  );

  // Update the debounced function when pageSize or fetchBots changes
  useEffect(() => {
    debouncedFetchRef.current = debounce((query: string) => {
      setCurrentPage(1);
      fetchBots(1, pageSize, query);
    }, 300);
  }, [pageSize, fetchBots]);

  useEffect(() => {
    fetchBots(currentPage, pageSize, searchQuery);
  }, [currentPage, pageSize, searchQuery, fetchBots]);

  useEffect(() => {
    debouncedFetchRef.current(searchQuery);
  }, [searchQuery]);

  const handlePageChange = (page: number, newPageSize?: number) => {
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setCurrentPage(1);
    } else {
      setCurrentPage(page);
    }
  };

  const handleShowSizeChange = (current: number, size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className='w-full flex flex-col space-y-4 max-w-6xl mx-auto'>
          <div className='flex flex-row justify-between items-center'>
            <h1 className='text-xl font-bold'>{t('discoverBots')}</h1>
            <Link href='/chat/bot/create'>
              <Button type="primary" icon={<PlusOutlined />} shape='round'>
                <div className='flex flex-row'>
                  {t('createBot')}
                </div>
              </Button>
            </Link>
          </div>
          
          <div className='flex flex-row items-center space-x-4'>
            <div className='flex-1'>
              <Input
                placeholder={t('searchPlaceholder')}
                prefix={<SearchOutlined className="text-gray-400" />}
                value={searchQuery}
                onChange={handleSearchChange}
                size="large"
                className="rounded-lg"
                style={{
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                }}
              />
            </div>
            {searchQuery && (
              <Button
                type="text"
                onClick={() => setSearchQuery('')}
                className="text-gray-500 hover:text-gray-700"
              >
                {t('clear')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" id="bot-list-scroll-container">
        <div className="container max-w-6xl mx-auto p-4">
          {isPending ?
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: pageSize }, (_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
            :
            <>
              {botList.length === 0 ? (
                <div className="flex justify-center items-center py-16">
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={
                      <span className="text-gray-500">
                        {searchQuery ? `${t('notFoundWithQuery')}「${searchQuery}」的智能体` : t('noBots')}
                      </span>
                    }
                  >
                    {!searchQuery && (
                      <Link href='/chat/bot/create'>
                        <Button type="primary" icon={<PlusOutlined />}>
                          {t('createFirstBot')}
                        </Button>
                      </Link>
                    )}
                  </Empty>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {botList.map((item) => (
                    <ServiceCard key={item.id} bot={item} />
                  ))}
                </div>
              )}
            </>
          }
        </div>
      </div>

      {/* 翻页组件固定在底部 */}
      {!isPending && botList.length > 0 && (
        <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
          <div className="container max-w-6xl mx-auto">
            <CustomPagination
              current={currentPage}
              total={total}
              pageSize={pageSize}
              onChange={handlePageChange}
              onShowSizeChange={handleShowSizeChange}
              loading={isPending}
              showSizeChanger={true}
            />
          </div>
        </div>
      )}
      
      <BackToTop target="#bot-list-scroll-container" />
    </div>
  )
};

const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-xl border-gray-200 border p-4 shadow-sm hover:shadow-md transition-shadow duration-200 w-full">
      <div className="flex items-start gap-4">
        <Skeleton.Avatar active size={48} style={{ borderRadius: 8 }} shape='square' />
        <div className="flex flex-col w-full">
          <Skeleton.Node active style={{ width: '100%', height: 22 }} />
          <Skeleton.Node active style={{ width: '90%', height: 16, marginTop: 8 }} />
        </div>
      </div>
    </div>
  )
}
const ServiceCard = (props: { bot: BotType }) => {
  return (
    <div className="bg-white rounded-xl border-gray-200 border p-4 shadow-sm hover:shadow-md transition-shadow duration-200 w-full relative">
      {props.bot.creator === 'public' && (
        <span className="absolute top-2 right-2 bg-gray-100 text-gray-500 text-xs  px-2 py-0.5 rounded">
          公共
        </span>
      )}
      <Link href={`/chat/bot/${props.bot.id}`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg flex bg-slate-200 items-center justify-center  overflow-hidden flex-shrink-0">
            {props.bot.avatarType === 'emoji' && <span className="text-4xl">{props.bot.avatar}</span>}
            {props.bot.avatarType === 'url' &&
              <Image
                src={props.bot.avatar}
                alt={props.bot.title}
                width={52}
                height={52}
                className="w-full h-full object-cover"
                unoptimized
              />}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 font-medium text-lg mb-1 truncate">
              {props.bot.title}
            </h3>
            <p className="text-gray-500 text-sm line-clamp-2">
              {props.bot.desc}
            </p>
          </div>
        </div>
      </Link>
    </div>
  );
};

export default BotDiscover;
