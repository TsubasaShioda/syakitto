/**
 * @file このファイルは、Reactの標準の型定義を拡張するためのTypeScript宣言ファイルです。
 *
 * `react`ライブラリの`CSSProperties`インターフェースに、
 * Electronのフレームレスウィンドウでウィンドウのドラッグ可能な領域を指定するための非標準CSSプロパティ
 * `WebkitAppRegion`を追加しています。
 *
 * これにより、TypeScript環境でReactコンポーネントのstyle属性に`WebkitAppRegion`を使用しても、
 * 型エラーが発生しなくなります。
 */
import 'react';

declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
  }
}