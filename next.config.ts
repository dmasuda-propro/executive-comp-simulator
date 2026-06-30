import type { NextConfig } from "next";

// GitHub Pages(プロジェクトページ)向け静的エクスポート設定。
// 公開URL: https://dmasuda-propro.github.io/executive-comp-simulator/
const repo = "executive-comp-simulator";
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export", // 静的HTMLにエクスポート(out/)
  basePath: isProd ? `/${repo}` : "",
  assetPrefix: isProd ? `/${repo}/` : "",
  images: { unoptimized: true }, // 画像最適化サーバは使えないため無効化
  trailingSlash: true, // /simulator/ → /simulator/index.html でPages配信
};

export default nextConfig;
