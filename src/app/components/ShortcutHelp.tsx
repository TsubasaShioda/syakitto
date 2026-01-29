/**
 * @file このファイルは、アプリケーションで利用可能なキーボードショートカットの一覧をモーダルダイアログで表示するReactコンポーネントです。
 *
 * 主な機能：
 * - `../config/shortcuts`からショートカット定義をインポートし、一元管理を実現。
 * - ショートカットをカテゴリー別にグループ化して表示し、可読性を向上。
 * - ユーザーのOS（Mac/その他）を判別し、適切な修飾キー（⌘/Ctrl）を表示。
 * - クリックやEscキーでモーダルを閉じることができる、使いやすいUIを提供。
 *
 * @component ShortcutHelp
 * @param {boolean} isOpen - モーダルが開いているかどうか。
 * @param {() => void} onClose - モーダルを閉じるためのコールバック関数。
 *
 * @returns {JSX.Element | null} モーダルが開いている場合は、ショートカット一覧のUIを返します。開いていない場合はnullを返します。
 */
"use client";
import { shortcuts, categoryLabels, ShortcutKey } from '../config/shortcuts';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const ShortcutHelp = ({ isOpen, onClose }: Props) => {
  if (!isOpen) return null;

  // カテゴリーごとにショートカットをグループ化
  const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<ShortcutKey['category'], ShortcutKey[]>);

  const formatKey = (shortcut: ShortcutKey): string => {
    const keys: string[] = [];

    // Mac判定（userAgentで簡易的に）
    const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent);

    if (shortcut.ctrlKey || shortcut.metaKey) {
      keys.push(isMac ? '⌘' : 'Ctrl');
    }
    if (shortcut.shiftKey) {
      keys.push('Shift');
    }

    let displayKey = shortcut.key;
    if (displayKey === ' ') displayKey = 'Space';
    if (displayKey === 'Escape') displayKey = 'Esc';
    keys.push(displayKey.toUpperCase());

    return keys.join(' + ');
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            ショートカットキー一覧
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="閉じる"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ショートカット一覧 */}
        <div className="space-y-6">
          {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">
                {categoryLabels[category as ShortcutKey['category']]}
              </h3>
              <div className="space-y-2">
                {categoryShortcuts.map((shortcut, index) => (
                  <div
                    key={`${category}-${index}`}
                    className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded"
                  >
                    <span className="text-gray-700">{shortcut.description}</span>
                    <kbd className="px-3 py-1 bg-gray-200 text-gray-800 rounded font-mono text-sm">
                      {formatKey(shortcut)}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* フッター */}
        <div className="mt-6 pt-4 border-t text-center text-sm text-gray-500">
          Esc キーでこのヘルプを閉じることができます
        </div>
      </div>
    </div>
  );
};

export default ShortcutHelp;
