"use client";

interface ScoreDisplayProps {
  slouchScore: number;
  borderColor: string;
  isDrowsinessDetectionEnabled: boolean;
  ear: number;
  isDrowsy: boolean;
}

const ScoreDisplay = ({ slouchScore, isDrowsinessDetectionEnabled, ear }: ScoreDisplayProps) => {
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
    <div className="space-y-6">
      <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-[#c9b8a8]/30 transition-all duration-300 hover:shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">猫背スコア</h3>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#5a8f7b]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <div className={`${getScoreBgColor(slouchScore)} rounded-3xl p-8`}>
          <p
            className="text-7xl font-bold text-center transition-all duration-500"
            style={{ color: getScoreColor(slouchScore) }}
          >
            {Math.round(slouchScore)}
            <span className="text-3xl ml-2">%</span>
          </p>
        </div>

        {/* プログレスバー */}
        <div className="mt-4 px-2">
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className="h-4 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-1"
              style={{
                width: `${Math.min(slouchScore, 100)}%`,
                backgroundColor: getScoreColor(slouchScore)
              }}
            >
              {slouchScore > 15 && (
                <div className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" />
              )}
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
            <span>0%</span>
            <span className="text-gray-400">良好</span>
            <span className="text-gray-400">注意</span>
            <span className="text-gray-400">要改善</span>
            <span>100%</span>
          </div>
        </div>

        <div className="mt-4 flex justify-center">
          <span
            className="px-6 py-2 rounded-full text-sm font-semibold shadow-md"
            style={{
              backgroundColor: getScoreColor(slouchScore),
              color: slouchScore >= 30 && slouchScore < 60 ? '#2d3436' : 'white'
            }}
          >
            {getScoreLabel(slouchScore)}
          </span>
        </div>
      </div>

      {isDrowsinessDetectionEnabled && (
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-8 shadow-lg border border-[#c9b8a8]/30 transition-all duration-300 hover:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">目の開き具合</h3>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#5a8f7b]">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            </svg>
          </div>
          <div className="bg-[#b8c9b8]/20 rounded-3xl p-8">
            <p className="text-7xl font-bold text-[#b8c9b8] text-center transition-all duration-500">
              {ear.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 text-center mt-4">EAR値</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;
