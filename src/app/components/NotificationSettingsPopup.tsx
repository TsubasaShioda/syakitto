"use client";

import { useState } from "react";

interface NotificationSettingsPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationSettingsPopup = ({ isOpen, onClose }: NotificationSettingsPopupProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-[#2d3436]/60 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 relative border border-[#c9b8a8]/40" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-[#5a8f7b] mb-4">
          デスクトップ通知の受け取り方
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Syakittoでは、姿勢が悪くなった際にデスクトップ通知を受け取ることができます。以下の手順で通知をオンにしてください。<br /><strong>システム設定＞通知＞お使いのブラウザ＞通知を許可</strong>
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#5a8f7b] text-white px-6 py-2 rounded-xl hover:bg-[#4a7f6b] transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPopup;
