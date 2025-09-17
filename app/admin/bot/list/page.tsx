'use client';
import Image from 'next/image';
import Link from 'next/link';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlusOutlined, SearchOutlined, DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import { BotType } from '@/app/db/schema';
import { getBotListInServer } from '@/app/admin/bot/action';
import { Button, Skeleton, Input, Empty, Dropdown, message, Modal, Upload } from 'antd';
import { useTranslations } from 'next-intl';
import CustomPagination from '@/app/components/CustomPagination';
import BackToTop from '@/app/components/BackToTop';
import { debounce } from 'lodash';
import { UploadProps } from 'antd';

const AdminBotList = () => {
  const t = useTranslations('Chat');
  const [botList, setBotList] = useState<BotType[]>([]);
  const [isPending, setIsPending] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState(12);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);

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

  const handleExport = async (type: 'current' | 'all') => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams({
        type,
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      if (searchQuery) {
        params.append('searchQuery', searchQuery);
      }
      
      const response = await fetch(`/api/admin/bot/export?${params}`);
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = type === 'all' ? 'all-bots.json' : `bots-page-${currentPage}.json`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message.success(t('exportSuccess', { count: data.count }));
    } catch (error) {
      console.error('Export error:', error);
      message.error(t('exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      
      let botsData;
      if (jsonData.data) {
        botsData = jsonData.data;
      } else if (Array.isArray(jsonData)) {
        botsData = jsonData;
      } else {
        throw new Error(t('invalidFileFormat'));
      }
      
      const response = await fetch('/api/admin/bot/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bots: botsData }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }
      
      message.success(t('importSuccess', { imported: result.imported, skipped: result.skipped, total: result.total }));
      setImportModalVisible(false);
      // Refresh the list
      fetchBots(currentPage, pageSize, searchQuery);
    } catch (error) {
      console.error('Import error:', error);
      message.error(error instanceof Error ? error.message : t('importFailed'));
    } finally {
      setIsImporting(false);
    }
  };

  const uploadProps: UploadProps = {
    accept: '.json',
    beforeUpload: (file) => {
      handleImport(file);
      return false;
    },
    showUploadList: false,
  };

  const exportMenuItems = [
    {
      key: 'current',
      label: t('exportCurrent'),
      icon: <DownloadOutlined />,
      onClick: () => handleExport('current'),
    },
    {
      key: 'all',
      label: t('exportAll'),
      icon: <DownloadOutlined />,
      onClick: () => handleExport('all'),
    },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className='w-full flex flex-col space-y-4 max-w-6xl mx-auto'>
          <div className='flex flex-row justify-between items-center'>
            <h1 className='text-xl font-bold'>{t('botManagement')}</h1>
            <div className='flex flex-row space-x-2'>
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                <Button 
                  icon={<DownloadOutlined />} 
                  shape='round' 
                  loading={isExporting}
                >
                  {t('export')}
                </Button>
              </Dropdown>
              <Upload {...uploadProps}>
                <Button 
                  icon={<UploadOutlined />} 
                  shape='round' 
                  loading={isImporting}
                >
                  {t('import')}
                </Button>
              </Upload>
              <Link href='/admin/bot/create'>
                <Button type="primary" icon={<PlusOutlined />} shape='round'>
                  <div className='flex flex-row'>
                    {t('createBot')}
                  </div>
                </Button>
              </Link>
            </div>
          </div>
          
          <div className='text-sm text-gray-500'>
            <span>{t('allUsersCanView')}
              <Button type="link" style={{padding:0}}>
                <Link href='/chat/bot/discover'>{t('discoverBotsPage')}</Link>
              </Button>
              {t('page')}</span>
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

      <div className="flex-1 overflow-y-auto" id="admin-bot-list-scroll-container">
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
                      <Link href='/admin/bot/create'>
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
      
      <BackToTop target="#admin-bot-list-scroll-container" />
    </div>
  )
};

const SkeletonCard = () => {
  return (
    <div className="bg-white rounded-xl border-gray-200 border p-4 shadow-sm hover:shadow-md transition-shadow duration-200 w-full">
      <div className="flex items-start gap-4">
        <Skeleton.Avatar active size={48} style={{ borderRadius: 8 }} shape='square' />
        <div className="flex flex-col w-full">
          <Skeleton.Node active style={{ width: 160, height: 22 }} />
          <Skeleton.Node active style={{ width: '90%', height: 16, marginTop: 8 }} />
        </div>
      </div>
    </div>
  )
}
const ServiceCard = (props: { bot: BotType }) => {
  return (
    <div className="bg-white rounded-xl border-gray-200 border p-4 shadow-sm hover:shadow-md transition-shadow duration-200 w-full">
      <Link href={`/admin/bot/${props.bot.id}`}>
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

export default AdminBotList;
