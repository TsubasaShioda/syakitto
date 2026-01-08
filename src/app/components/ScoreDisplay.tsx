"use client";
import ToggleSwitch from "./ToggleSwitch";
import InfoButton from "./InfoButton";


interface ScoreDisplayProps {
  slouchScore: number;
  isSlouchDetectionEnabled: boolean;
  onToggleSlouch: () => void;
  onInfoClick: () => void;
  onSettingsClick: () => void;
}

const ScoreDisplay = ({
  slouchScore,
  isSlouchDetectionEnabled,
  onToggleSlouch,
  onInfoClick,
  onSettingsClick,
}: ScoreDisplayProps) => {

  const getScoreColor = (score: number) => {
    if (score < 30) return "#a8d5ba";
    if (score < 60) return "#f4d06f";
    return "#d4a59a";
  };

  const getScoreLabel = (score: number) => {
    if (score < 30) return "良好";
    if (score < 60) return "注意";
    return "要改善";
  };

  const getScoreBgColor = (score: number) => {
    if (score < 30) return "bg-[#a8d5ba]/20";
    if (score < 60) return "bg-[#f4d06f]/20";
    return "bg-[#d4a59a]/20";
  };

  return (
    <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-[#c9b8a8]/30 transition-all duration-300 hover:shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#5a8f7b]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700">猫背スコア</h3>
          <InfoButton onClick={onInfoClick} />
        </div>
        <ToggleSwitch isEnabled={isSlouchDetectionEnabled} onToggle={onToggleSlouch} />
      </div>

      {isSlouchDetectionEnabled ? (
        <>
          <div className={`${getScoreBgColor(slouchScore)} rounded-2xl p-6`}>
            <p
              className="text-6xl font-bold text-center transition-all duration-500"
              style={{ color: getScoreColor(slouchScore) }}
            >
              {Math.round(slouchScore)}
              <span className="text-2xl ml-2">%</span>
            </p>
          </div>

          <div className="mt-4 px-1">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className="h-3 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${Math.min(slouchScore, 100)}%`,
                  backgroundColor: getScoreColor(slouchScore),
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="mt-4 flex justify-center items-center">
            <div className="flex-1 text-center">
                <span
                className="px-5 py-1.5 rounded-full text-sm font-semibold shadow-md"
                style={{
                    backgroundColor: getScoreColor(slouchScore),
                    color: slouchScore >= 30 && slouchScore < 60 ? '#2d3436' : 'white',
                }}
                >
                {getScoreLabel(slouchScore)}
                </span>
            </div>
            {isSlouchDetectionEnabled && (
                <button onClick={onSettingsClick} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200/50 absolute right-6">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                </button>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-gray-500">猫背検知はオフです</p>
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;

