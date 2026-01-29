/**
 * @file このファイルは、Next.jsアプリケーションのルートレイアウトを定義します。
 * すべてのページに共通する基本的なHTML構造（<html>, <body>タグなど）や、
 * メタデータ（タイトル、説明、ファビコン）、フォント、グローバルCSSの読み込みを担当します。
 *
 * 主な機能：
 * - `metadata`オブジェクト：ページのタイトルや説明、アイコンなどを設定。
 * - `next/font`：`Geist`フォントを効率的に読み込み、アプリケーション全体に適用。
 * - `globals.css`のインポート：アプリケーション共通のスタイルシートを適用。
 * - `children`プロパティのレンダリング：各ページの具体的なコンテンツがここに挿入されます。
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "syakitto",
  description: "リアルタイム姿勢チェッカー",
  icons: {
    icon: "/icons/syakitto_w_trans.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
