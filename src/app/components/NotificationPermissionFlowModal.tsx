"use client";

import React, { useState } from 'react';
import InfoModal from './InfoModal';

// Re-using the helper and type from AdvancedNotificationSettings
interface BrowserInfo {
  os: 'macOS' | 'Windows' | 'Other';
  browser: 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Other';
}

const getBrowserInfo = (): BrowserInfo => {
  if (typeof navigator === 'undefined') {
    return { os: 'Other', browser: 'Other' };
  }
  const ua = navigator.userAgent;
  let os: BrowserInfo['os'] = 'Other';
  if (/Macintosh|MacIntel|MacPPC|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/Windows|Win32/i.test(ua)) {
    os = 'Windows';
  }

  let browser: BrowserInfo['browser'] = 'Other';
  if (ua.indexOf("Chrome") > -1 && ua.indexOf("Edg") === -1) {
    browser = 'Chrome';
  } else if (ua.indexOf("Safari") > -1 && ua.indexOf("Chrome") === -1) {
    browser = 'Safari';
  } else if (ua.indexOf("Firefox") > -1) {
    browser = 'Firefox';
  } else if (ua.indexOf("Edg") > -1) {
    browser = 'Edge';
  }
  
  return { os, browser };
};


type FlowStep = 'test_notification' | 'confirm_delivery';

interface NotificationPermissionFlowModalProps {
  step: FlowStep;
  isOpen: boolean;
  onClose: () => void;
  onTest: () => void;
  onConfirmYes: () => void;
  onConfirmNo: () => void;
  showOsInstructions: boolean;
}

export const NotificationPermissionFlowModal = ({
  step,
  isOpen,
  onClose,
  onTest,
  onConfirmYes,
  onConfirmNo,
  showOsInstructions,
}: NotificationPermissionFlowModalProps) => {
  const [browserInfo] = useState<BrowserInfo | null>(() => {
    if (typeof window === 'undefined') return null; // SSR safety
    return getBrowserInfo();
  });

  const renderOsInstructions = () => {
    if (!browserInfo) return null;
    const { os, browser } = browserInfo;

    return (
      <div className="text-sm">
        {os === 'macOS' && (
          <div className="bg-[#a8d5ba]/20 p-4 rounded-xl border border-[#a8d5ba]/40">
            <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">macOSの通知設定を確認</h4>
            <p className='mb-2'>テスト通知が見えなかった場合、macOS側でブラウザの通知がオフになっている可能性があります。</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>「システム設定」を開きます。</li>
              <li>「通知」を選択します。</li>
              <li>アプリケーションの一覧からお使いのブラウザ（{browser}）を選択します。</li>
              <li>「通知を許可」がオンになっていること、および通知スタイルが「バナー」または「通知」に設定されていることを確認します。</li>
            </ol>
          </div>
        )}
        {os === 'Windows' && (
          <div className="bg-[#a8d5ba]/20 p-4 rounded-xl border border-[#a8d5ba]/40">
            <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Windowsの通知設定を確認</h4>
            <p className='mb-2'>テスト通知が見えなかった場合、Windowsの通知設定または「集中モード」が原因の可能性があります。</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>「スタート」メニューから「設定」を開きます。</li>
              <li>「システム」 &gt; 「通知」に移動し、ブラウザからの通知がオンになっていることを確認します。</li>
              <li>「システム」 &gt; 「集中モード」に移動し、「オフ」を選択します。</li>
            </ol>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (step) {
      case 'test_notification':
        return (
          <div>
            {showOsInstructions && (
                <div className="mb-6">
                    {renderOsInstructions()}
                </div>
            )}
            <p className="text-gray-700 leading-relaxed mb-6">{showOsInstructions ? '設定を再度確認したら、もう一度テストしてみましょう。' : 'ありがとうございます！通知がPCに正しく表示されるか、テスト通知を送信して確認しましょう。'}</p>
            <div className="flex justify-center">
              <button onClick={onTest} className="bg-[#5a8f7b] text-white font-bold py-3 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg">
                テスト通知を送信
              </button>
            </div>
          </div>
        );
      case 'confirm_delivery':
        return (
          <div>
            <p className="text-gray-700 leading-relaxed mb-6">「これはテスト通知です」というメッセージの通知は表示されましたか？</p>
            <div className="flex justify-center gap-6">
              <button onClick={onConfirmNo} className="text-gray-600 px-8 py-3 rounded-2xl hover:bg-gray-200 transition-colors text-lg font-semibold border border-gray-300">
                いいえ、見えません
              </button>
              <button onClick={onConfirmYes} className="bg-[#5a8f7b] text-white px-8 py-3 rounded-2xl hover:bg-[#4a7f6b] transition-colors text-lg font-semibold">
                はい、見えました
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'test_notification':
        return showOsInstructions ? 'OSの通知設定を確認してください' : '通知をテストしましょう'
      case 'confirm_delivery':
        return '通知は届きましたか？';
      default:
        return '';
    }
  }

  return (
    <InfoModal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
    >
      {renderContent()}
    </InfoModal>
  );
};