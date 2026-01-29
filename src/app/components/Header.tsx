/**
 * @file このファイルは、アプリケーションのメインヘッダー部分を定義するReactコンポーネントです。
 * アプリケーションのロゴ、タイトル、そして短い説明文を表示します。
 *
 * 主な機能：
 * - アプリケーションのブランディングを視覚的に表現するロゴとタイトル。
 * - Google Fontsから読み込んだカスタムフォント「Righteous」をタイトルに適用。
 * - タイトルテキストにグラデーション効果を適用し、視覚的な魅力を高める。
 * - アプリケーションの目的を簡潔に伝えるサブタイトル。
 *
 * @component Header
 * @returns {JSX.Element} アプリケーションのロゴ、タイトル、サブタイトルを含むヘッダー要素。
 */
"use client";

import Image from 'next/image';
import { Righteous } from 'next/font/google';

const righteous = Righteous({
  weight: '400',
  subsets: ['latin'],
});

const Header = () => (
  <header className="mb-6 text-center">
    <div className="flex items-center justify-center gap-3 mb-2">
      <Image
        src="/images/syakitto_logo.png"
        alt="syakitto logo"
        width={48}
        height={48}
        className="rounded-lg"
      />
      <h1 className={`text-4xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#10b981] bg-clip-text text-transparent ${righteous.className}`}>
        syakitto
      </h1>
    </div>
    <p className="text-gray-600 text-sm">リアルタイム姿勢チェッカー - あなたの健康をサポート</p>
  </header>
);

export default Header;
