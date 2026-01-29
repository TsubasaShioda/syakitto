/**
 * @file このファイルは、JavaScript/TypeScriptコードの静的解析ツールであるESLintの設定ファイルです。
 * 新しい「フラット設定」形式（`eslint.config.js`）で記述されています。
 *
 * 主な責務：
 * - `@eslint/eslintrc`の`FlatCompat`を使い、従来の`extends`形式の設定（`"next/core-web-vitals"`など）との互換性を確保する。
 * - Next.jsフレームワークが推奨するESLintルールセットを継承し、プロジェクトのコードがNext.jsのベストプラクティスに準拠するようにする。
 * - `node_modules`やビルド成果物（`.next`, `out`など）のように、ESLintの解析対象から除外するファイルやディレクトリを指定する。
 */
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
