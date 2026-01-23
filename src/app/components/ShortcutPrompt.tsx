import React from 'react';

interface ShortcutPromptProps {
  onClose: () => void;
}

const ShortcutPrompt: React.FC<ShortcutPromptProps> = ({ onClose }) => {
  return (
    <div className="absolute bottom-0 right-16 w-64 bg-gray-800 text-white rounded-lg shadow-xl p-4 animate-fade-in-up z-20">
      {/* 突起 (arrow) のためのスタイル */}
      <style jsx>{`
        div::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 100%;
          transform: translateY(-50%);
          width: 0;
          height: 0;
          border-top: 8px solid transparent;
          border-bottom: 8px solid transparent;
          border-left: 8px solid #1f2937; /* Tailwindのbg-gray-800の色 */
        }
      `}</style>
      <div className="flex justify-between items-start">
        <p className="text-sm leading-snug mr-2">
          ヒント: <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">⌘</kbd> + <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">K</kbd> でショートカット一覧を表示できます。
        </p>
        <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0"
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

export default ShortcutPrompt;
