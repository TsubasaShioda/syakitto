
import React from 'react';
import { Settings } from '@/types/electron-api.d';

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
