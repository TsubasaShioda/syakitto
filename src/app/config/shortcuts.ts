// ショートカットキーの型定義
export type ShortcutKey = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean; // Mac用のCmd
  shiftKey?: boolean;
  description: string;
  category: 'general' | 'timer' | 'posture' | 'notification' | 'settings';
  action: string; // アクション名（識別子）
};

// ショートカットキーの定義
export const shortcuts: ShortcutKey[] = [
  // 一般操作
  {
    key: 'k',
    ctrlKey: true,
    metaKey: true,
    description: 'ショートカットキー一覧を表示',
    category: 'general',
    action: 'SHOW_SHORTCUTS'
  },
  {
    key: 'Escape',
    description: 'モーダル/ダイアログを閉じる',
    category: 'general',
    action: 'CLOSE_MODAL'
  },

  // タイマー関連
  {
    key: ' ', // Space
    description: 'タイマー開始/一時停止',
    category: 'timer',
    action: 'TOGGLE_TIMER'
  },
  {
    key: '1',
    description: '作業セッションに切り替え',
    category: 'timer',
    action: 'SESSION_WORK'
  },
  {
    key: '2',
    description: '短い休憩に切り替え',
    category: 'timer',
    action: 'SESSION_SHORT_BREAK'
  },
  {
    key: '3',
    description: '長い休憩に切り替え',
    category: 'timer',
    action: 'SESSION_LONG_BREAK'
  },
  {
    key: 'r',
    description: 'タイマーをリセット',
    category: 'timer',
    action: 'RESET_TIMER'
  },

  // 姿勢検知
  {
    key: 's',
    description: '姿勢検知のon/off切り替え',
    category: 'posture',
    action: 'TOGGLE_SLOUCH_DETECTION'
  },
  {
    key: 'c',
    description: 'カメラ表示/非表示',
    category: 'posture',
    action: 'TOGGLE_CAMERA'
  },
  {
    key: 'C',
    shiftKey: true,
    description: 'キャリブレーション実行',
    category: 'posture',
    action: 'CALIBRATE'
  },
  {
    key: 'p',
    description: 'カメラ一時停止/再開',
    category: 'posture',
    action: 'TOGGLE_PAUSE'
  },

  // 通知
  {
    key: 'n',
    description: '通知設定を開く',
    category: 'notification',
    action: 'OPEN_NOTIFICATION_SETTINGS'
  },

  // 設定
  {
    key: ',',
    description: '設定パネルを開く',
    category: 'settings',
    action: 'OPEN_SETTINGS'
  }
];

// カテゴリー名の日本語マッピング
export const categoryLabels: Record<ShortcutKey['category'], string> = {
  general: '一般',
  timer: 'タイマー',
  posture: '姿勢検知',
  notification: '通知',
  settings: '設定'
};
