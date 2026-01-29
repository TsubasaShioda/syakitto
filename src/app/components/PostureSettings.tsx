/**
 * @file このファイルは、姿勢検出に関連する設定項目を定義するReactコンポーネントです。
 * ユーザーはスライダーを使って以下の2つの値を調整できます。
 * 1. 猫背判定のしきい値：どの程度姿勢が悪化したら「猫背」と判定するかの感度。
 * 2. 通知までの秒数：猫背状態が何秒続いたら通知を発するか。
 *
 * @component PostureSettings
 * @param {Settings} settings - 現在のアプリケーション設定オブジェクト。
 * @param {(settings: Partial<Settings>) => void} setSettings - 設定を更新するためのコールバック関数。
 *
 * @returns {JSX.Element} 姿勢設定用のスライダーを含むコンテナ要素。
 */

import React from 'react';
import { Settings } from '@/electron-api.d';

interface PostureSettingsProps {
  settings: Settings;
  setSettings: (settings: Partial<Settings>) => void;
}

const PostureSettings: React.FC<PostureSettingsProps> = ({ settings, setSettings }) => {
  return (
    <div className="w-full">
      <div className="space-y-4">
        <div>
          <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 mb-2">
            猫背判定のしきい値: <span className="font-bold text-[#5a8f7b]">{settings.threshold.slouch}%</span>
          </label>
          <input
            type="range"
            id="threshold"
            min="0"
            max="100"
            value={settings.threshold.slouch}
            onChange={(e) => setSettings({ threshold: { ...settings.threshold, slouch: Number(e.target.value) } })}
            className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba]"
          />
        </div>
        <div>
          <label htmlFor="delay" className="block text-sm font-medium text-gray-700 mb-2">
            通知までの秒数: <span className="font-bold text-[#5a8f7b]">{settings.threshold.duration}秒</span>
          </label>
          <input
            type="range"
            id="delay"
            min="5"
            max="60"
            value={settings.threshold.duration}
            onChange={(e) => setSettings({ threshold: { ...settings.threshold, duration: Number(e.target.value) } })}
            className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba]"
          />
        </div>
      </div>
    </div>
  );
};

export default PostureSettings;
