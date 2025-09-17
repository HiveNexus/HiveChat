'use client';

import React, { useState, useEffect } from 'react';
import { UpOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';

interface BackToTopProps {
  scrollThreshold?: number;
  target?: string | (() => HTMLElement | null);
  className?: string;
}

const BackToTop: React.FC<BackToTopProps> = ({
  scrollThreshold = 300,
  target,
  className = ''
}) => {
  const t = useTranslations('Chat');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const getScrollElement = () => {
      if (typeof target === 'string') {
        return document.querySelector(target) as HTMLElement;
      } else if (typeof target === 'function') {
        return target();
      }
      return window;
    };

    const handleScroll = () => {
      const scrollElement = getScrollElement();
      let scrollTop = 0;

      if (scrollElement === window) {
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      } else {
        scrollTop = (scrollElement as HTMLElement)?.scrollTop || 0;
      }

      setVisible(scrollTop > scrollThreshold);
    };

    const scrollElement = getScrollElement();
    
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      // Check initial scroll position
      handleScroll();
    }

    return () => {
      if (scrollElement) {
        scrollElement.removeEventListener('scroll', handleScroll);
      }
    };
  }, [scrollThreshold, target]);

  const scrollToTop = () => {
    const getScrollElement = () => {
      if (typeof target === 'string') {
        return document.querySelector(target) as HTMLElement;
      } else if (typeof target === 'function') {
        return target();
      }
      return window;
    };

    const scrollElement = getScrollElement();

    if (scrollElement === window) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    } else {
      (scrollElement as HTMLElement)?.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-6 right-6 z-50
        w-12 h-12 
        bg-blue-600 hover:bg-blue-700 
        text-white 
        rounded-full 
        shadow-lg hover:shadow-xl 
        transition-all duration-300 ease-in-out
        flex items-center justify-center
        transform hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      aria-label={t('backToTop')}
      title={t('backToTop')}
    >
      <UpOutlined className="text-lg" />
    </button>
  );
};

export default BackToTop;