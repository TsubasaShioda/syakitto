"use client";

import React from 'react';

type Props = {
  onClick: () => void;
  children?: React.ReactNode;
};

const ShortcutButton = ({ onClick, children }: Props) => {
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="relative flex items-center">
        <button
          onClick={onClick}
          className="w-12 h-12 bg-white hover:bg-gray-100 text-[#2d3436] rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 border border-gray-200"
          aria-label="ショートカットキー一覧を表示"
          title="ショートカットキー一覧 (Ctrl+K / ⌘K)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
};

export default ShortcutButton;
