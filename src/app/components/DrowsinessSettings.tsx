
import React from 'react';
import { Settings } from '@/app/settings';

interface DrowsinessSettingsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const DrowsinessSettings: React.FC<DrowsinessSettingsProps> = ({ settings, setSettings }) => {
  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold text-[#5a8f7b] mb-4">眠気検知設定</h3>
      <div className="space-y-4">
        <div>
            <label htmlFor="drowsinessEarThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                眠気と判断するEAR: <span className="font-bold text-[#5a8f7b]">{settings.drowsinessEarThreshold.toFixed(2)}</span>
            </label>
            <input
                type="range"
                id="drowsinessEarThreshold"
                min="0.1"
                max="0.4"
                step="0.01"
                value={settings.drowsinessEarThreshold}
                onChange={(e) => setSettings(s => ({ ...s, drowsinessEarThreshold: Number(e.target.value) }))}
                className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba]"
            />
        </div>
        <div>
            <label htmlFor="drowsinessTimeThreshold" className="block text-sm font-medium text-gray-700 mb-2">
                この秒数続いたら通知: <span className="font-bold text-[#5a8f7b]">{settings.drowsinessTimeThreshold}秒</span>
            </label>
            <input
                type="range"
                id="drowsinessTimeThreshold"
                min="1"
                max="10"
                value={settings.drowsinessTimeThreshold}
                onChange={(e) => setSettings(s => ({ ...s, drowsinessTimeThreshold: Number(e.target.value) }))}
                className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba]"
            />
        </div>
      </div>
    </div>
  );
};

export default DrowsinessSettings;
