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
