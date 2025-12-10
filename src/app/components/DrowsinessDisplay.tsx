"use client";

import ToggleSwitch from "./ToggleSwitch";
import InfoButton from "./InfoButton";

interface DrowsinessDisplayProps {
  isDrowsinessDetectionEnabled: boolean;
  onToggleDrowsiness: () => void;
  ear: number;
  isDrowsy: boolean;
  onInfoClick: () => void;
}

const DrowsinessDisplay = ({
  isDrowsinessDetectionEnabled,
  onToggleDrowsiness,
  ear,
  isDrowsy,
  onInfoClick,
}: DrowsinessDisplayProps) => {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-[#c9b8a8]/30 transition-all duration-300 hover:shadow-xl">
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
          <div className="mt-4 text-center">
            <span className={`px-5 py-1.5 rounded-full text-sm font-semibold shadow-md transition-colors duration-300 ${isDrowsy ? "bg-[#d4a59a] text-white" : "bg-gray-200 text-gray-600"}`}>
              {isDrowsy ? "眠気を検知" : "覚醒"}
            </span>
          </div>
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
