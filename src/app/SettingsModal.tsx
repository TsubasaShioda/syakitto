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
  // BGM related props
  currentBGM: string | null;
  isBGMPlaying: boolean;
  bgmVolume: number;
  playBGM: () => void;
  pauseBGM: () => void;
  selectBGM: (track: string) => void;
  setBGMVolume: (volume: number) => void;
  BGM_OPTIONS: { value: string; label: string }[];
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
  // BGM related props
  currentBGM,
  isBGMPlaying,
  bgmVolume,
  playBGM,
  pauseBGM,
  selectBGM,
  setBGMVolume,
  BGM_OPTIONS,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 bg-[#2d3436]/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 relative border border-[#c9b8a8]/40 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-[#c9b8a8]/30 hover:bg-[#c9b8a8]/50 text-gray-700 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110"
          aria-label="設定を閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-3xl font-bold text-[#5a8f7b] mb-8 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          設定
        </h2>
        <div className="space-y-6">
          <div className="bg-[#a8d5ba]/10 rounded-3xl p-6 border border-[#a8d5ba]/30 space-y-6">
            <h3 className="text-lg font-semibold text-[#5a8f7b] mb-4">猫背検知設定</h3>
            <div>
              <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-2">
                猫背と判断するスコア: <span className="font-bold text-[#5a8f7b]">{settings.threshold}%</span>
              </label>
              <input
                type="range"
                id="threshold"
                min="0"
                max="100"
                value={settings.threshold}
                onChange={(e) => setSettings(s => ({ ...s, threshold: Number(e.target.value) }))}
                className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba]"
              />
            </div>
            <div>
              <label htmlFor="delay" className="block text-sm font-medium text-gray-700 mb-2">
                この秒数続いたら通知: <span className="font-bold text-[#5a8f7b]">{settings.delay}秒</span>
              </label>
              <input
                type="range"
                id="delay"
                min="5"
                max="60"
                value={settings.delay}
                onChange={(e) => setSettings(s => ({ ...s, delay: Number(e.target.value) }))}
                className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba]"
              />
            </div>
          </div>

          {notificationType === 'voice' && (
            <div className="bg-[#b8c9b8]/10 rounded-3xl p-6 border border-[#b8c9b8]/30">
              <label htmlFor="notificationSound" className="block text-sm font-medium text-gray-700 mb-2">通知音</label>
              <select
                id="notificationSound"
                name="notificationSound"
                value={notificationSound}
                onChange={(e) => setNotificationSound(e.target.value)}
                className="mt-1 block w-full px-4 py-3 text-base border-[#c9b8a8]/30 bg-white/60 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#a8d5ba] focus:border-[#a8d5ba] rounded-2xl"
              >
                {SOUND_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-[#f4d06f]/10 rounded-3xl p-6 border border-[#f4d06f]/30">
            <label htmlFor="cooldownTime" className="block text-sm font-medium text-gray-700 mb-2">
              通知の間隔: <span className="font-bold text-[#d4a04f]">{settings.cooldownTime}秒</span>
            </label>
            <input
              type="range"
              id="cooldownTime"
              min="5"
              max="180"
              step="5"
              value={settings.cooldownTime}
              onChange={(e) => setSettings(s => ({ ...s, cooldownTime: Number(e.target.value) }))}
              className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#f4d06f]"
            />
          </div>

          <div className="bg-[#d4a59a]/10 rounded-3xl p-6 border border-[#d4a59a]/30">
            <label htmlFor="drowsinessDetection" className="flex items-center justify-between cursor-pointer text-gray-700 mb-4">
              <span className="text-lg font-semibold">眠気検知を有効にする</span>
              <input
                type="checkbox"
                id="drowsinessDetection"
                checked={isDrowsinessDetectionEnabled}
                onChange={(e) => setIsDrowsinessDetectionEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="relative w-11 h-6 bg-[#c9b8a8]/30 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#d4a59a]/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-[#c9b8a8] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4a59a]"></div>
            </label>
            {isDrowsinessDetectionEnabled && (
              <div className="pl-4 mt-4 space-y-6 border-l-2 border-[#d4a59a]/30">
                <div>
                  <label htmlFor="drowsinessEarThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                    目の開き具合のしきい値: <span className="font-bold text-[#d4a59a]">{settings.drowsinessEarThreshold.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    id="drowsinessEarThreshold"
                    min="0.05"
                    max="0.4"
                    step="0.01"
                    value={settings.drowsinessEarThreshold}
                    onChange={(e) => setSettings(s => ({ ...s, drowsinessEarThreshold: Number(e.target.value) }))}
                    className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#d4a59a]"
                  />
                </div>
                <div>
                  <label htmlFor="drowsinessTimeThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                    眠気と判断するまでの時間: <span className="font-bold text-[#d4a59a]">{settings.drowsinessTimeThreshold}秒</span>
                  </label>
                  <input
                    type="range"
                    id="drowsinessTimeThreshold"
                    min="1"
                    max="180"
                    step="1"
                    value={settings.drowsinessTimeThreshold}
                    onChange={(e) => setSettings(s => ({ ...s, drowsinessTimeThreshold: Number(e.target.value) }))}
                    className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#d4a59a]"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-[#a8b8d5]/10 rounded-3xl p-6 border border-[#a8b8d5]/30">
            <h3 className="text-lg font-semibold text-[#5a7b8f] mb-4">BGM設定</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="bgmTrack" className="block text-sm font-medium text-gray-700 mb-2">BGMを選択</label>
                <select
                  id="bgmTrack"
                  name="bgmTrack"
                  value={currentBGM || ''}
                  onChange={(e) => selectBGM(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 text-base border-[#c9b8a8]/30 bg-white/60 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#a8b8d5] focus:border-[#a8b8d5] rounded-2xl"
                >
                  <option value="">BGMなし</option>
                  {BGM_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={isBGMPlaying ? pauseBGM : playBGM}
                  className="px-6 py-3 bg-[#a8b8d5]/80 text-white rounded-2xl hover:bg-[#a8b8d5] transition-all duration-300 shadow-md font-semibold"
                >
                  {isBGMPlaying ? '一時停止' : '再生'}
                </button>
                <div className="flex-grow">
                  <label htmlFor="bgmVolume" className="block text-sm font-medium text-gray-700 mb-2">音量: <span className="font-bold text-[#5a7b8f]">{(bgmVolume * 100).toFixed(0)}%</span></label>
                  <input
                    type="range"
                    id="bgmVolume"
                    min="0"
                    max="1"
                    step="0.01"
                    value={bgmVolume}
                    onChange={(e) => setBGMVolume(Number(e.target.value))}
                    className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8b8d5]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-4">
            <button
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              className="px-6 py-3 bg-[#c9b8a8] text-white rounded-2xl hover:bg-[#b8a897] transition-all duration-300 shadow-md font-semibold"
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