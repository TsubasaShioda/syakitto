import React from 'react';

interface DownloadPromptProps {
  onClose: () => void;
}

const DownloadPrompt: React.FC<DownloadPromptProps> = ({ onClose }) => {
  return (
    <div className="absolute top-0 right-16 w-[22.4rem] bg-gradient-to-br from-[#e0f2f1] to-[#d8efe8] rounded-2xl shadow-xl border border-white/50 p-4 text-gray-800 animate-fade-in-down z-20">
      {/* 突起 (arrow) のためのスタイル */}
      <style jsx>{`
        div::after {
          content: '';
          position: absolute;
          top: 15px; /* ボタンの高さに合わせて調整 */
          left: 100%;
          width: 0;
          height: 0;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-left: 8px solid #e0f2f1; /* 吹き出しの背景色と完全に一致させる */
        }
      `}</style>
      <div className="flex justify-between items-start">
        <p className="text-sm text-gray-700 leading-snug mr-2">
          より安定した体験と追加機能をご利用いただける無料のデスクトップ版（Mac/Win）がおすすめです。
        </p>
        <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            aria-label="閉じる"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
      </div>
    </div>
  );
};

export default DownloadPrompt;
