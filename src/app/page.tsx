"use client";

import dynamic from 'next/dynamic';

// TensorFlowなどブラウザ専用ライブラリを含むコンポーネントを
// クライアントサイドのみでロード（SSR/静的エクスポート時のエラー回避）
const HomeContent = dynamic(() => import('./HomeContent'), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen flex items-center justify-center bg-[#f7f2ee]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3b82f6] mx-auto mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    </main>
  ),
});

export default function Home() {
  return <HomeContent />;
}
