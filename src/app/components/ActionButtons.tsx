/**
 * @file このファイルは、アプリケーションの特定のアクションを実行するためのボタングループを定義するReactコンポーネントです。
 * 現在は、Web版でインストーラーをダウンロードするためのボタンを主に表示します。
 *
 * @component ActionButtons
 * @param {() => void} onDownload - ダウンロードボタンがクリックされたときに実行されるコールバック関数。
 * @param {boolean} isElectron - アプリケーションがElectron環境で実行されているかどうかを示すフラグ。
 * @param {React.ReactNode} [children] - 追加のカスタムボタン要素。
 *
 * @returns {JSX.Element} ダウンロードボタンやその他のアクションボタンを含むコンテナ要素。
 * `isElectron`がfalseの場合にのみ、ダウンロードボタンが表示されます。
 */
"use client";

import React from 'react';

interface ActionButtonsProps {
  onDownload: () => void;
  isElectron: boolean;
  children?: React.ReactNode;
}

const ActionButtons = ({ onDownload, isElectron, children }: ActionButtonsProps) => {
  return (
    <div className="fixed top-6 right-6 flex flex-col items-end gap-3 z-10">
      {!isElectron && (
        <div className="relative flex items-center">
          <button
            onClick={onDownload}
            className="peer w-14 h-14 bg-white/80 backdrop-blur-sm text-[#5a8f7b] rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-[#a8d5ba]/40 transition-all duration-300 transform hover:scale-110 border border-[#c9b8a8]/30"
            aria-label="macOS版をダウンロード"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 group-hover:scale-110 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
          <span className="absolute right-16 w-auto whitespace-nowrap p-2 px-3 bg-white text-[#5a8f7b] text-sm font-bold rounded-md shadow-lg opacity-0 peer-hover:opacity-100 transition-opacity duration-300">
            インストーラー
          </span>
          {children}
        </div>
      )}
    </div>
  );
};

export default ActionButtons;
