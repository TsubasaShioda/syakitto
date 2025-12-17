"use client";
import { useState } from "react";
import ToggleSwitch from "./ToggleSwitch";
import InfoButton from "./InfoButton";
import { Settings } from "@/app/settings";
import DrowsinessSettings from "./DrowsinessSettings";

interface DrowsinessDisplayProps {
  isDrowsinessDetectionEnabled: boolean;
  onToggleDrowsiness: () => void;
  ear: number;
  isDrowsy: boolean;
  onInfoClick: () => void;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

const DrowsinessDisplay = ({
  isDrowsinessDetectionEnabled,
  onToggleDrowsiness,
  ear,
  isDrowsy,
  onInfoClick,
  settings,
  setSettings,
}: DrowsinessDisplayProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  return (
    <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-[#c9b8a8]/30 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#5a8f7b]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">眠気検知</h3>
          <InfoButton onClick={onInfoClick} />
        </div>
        <ToggleSwitch isEnabled={isDrowsinessDetectionEnabled} onToggle={onToggleDrowsiness} />
      </div>

      {isDrowsinessDetectionEnabled ? (
        <>
          <div className={`rounded-2xl p-6 transition-colors duration-300 ${isDrowsy ? "bg-[#d4a59a]/30" : "bg-[#b8c9b8]/20"}`}>
            <p className={`text-6xl font-bold text-center transition-colors duration-300 ${isDrowsy ? "text-[#d4a59a]" : "text-[#5a8f7b]"}`}>
              {ear.toFixed(2)}
            </p>
          </div>
          <div className="mt-4 flex justify-center items-center">
            <div className="flex-1 text-center">
                <span className={`px-5 py-1.5 rounded-full text-sm font-semibold shadow-md transition-colors duration-300 ${isDrowsy ? "bg-[#d4a59a] text-white" : "bg-gray-200 text-gray-600"}`}>
                {isDrowsy ? "眠気を検知" : "覚醒"}
                </span>
            </div>
            {isDrowsinessDetectionEnabled && (
                <button onClick={() => setIsSettingsOpen(true)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200/50 absolute right-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </button>
            )}
          </div>
          {isSettingsOpen && (
            <div className="absolute top-16 right-0 w-full max-w-sm bg-white/80 backdrop-blur-md rounded-3xl shadow-2xl p-6 border border-[#c9b8a8]/40 z-10">
                <button
                    onClick={() => setIsSettingsOpen(false)}
                    className="absolute top-4 right-4 w-8 h-8 bg-[#c9b8a8]/30 hover:bg-[#c9b8a8]/50 text-gray-700 rounded-xl flex items-center justify-center transition-all duration-200"
                    aria-label="設定を閉じる"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                </button>
                <DrowsinessSettings settings={settings} setSettings={setSettings} />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">眠気検知はオフです</p>
        </div>
      )}
    </div>
  );
};

export default DrowsinessDisplay;
