
import React from 'react';
import { Settings } from '@/app/settings';

interface PostureSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const PostureSettings: React.FC<PostureSettingsProps> = ({ settings, setSettings }) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-[#5a8f7b] mb-4">猫背検知設定</h3>
      <div className="space-y-4">
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
    </div>
  );
};

export default PostureSettings;
