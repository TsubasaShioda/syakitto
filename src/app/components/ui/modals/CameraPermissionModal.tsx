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

const CameraPermissionModal = ({ 
  isOpen, 
  onClose, 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
}) => {
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo | null>(null);

  useEffect(() => {
    setBrowserInfo(getBrowserInfo());
  }, []);

  const renderInstructions = () => {
    if (!browserInfo) return <p>設定情報を読み込んでいます...</p>;

    const { browser } = browserInfo;

    return (
      <div className="space-y-4 text-sm">
        <p className='text-base'>
          姿勢分析機能を利用するには、ブラウザでこのサイトへのカメラアクセスを許可する必要があります。
        </p>
        <p>
          お使いのブラウザのアドレスバーの左側にあるアイコンをクリックし、カメラのアクセスを「許可」してください。もしブロックされている場合は、以下の手順で設定を変更できます。
        </p>

        {browser === 'Chrome' && (
          <div className="bg-[#b8c9b8]/20 p-4 rounded-xl border border-[#b8c9b8]/40">
            <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Chromeでの設定手順:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>画面右上のその他アイコン <span className="font-mono text-lg">⋮</span> をクリックします。</li>
              <li>「設定」を選択します。</li>
              <li>左側のメニューで「プライバシーとセキュリティ」をクリックし、「サイトの設定」を選択します。</li>
              <li>「カメラ」をクリックします。</li>
              <li><strong>{window.location.hostname}</strong> が「カメラへのアクセスを許可しないサイト」に含まれている場合は、そのサイトを選択し、カメラの権限を「許可」に変更します。</li>
            </ol>
          </div>
        )}

        {browser === 'Safari' && (
          <div className="bg-[#b8c9b8]/20 p-4 rounded-xl border border-[#b8c9b8]/40">
            <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Safariでの設定手順:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>画面左上のメニューバーで「Safari」をクリックし、「設定」を選択します。</li>
              <li>「Webサイト」タブをクリックします。</li>
              <li>左のリストから「カメラ」を選択します。</li>
              <li>右のリストから <strong>{window.location.hostname}</strong> を見つけ、ドロップダウンを「許可」に変更します。</li>
            </ol>
          </div>
        )}
        
        {browser === 'Firefox' && (
           <div className="bg-[#b8c9b8]/20 p-4 rounded-xl border border-[#b8c9b8]/40">
             <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Firefoxでの設定手順:</h4>
             <ol className="list-decimal list-inside space-y-1">
                <li>アドレスバーの左にあるアイコン（通常は鍵マーク）をクリックします。</li>
                <li>「接続が保護されています」のパネルで、「カメラの使用」の権限がブロックされている場合は、横の「x」をクリックしてブロックを解除します。</li>
                <li>ページを再読み込みすると、再度許可を求められます。</li>
             </ol>
           </div>
        )}
        
        {browser === 'Edge' && (
            <div className="bg-[#b8c9b8]/20 p-4 rounded-xl border border-[#b8c9b8]/40">
                <h4 className="font-bold text-lg mb-2 text-[#5a8f7b]">Edgeでの設定手順:</h4>
                <ol className="list-decimal list-inside space-y-1">
                    <li>画面右上の設定など <span className="font-mono text-lg">...</span> をクリックし、「設定」を選択します。</li>
                    <li>左側のメニューで「Cookieとサイトのアクセス許可」をクリックします。</li>
                    <li>「すべてのアクセス許可」のセクションで「カメラ」を見つけてクリックします。</li>
                    <li>「ブロック」のリストにこのサイト (`{window.location.origin}`) があれば、横の <span className="font-mono text-lg">...</span> をクリックして「削除」します。</li>
                </ol>
            </div>
        )}

        <div className="text-xs text-gray-500 pt-4">
          <p>設定を変更した後、このページは自動的に更新されます。もし更新されない場合は、手動でページを再読み込みしてください。</p>
        </div>
      </div>
    );
  };

  return (
    <InfoModal isOpen={isOpen} onClose={onClose} title="カメラの許可が必要です">
      <div className='relative'>
        {renderInstructions()}
      </div>
    </InfoModal>
  );
};

export default CameraPermissionModal;
