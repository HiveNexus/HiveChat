'use client';
import { Pagination } from 'antd';
import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

interface CustomPaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number, pageSize?: number) => void;
  onShowSizeChange?: (current: number, size: number) => void;
  loading?: boolean;
  pageSizeOptions?: string[];
  showSizeChanger?: boolean;
}

const CustomPagination = ({
  current,
  total,
  pageSize,
  onChange,
  onShowSizeChange,
  loading = false,
  pageSizeOptions = ['12', '24', '48', '60', '96', '120', '240', '480', '600'],
  showSizeChanger = true
}: CustomPaginationProps) => {
  const t = useTranslations('Common');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (total <= 0) return null;

  const startItem = ((current - 1) * pageSize) + 1;
  const endItem = Math.min(current * pageSize, total);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-sm text-gray-500 font-medium text-center px-4">
        <span className="hidden sm:inline">
          {t('total')} <span className="text-blue-600 font-semibold">{total}</span> {t('items')}，
          {t('currentDisplay')} <span className="text-blue-600 font-semibold">{startItem}</span> {t('to')} <span className="text-blue-600 font-semibold">{endItem}</span>
        </span>
        <span className="sm:hidden">
          <span className="text-blue-600 font-semibold">{startItem}-{endItem}</span> / {total}
        </span>
      </div>
        <Pagination
          current={current}
          total={total}
          pageSize={pageSize}
          onChange={onChange}
          showSizeChanger={showSizeChanger && !isMobile}
          pageSizeOptions={pageSizeOptions}
          onShowSizeChange={onShowSizeChange}
          disabled={loading}
          className="custom-pagination"
          showQuickJumper={false}
          showTotal={!isMobile ? (total, range) => `${range[0]}-${range[1]} ${t('itemsPerPage')}` : undefined}
          size={isMobile ? 'small' : 'default'}
          simple={isMobile && total > pageSize * 10}
          locale={{
            items_per_page: `${t('itemsPerPage')}`,
            jump_to: t('jumpTo'),
            jump_to_confirm: t('confirm'),
            page: t('page'),
            prev_page: t('previousPage'),
            next_page: t('nextPage'),
            prev_5: t('previous5Pages'),
            next_5: t('next5Pages'),
            prev_3: t('previous3Pages'),
            next_3: t('next3Pages')
          }}
        />
    </div>
  );
};

export default CustomPagination;
