import { useEffect, useCallback } from 'react';
import { shortcuts, ShortcutKey } from '@/app/config/shortcuts';

type ShortcutHandler = (action: string) => void;

export const useKeyboardShortcuts = (
  handler: ShortcutHandler,
  options: {
    enabled?: boolean; // ショートカットを有効にするか
    ignoreInputs?: boolean; // input/textarea内では無効にするか
  } = {}
) => {
  const { enabled = true, ignoreInputs = true } = options;

  const matchShortcut = useCallback((event: KeyboardEvent, shortcut: ShortcutKey): boolean => {
    // キーの一致確認
    if (event.key !== shortcut.key) return false;

    // 修飾キーの確認（Ctrl/Cmd）
    const ctrlOrMeta = shortcut.ctrlKey || shortcut.metaKey;
    if (ctrlOrMeta && !(event.ctrlKey || event.metaKey)) return false;
    if (!ctrlOrMeta && (event.ctrlKey || event.metaKey)) return false;

    // Shiftキーの確認
    if (shortcut.shiftKey && !event.shiftKey) return false;
    if (!shortcut.shiftKey && event.shiftKey) return false;

    return true;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // input/textarea内では無効化
      if (ignoreInputs) {
        const target = event.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        }
      }

      // ショートカットとマッチするか確認
      for (const shortcut of shortcuts) {
        if (matchShortcut(event, shortcut)) {
          event.preventDefault();
          handler(shortcut.action);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, ignoreInputs, handler, matchShortcut]);
};
