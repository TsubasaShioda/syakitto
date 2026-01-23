import React from 'react';
import { Settings } from '@/electron-api.d';

interface NotificationSettingsProps {
    settings: Settings;
    setSettings: (settings: Partial<Settings>) => void;
    notificationSound: string;
    setNotificationSound: (sound: string) => void;
    SOUND_OPTIONS: { value: string; label: string }[];
    notificationType: string;
    animationType: string;
    setAnimationType: (type: string) => void;
    onOpenAdvancedSettings: () => void; // New prop
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ 
    settings, 
    setSettings,
    notificationSound,
    setNotificationSound,
    SOUND_OPTIONS,
    notificationType,
    animationType,
    setAnimationType,
    onOpenAdvancedSettings // Destructure new prop
}) => {
  const animationOptions = [
    { value: 'toggle', label: 'ポップアップアイコン' },
    { value: 'cat_hand', label: '猫の手' },
    { value: 'noise', label: '砂嵐' },
    { value: 'dimmer', label: 'ダークオーバーレイ' },
  ];

  return (
    <>
      <div className="space-y-4 pt-4">
          {notificationType === 'animation' && (
          <div className="bg-[#a8d5ba]/10 rounded-3xl p-4 border border-[#a8d5ba]/30">
              <label htmlFor="animationType" className="block text-sm font-medium text-gray-700 mb-2">アニメーションの種類</label>
              <select
              id="animationType"
              name="animationType"
              value={animationType}
              onChange={(e) => setAnimationType(e.target.value)}
              className="mt-1 block w-full px-4 py-3 text-base border-[#c9b8a8]/30 bg-white/60 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#a8d5ba] focus:border-[#a8d5ba] rounded-2xl"
              >
              {animationOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
              ))}
              </select>
          </div>
          )}
          <div className="bg-[#f4d06f]/10 rounded-3xl p-4 border border-[#f4d06f]/30">
          <label htmlFor="cooldownTime" className="block text-sm font-medium text-gray-700 mb-2">
              通知の間隔: <span className="font-bold text-[#d4a04f]">{settings.threshold.cooldownTime}秒</span>
          </label>
          <input
              type="range"
              id="cooldownTime"
              min="5"
              max="180"
              step="5"
              value={settings.threshold.cooldownTime || 0}
              onChange={(e) => setSettings({ threshold: { ...settings.threshold, cooldownTime: Number(e.target.value) } })}
              className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#f4d06f]"
          />
          </div>
          {notificationType === 'voice' && (
          <div className="bg-[#b8c9b8]/10 rounded-3xl p-4 border border-[#b8c9b8]/30">
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
          {notificationType === 'desktop' && (
              <div className="text-center pt-2">
                  <button 
                      onClick={onOpenAdvancedSettings} // Use new prop
                      className="bg-[#a8d5ba] text-white text-sm font-semibold py-2 px-4 rounded-xl hover:bg-[#5a8f7b] transition-colors shadow-md text-outline"
                  >
                      通知の設定方法とテスト
                  </button>
              </div>
          )}
      </div>
    </>
  );
};

export default NotificationSettings;
