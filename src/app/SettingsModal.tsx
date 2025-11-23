// src/app/SettingsModal.tsx
import React from 'react';

export interface Settings {
  threshold: number;
  delay: number;
  reNotificationMode: 'cooldown' | 'continuous';
  cooldownTime: number;
  continuousInterval: number;
  drowsinessEarThreshold: number;
  drowsinessTimeThreshold: number;
}

export const DEFAULT_SETTINGS: Settings = {
  threshold: 40, // %
  delay: 5, // seconds
  reNotificationMode: 'cooldown',
  cooldownTime: 60, // seconds
  continuousInterval: 10,
  drowsinessEarThreshold: 0.2,
  drowsinessTimeThreshold: 2, // seconds
};

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return [r, g, b];
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  isDrowsinessDetectionEnabled: boolean;
  setIsDrowsinessDetectionEnabled: (enabled: boolean) => void;
  notificationType: string;
  notificationSound: string;
  setNotificationSound: (sound: string) => void;
  SOUND_OPTIONS: { value: string; label: string }[];
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  setSettings,
  isDrowsinessDetectionEnabled,
  setIsDrowsinessDetectionEnabled,
  notificationType,
  notificationSound,
  setNotificationSound,
  SOUND_OPTIONS,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600"
          aria-label="設定を閉じる"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">設定</h2>
        <div className="space-y-6">
          <div className="border-t border-gray-700 pt-4 space-y-4">
            <div>
              <label htmlFor="threshold" className="block text-sm font-medium text-gray-300">
                猫背と判断するスコア: <span className="font-bold text-blue-400">{settings.threshold}%</span>
              </label>
              <input
                type="range"
                id="threshold"
                min="0"
                max="100"
                value={settings.threshold}
                onChange={(e) => setSettings(s => ({ ...s, threshold: Number(e.target.value) }))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
              />
            </div>
            <div>
              <label htmlFor="delay" className="block text-sm font-medium text-gray-300">この秒数続いたら通知: <span className="font-bold text-blue-400">{settings.delay}秒</span></label>
              <input
                type="range"
                id="delay"
                min="5"
                max="60"
                value={settings.delay}
                onChange={(e) => setSettings(s => ({ ...s, delay: Number(e.target.value) }))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
              />
            </div>
          </div>

          {notificationType === 'voice' && (
            <div className="border-t border-gray-700 pt-4">
              <label htmlFor="notificationSound" className="block text-sm font-medium text-gray-300">通知音</label>
              <select
                id="notificationSound"
                name="notificationSound"
                value={notificationSound}
                onChange={(e) => setNotificationSound(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                {SOUND_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="cooldownTime" className="block text-sm font-medium text-gray-300">通知の間隔: <span className="font-bold text-blue-400">{settings.cooldownTime}秒</span></label>
            <input
              type="range"
              id="cooldownTime"
              min="5"
              max="180"
              step="5"
              value={settings.cooldownTime}
              onChange={(e) => setSettings(s => ({ ...s, cooldownTime: Number(e.target.value) }))}
              className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
            />
          </div>

          <div className="border-t border-gray-700 pt-4">
            <label htmlFor="drowsinessDetection" className="flex items-center justify-between cursor-pointer text-gray-300">
              <span>眠気検知を有効にする</span>
              <input
                type="checkbox"
                id="drowsinessDetection"
                checked={isDrowsinessDetectionEnabled}
                onChange={(e) => setIsDrowsinessDetectionEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
            {isDrowsinessDetectionEnabled && (
              <div className="pl-4 mt-4 space-y-4 border-l border-gray-600">
                <div>
                  <label htmlFor="drowsinessEarThreshold" className="block text-sm font-medium text-gray-300">
                    目の開き具合のしきい値: <span className="font-bold text-blue-400">{settings.drowsinessEarThreshold.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    id="drowsinessEarThreshold"
                    min="0.05"
                    max="0.4"
                    step="0.01"
                    value={settings.drowsinessEarThreshold}
                    onChange={(e) => setSettings(s => ({ ...s, drowsinessEarThreshold: Number(e.target.value) }))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
                  />
                </div>
                <div>
                  <label htmlFor="drowsinessTimeThreshold" className="block text-sm font-medium text-gray-300">
                    眠気と判断するまでの時間: <span className="font-bold text-blue-400">{settings.drowsinessTimeThreshold}秒</span>
                  </label>
                  <input
                    type="range"
                    id="drowsinessTimeThreshold"
                    min="1"
                    max="180"
                    step="1"
                    value={settings.drowsinessTimeThreshold}
                    onChange={(e) => setSettings(s => ({ ...s, drowsinessTimeThreshold: Number(e.target.value) }))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 pt-6 flex items-center justify-end">
            <button
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
            >
              設定をリセット
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
