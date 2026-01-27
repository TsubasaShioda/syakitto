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
