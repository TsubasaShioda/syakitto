/**
 * @file このファイルは、Next.jsアプリケーションのビルド設定を構成します。
 * 主に、ビルドターゲット（Webサーバー用かElectron用か）に応じて設定を動的に切り替える役割を担います。
 *
 * - `BUILD_TARGET`環境変数が`'electron'`の場合：
 *   - `output: "export"`: アプリケーションを静的なHTML/CSS/JSファイルとしてエクスポートします。これにより、Electronアプリにバンドルしてローカルで実行できるようになります。
 *   - `images: { unoptimized: true }`: Next.jsの画像最適化APIを無効にします。これは、ローカルファイルシステムから静的に配信する場合、Next.jsの画像最適化サーバーが利用できないためです。
 * - それ以外の場合（例：Vercelへのデプロイ）：
 *   - Next.jsのデフォルト設定（サーバーサイドレンダリング、画像最適化など）が使用されます。
 */
import type { NextConfig } from "next";

const isElectron = process.env.BUILD_TARGET === "electron";

const nextConfig: NextConfig = {
  // Electron版のみ静的エクスポート（Vercelでは不要）
  ...(isElectron && {
    output: "export",
    images: {
      unoptimized: true,
    },
  }),
};

export default nextConfig;
