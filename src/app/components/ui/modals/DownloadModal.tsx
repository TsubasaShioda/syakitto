"use client";

import React, { useRef } from 'react'; // useRefをインポート

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
}

const DownloadModal = ({ isOpen, onClose, onDownload }: DownloadModalProps) => {
  const modalContentRef = useRef<HTMLDivElement>(null); // コンテンツ領域への参照

  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // クリックされた要素がモーダルのコンテンツ領域の外側であれば閉じる
    if (modalContentRef.current && !modalContentRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#2d3436]/60 backdrop-blur-md flex items-center justify-center p-4 z-50"
      onClick={handleOverlayClick} // オーバーレイクリックハンドラを追加
    >
      <div
        className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 relative border border-[#c9b8a8]/40 max-h-[90vh] overflow-y-auto"
        ref={modalContentRef} // コンテンツ領域に参照を設定
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-[#c9b8a8]/30 hover:bg-[#c9b8a8]/50 text-gray-700 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-3xl font-bold text-[#5a8f7b] mb-8 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          アプリケーションのダウンロード
        </h2>
        <div className="space-y-6">
          <div className="bg-[#b8c9b8]/10 rounded-3xl p-6 border border-[#b8c9b8]/30">
            <h3 className="text-xl font-semibold text-[#5a8f7b] mb-4">ダウンロード版「Sakitto」でできること</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Web版と同様にAIによるリアルタイムの姿勢分析と猫背検知、眠気検知、ポモドーロタイマーが利用可能</li>
              <li>ブラウザを閉じてもバックグラウンドで動作し、システムトレイから簡単にアクセス</li>
              <li>姿勢スコアに応じたシステムトレイアイコンの動的な変化</li>
              <li>より統合されたネイティブ通知</li>
              <li>猫の手やフラッシュ、トグルなど、多様なアニメーション通知で視覚的に注意を喚起</li>
              <li>macOS起動時に自動で立ち上がり、常に姿勢をチェックし続けることが可能</li>
            </ul>
          </div>
          <div className="bg-[#a8d5ba]/10 rounded-3xl p-6 border border-[#a8d5ba]/30">
            <h3 className="text-xl font-semibold text-[#5a8f7b] mb-4">macOSでの起動方法</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              macOSでは、Gatekeeper機能により初回起動がブロックされることがあります。
              以下の手順でアプリケーションを起動してください。
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2">
              <li>ダウンロードした`.dmg`ファイルを開き、表示されるアプリケーションを「アプリケーション」フォルダにドラッグ＆ドロップします。</li>
              <li>「Control」キーを押しながら、アプリケーションアイコンを右クリックします。</li>
              <li>表示されたメニューから「開く」を選択します。</li>
              <li>確認ダイアログが表示されたら、再度「開く」をクリックします。</li>
            </ol>
             <p className="text-gray-700 leading-relaxed mt-4">
              上記の方法でも「ファイルが壊れています」というエラーが表示される場合や、起動できない場合は、以下のコマンドをターミナルで実行してみてください。
              ほとんどの場合、`sudo`は不要ですが、アクセス権の問題が発生した場合は、コマンドの前に`sudo `を追加して再試行してください。
            </p>
            <code className="block bg-gray-800 text-white p-3 rounded-lg my-3 text-sm">
              xattr -d com.apple.quarantine /Applications/syakitto.app
            </code>
            <p className="text-gray-700 leading-relaxed mt-3">
              これにより、次回以降は通常通りアプリケーションを起動できます。
            </p>
          </div>
          <div className="flex justify-center mt-8">
            <button
              onClick={onDownload}
              className="bg-[#5a8f7b] hover:bg-[#4d7a68] text-white font-bold py-3 px-8 rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-outline"
            >
              ダウンロード
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadModal;
