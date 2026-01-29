/**
 * @file このファイルは、アプリケーション全体で再利用可能な汎用的な情報モーダルダイアログを定義するReactコンポーネントです。
 * モーダルの基本的な骨格（背景のオーバーレイ、コンテンツエリア、タイトル、閉じるボタン）を提供し、
 * 表示したい具体的な内容は`children`プロパティ経由で受け取ります。
 * これにより、アプリケーション全体で一貫したデザインのモーダルを簡単に実装できます。
 *
 * @component InfoModal
 * @param {boolean} isOpen - モーダルが開いているかどうか。
 * @param {() => void} onClose - モーダルを閉じるためのコールバック関数。背景オーバーレイのクリックでも呼び出されます。
 * @param {string} title - モーダルのタイトル。
 * @param {React.ReactNode} children - モーダルの本体として表示されるコンテンツ。
 *
 * @returns {JSX.Element | null} モーダルが開いている場合は、モーダルダイアログのUIを返します。開いていない場合はnullを返します。
 */
"use client";

import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const InfoModal = ({ isOpen, onClose, title, children }: InfoModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-[#2d3436]/60 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 relative border border-[#c9b8a8]/40 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
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
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          {title}
        </h2>
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default InfoModal;

