/**
 * @file このファイルは、ユーザーが選択した通知タイプに応じた詳細設定項目を定義するReactコンポーネントです。
 * `NotificationSelector`コンポーネントの子として使用されます。
 *
 * - 通知タイプが`'animation'`の場合：アニメーションの種類を選択するドロップダウンを表示します。
 * - 通知タイプが`'voice'`の場合：通知音を選択するドロップダウンを表示します。
 * - 通知タイプが`'desktop'`の場合：OSやブラウザレベルの詳細設定モーダルを開くためのボタンを表示します。
 *
 * @component NotificationSettings
 * @param {Settings} settings - アプリケーション全体の設定オブジェクト。
 * @param {(settings: Partial<Settings>) => void} setSettings - 設定を更新するためのコールバック関数。
 * @param {string} notificationSound - 現在選択されている通知音。
 * @param {(sound: string) => void} setNotificationSound - 通知音を変更するためのコールバック関数。
 * @param {{ value: string; label: string }[]} SOUND_OPTIONS - 選択可能な通知音のリスト。
 * @param {string} notificationType - 現在選択されている通知タイプ。
 * @param {string} animationType - 現在選択されているアニメーションの種類。
 * @param {(type: string) => void} setAnimationType - アニメーションの種類を変更するためのコールバック関数。
 * @param {() => void} onOpenAdvancedSettings - 詳細な通知設定モーダルを開くためのコールバック関数。
 *
 * @returns {JSX.Element} 選択された通知タイプに応じた設定UI。
 */
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
