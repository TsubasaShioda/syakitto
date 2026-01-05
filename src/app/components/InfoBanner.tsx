"use client";
import { useState, useEffect } from 'react';

const InfoBanner = () => {
  const [isDenied, setIsDenied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
      setIsDenied(true);
      // セッションストレージで表示状態を管理
      const hasBeenDismissed = sessionStorage.getItem('notificationBannerDismissed');
      if (!hasBeenDismissed) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem('notificationBannerDismissed', 'true');
  };

  if (!isDenied || !isVisible) {
    return null;
  }

  return (
    <div className="bg-[#f4d06f]/30 border-t-4 border-[#f4d06f] text-[#2d3436] p-4 shadow-md" role="alert">
      <div className="flex items-center">
        <div className="py-1">
          <svg className="fill-current h-6 w-6 text-[#f4d06f] mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zM9 5v6h2V5H9zm0 8v2h2v-2H9z"/>
          </svg>
        </div>
        <div className='flex-grow'>
          <p className="font-bold">デスクトップ通知がブロックされています</p>
          <p className="text-sm">最高の体験を得るには、ブラウザとシステムの設定でSyakittoからの通知を許可してください。</p>
        </div>
        <button 
          onClick={handleClose} 
          className="ml-4 p-2 rounded-md hover:bg-[#f4d06f]/50 transition-colors"
          aria-label="閉じる"
        >
          <svg className="fill-current h-6 w-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
        </button>
      </div>
    </div>
  );
};

export default InfoBanner;
