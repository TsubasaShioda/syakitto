"use client";

import React, { useEffect, useState } from 'react';
import InfoModal from './InfoModal';

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

const AdvancedNotificationSettings = ({ 
  isOpen, 
  onClose, 
  preamble, 
  title, 
  additionalMessage,
  showCompletionButton,
  onCompletionClick,
  showBrowserInstructions = true,
  showOsInstructions = true,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  preamble?: React.ReactNode; 
  title?: string; 
  additionalMessage?: string;
  showCompletionButton?: boolean;
  onCompletionClick?: () => void;
  showBrowserInstructions?: boolean;
  showOsInstructions?: boolean;
}) => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);

  useEffect(() => {
    setBrowserInfo(getBrowserInfo());
  }, []);

  const renderInstructions = () => {
    if (!browserInfo) return <p>設定情報を読み込んでいます...</p>;

    const { os, browser } = browserInfo;

    return (
      <div className="space-y-4 text-sm">
        {additionalMessage && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-4">
            <p className="font-bold">{additionalMessage}</p>
          </div>
        )}
        {preamble}
        
        {showBrowserInstructions && (
            <p className='text-base'>
              まず、お使いのブラウザでこのサイトからの通知が許可されているか確認してください。
            </p>
        )}

        {showBrowserInstructions && browser === 'Chrome' && (
          <div className="bg-[#b8c9b8]/20 p-4 rounded-xl border border-[#b8c9b8]/40">
            <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Chromeでの設定手順:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>画面右上のその他アイコン <span className="font-mono text-lg">⋮</span> をクリックします。</li>
              <li>「設定」を選択します。</li>
              <li>左側のメニューで「プライバシーとセキュリティ」をクリックし、「サイトの設定」を選択します。</li>
              <li>「通知」をクリックします。</li>
              <li><strong>{window.location.hostname}</strong> が「通知の送信を許可しないサイト」に含まれている場合は、その横の <span className="font-mono text-lg">⋮</span> をクリックし、「許可」を選択します。</li>
            </ol>
          </div>
        )}

        {showBrowserInstructions && browser === 'Safari' && os === 'macOS' && (
          <div className="bg-[#b8c9b8]/20 p-4 rounded-xl border border-[#b8c9b8]/40">
            <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Safariでの設定手順 (macOS):</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>画面左上のメニューバーで「Safari」をクリックし、「設定」を選択します。</li>
              <li>「Webサイト」タブをクリックします。</li>
              <li>左のリストから「通知」を選択します。</li>
              <li>右のリストから <strong>{window.location.hostname}</strong> を見つけ、ドロップダウンを「許可」に変更します。</li>
            </ol>
          </div>
        )}
        
        {showBrowserInstructions && browser === 'Firefox' && (
           <div className="bg-[#b8c9b8]/20 p-4 rounded-xl border border-[#b8c9b8]/40">
             <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Firefoxでの設定手順:</h4>
             <ol className="list-decimal list-inside space-y-1">
                <li>アドレスバーの左にあるアイコンをクリックします。</li>
                <li>「接続が保護されています」の横にある矢印 <span className="font-mono text-lg">&gt;</span> をクリックします。</li>
                <li>「詳細情報を表示」をクリックします。</li>
                <li>「サイト別設定」タブを開きます。</li>
                <li>「通知を送信」の権限が「ブロック」になっている場合は、「許可」に変更します。</li>
             </ol>
           </div>
        )}
        
        {showBrowserInstructions && browser === 'Edge' && (
            <div className="bg-[#b8c9b8]/20 p-4 rounded-xl border border-[#b8c9b8]/40">
                <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Edgeでの設定手順:</h4>
                <ol className="list-decimal list-inside space-y-1">
                    <li>画面右上の設定など <span className="font-mono text-lg">...</span> をクリックし、「設定」を選択します。</li>
                    <li>左側のメニューで「Cookieとサイトのアクセス許可」をクリックします。</li>
                    <li>「通知」を見つけてクリックします。</li>
                    <li>「ブロック」のリストにこのサイト (`{window.location.origin}`) があれば、横の <span className="font-mono text-lg">...</span> をクリックして「削除」し、ブラウザを再読み込みしてください。</li>
                </ol>
            </div>
        )}

        {showOsInstructions && os === 'macOS' && (
          <div className="bg-[#a8d5ba]/20 p-4 rounded-xl border border-[#a8d5ba]/40 mt-4">
            <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">macOSの通知設定</h4>
            <p>ブラウザの設定が完了しても通知が届かない場合は、macOS自体の設定を確認してください。</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>「システム設定」を開きます。</li>
              <li>「通知」を選択します。</li>
              <li>アプリケーションの一覧からお使いのブラウザ（{browser}）を選択します。</li>
              <li>「通知を許可」がオンになっていること、および通知スタイルが「バナー」または「通知」に設定されていることを確認します。</li>
            </ol>
          </div>
        )}

        {showOsInstructions && os === 'Windows' && (
          <div className="bg-[#a8d5ba]/20 p-4 rounded-xl border border-[#a8d5ba]/40 mt-4">
            <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Windowsの通知設定</h4>
            <p>ブラウザの設定が完了しても通知が届かない場合は、Windowsの通知設定と「集中モード」を確認してください。</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>「スタート」メニューから「設定」を開きます。</li>
              <li>「システム」 &gt; 「通知」に移動し、ブラウザからの通知がオンになっていることを確認します。</li>
              <li>「システム」 &gt; 「集中モード」に移動し、「オフ」を選択します。</li>
            </ol>
          </div>
        )}

        {(showBrowserInstructions || showOsInstructions) && (
          <div className="text-xs text-gray-500 pt-4">
            <p>セキュリティ上の理由から、Webサイトが直接ブラウザの設定画面を開くことはできません。お手数ですが、上記の手順で手動で設定を変更してください。</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <InfoModal isOpen={isOpen} onClose={onClose} title={title || "通知設定の確認"}>
      <div className='relative'>
        {renderInstructions()}
        {showCompletionButton && (
          <div className="mt-8 flex justify-end">
            <button 
              onClick={onCompletionClick}
              className="bg-[#5a8f7b] text-white font-bold py-2 px-6 rounded-xl hover:bg-[#4a7f6b] transition-colors shadow-md"
            >
              設定完了
            </button>
          </div>
        )}
      </div>
    </InfoModal>
  );
};

export default AdvancedNotificationSettings;