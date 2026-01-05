"use client";

import React, { useEffect, useState } from 'react';
import InfoModal from './InfoModal';

interface BrowserInfo {
  os: 'macOS' | 'Windows' | 'Other';
  browser: 'Chrome' | 'Firefox' | 'Safari' | 'Edge' | 'Other';
}

const getBrowserInfo = (): BrowserInfo => {
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

const AdvancedNotificationSettings = ({ isOpen, onClose, preamble }: { isOpen: boolean; onClose: () => void; preamble?: React.ReactNode; }) => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);

  useEffect(() => {
    setBrowserInfo(getBrowserInfo());
  }, []);

  const renderInstructions = () => {
    if (!browserInfo) return <p>設定情報を読み込んでいます...</p>;

    const { os, browser } = browserInfo;

    return (
      <div className="space-y-4 text-sm">
        {preamble}
        <p className='text-base'>お使いの環境では、通知がブロックされています。以下の手順で設定を変更してください。</p>
        
        {browser === 'Chrome' && (
          <div className="bg-[#b8c9b8]/20 p-4 rounded-xl border border-[#b8c9b8]/40">
            <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Chromeでの設定手順:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>画面右上のその他アイコン <span className="font-mono text-lg">⋮</span> をクリックします。</li>
              <li>「設定」を選択します。</li>
              <li>左側のメニューで「プライバシーとセキュリティ」をクリックし、「サイトの設定」を選択します。</li>
              <li>「通知」をクリックします。</li>
              <li><strong>{window.location.hostname}</strong> を見つけ、横にある <span className="font-mono text-lg">⋮</span> をクリックし、「許可」を選択します。</li>
            </ol>
          </div>
        )}

        {browser === 'Safari' && os === 'macOS' && (
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
        
        {browser === 'Firefox' && (
           <div className="bg-[#b8c9b8]/20 p-4 rounded-xl border border-[#b8c9b8]/40">
             <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Firefoxでの設定手順:</h4>
             <ol className="list-decimal list-inside space-y-1">
                <li>アドレスバーの左にある鍵（<svg xmlns="http://www.w3.org/2000/svg" className="inline h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 8a6 6 0 11-12 0 6 6 0 0112 0zM8.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L10 10.586 8.707 9.293z" clipRule="evenodd" /></svg>）アイコンをクリックします。</li>
                <li>「接続が保護されています」の横にある矢印 <span className="font-mono text-lg">&gt;</span> をクリックします。</li>
                <li>「詳細情報を表示」をクリックします。</li>
                <li>「サイト別設定」タブを開きます。</li>
                <li>「通知を送信」のチェックを「許可」に変更します。</li>
             </ol>
           </div>
        )}
        
        {browser === 'Edge' && (
            <div className="bg-[#b8c9b8]/20 p-4 rounded-xl border border-[#b8c9b8]/40">
                <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Edgeでの設定手順:</h4>
                <ol className="list-decimal list-inside space-y-1">
                    <li>画面右上の設定など <span className="font-mono text-lg">...</span> をクリックし、「設定」を選択します。</li>
                    <li>左側のメニューで「Cookieとサイトのアクセス許可」をクリックします。</li>
                    <li>「通知」を見つけてクリックします。</li>
                    <li>「許可」セクションの「追加」ボタンを押し、サイトのアドレス (`{window.location.origin}`) を入力します。</li>
                </ol>
            </div>
        )}

        {os === 'Windows' && ['Chrome', 'Edge', 'Firefox'].includes(browser) && (
          <div className="bg-[#a8d5ba]/20 p-4 rounded-xl border border-[#a8d5ba]/40 mt-4">
            <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Windowsの集中モードの確認:</h4>
            <p>ブラウザの設定が完了しても通知が届かない場合は、Windowsの「集中モード」がオフになっていることを確認してください。</p>
            <ol className="list-decimal list-inside space-y-1 mt-2">
              <li>「スタート」メニューから「設定」を開きます。</li>
              <li>「システム」 → 「集中モード」に移動します。</li>
              <li>「オフ」を選択します。</li>
            </ol>
          </div>
        )}

        <div className="text-xs text-gray-500 pt-4">
          <p>セキュリティ上の理由から、Webサイトが直接ブラウザの設定画面を開くことはできません。お手数ですが、上記の手順で手動で設定を変更してください。</p>
        </div>
      </div>
    );
  };

  return (
    <InfoModal isOpen={isOpen} onClose={onClose} title="通知設定の変更方法">
      {renderInstructions()}
    </InfoModal>
  );
};

export default AdvancedNotificationSettings;
