/**
 * @file このファイルは、PostCSSの設定ファイルです。
 * PostCSSは、JavaScriptのプラグインを使ってCSSを変換するためのツールです。
 *
 * このプロジェクトでは、主にTailwind CSSをPostCSSプラグインとして登録するために使用されます。
 * `@tailwindcss/postcss`プラグインは、HTMLやJavaScriptファイル内のTailwindのクラス名をスキャンし、
 * 最終的に必要なCSSを生成する役割を担います。
 * これは、Tailwind CSSを利用するプロジェクトにおける標準的な設定です。
 */
const config = {
  plugins: ["@tailwindcss/postcss"],
};

export default config;
