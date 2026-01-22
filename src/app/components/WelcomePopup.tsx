"use client";

import { useState } from "react";
import Image from "next/image";

interface WelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const WelcomePopup = ({ isOpen, onClose }: WelcomePopupProps) => {
  const [page, setPage] = useState(0);

  const pages = [
    {
      title: "Syakittoへようこそ！",
      content: "Syakittoは、webカメラのみでリアルタイムであなたの姿勢をモニタリングします。",
      image: "/images/welcome.png", 
    },
    {
      title: "猫背検知",
      content: "肩と耳の位置、そして顔の大きさを検知することで猫背を判断します。",
      image: "/images/posture.png",
    },

    {
        title: "さあ、始めましょう！",
        content: "「はじめる」ボタンをクリックして、Syakittoで健康的な作業習慣を身につけましょう！",
        image: "/images/start.png",
    }
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-[#2d3436]/60 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 relative border border-gray-200" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-2xl font-bold text-[#5a8f7b] mb-4">
          {pages[page].title}
        </h2>
        {pages[page].image && (
          <div className="my-4">
            <Image src={pages[page].image} alt={pages[page].title} width={500} height={300} className="w-full h-48 object-contain" />
          </div>
        )}
        <p className="text-gray-700 leading-relaxed" style={{ minHeight: '8rem' }}>
          {pages[page].content}
        </p>

        <div className="mt-6 flex justify-between items-center">
            <div className="flex gap-2">
                {pages.map((_, index) => (
                    <button
                    key={index}
                    onClick={() => setPage(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${page === index ? 'bg-[#5a8f7b]' : 'bg-gray-200 hover:bg-[#5a8f7b]/50'}`}
                    />
                ))}
            </div>

            <div className="flex gap-4">
                {page > 0 && (
                    <button
                        onClick={() => setPage(page - 1)}
                        className="text-gray-600 px-6 py-2 rounded-xl hover:bg-gray-200 transition-colors"
                    >
                        戻る
                    </button>
                )}
                {page < pages.length - 1 && (
                    <button
                        className="bg-[#5a8f7b] text-white px-6 py-2 rounded-xl hover:bg-[#4a7f6b] transition-colors"
                    >
                        次へ
                    </button>
                )}
                {page === pages.length - 1 && (
                    <button
                        onClick={onClose}
                        className="bg-[#5a8f7b] text-white px-6 py-2 rounded-xl hover:bg-[#4a7f6b] transition-colors"
                    >
                        はじめる
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomePopup;

