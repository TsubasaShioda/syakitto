"use client";

import { useMemo } from "react";
import { ScoreHistory } from "@/app/usePoseDetection";

const PostureReport = ({ scoreHistory, isRecordingEnabled, setIsRecordingEnabled }: { scoreHistory: ScoreHistory[], isRecordingEnabled: boolean, setIsRecordingEnabled: (enabled: boolean) => void }) => {
  const stats = useMemo(() => {
    if (scoreHistory.length === 0) {
      return {
        averageScore: 0,
        maxScore: 0,
        totalTime: 0,
      };
    }

    const totalScore = scoreHistory.reduce((sum, item) => sum + item.score, 0);
    const averageScore = totalScore / scoreHistory.length;
    const maxScore = Math.max(...scoreHistory.map(item => item.score));
    const totalTime = scoreHistory.length > 1 ? scoreHistory[scoreHistory.length - 1].time - scoreHistory[0].time : 0;

    return { averageScore, maxScore, totalTime };
  }, [scoreHistory]);

  const formatDuration = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}分 ${seconds}秒`;
  };

  const handleExportCsv = () => {
    if (scoreHistory.length === 0) {
      alert("エクスポートするデータがありません。");
      return;
    }

    const headers = ["time", "score"];
    const data = scoreHistory.map(item => 
      [new Date(item.time).toISOString(), item.score.toFixed(2)].join(',')
    );

    const csvContent = [
      headers.join(','),
      ...data
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const date = new Date().toISOString().split('T')[0];
    link.setAttribute("href", url);
    link.setAttribute("download", `posture-report-${date}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const LineChart = () => {
    const width = 500;
    const height = 150;
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (scoreHistory.length < 2) {
      return <div className="flex items-center justify-center h-[150px] text-gray-500">データが不足しています</div>;
    }

    const startTime = scoreHistory[0].time;
    const endTime = scoreHistory[scoreHistory.length - 1].time;
    const totalDuration = endTime - startTime;

    const points = scoreHistory.map(d => {
      const x = totalDuration > 0 ? ((d.time - startTime) / totalDuration) * innerWidth : 0;
      const y = innerHeight - (d.score / 100) * innerHeight;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} className="w-full">
        <g transform={`translate(${margin.left},${margin.top})`}>
          {/* Y軸 */}
          <line x1="0" y1="0" x2="0" y2={innerHeight} stroke="#c9b8a8" strokeWidth="1.5" />
          {[0, 50, 100].map(y => (
            <g key={y}>
              <text x="-25" y={(innerHeight - (y / 100) * innerHeight) + 4} fontSize="10" fill="#6b7280">{y}%</text>
              <line x1="0" y1={innerHeight - (y / 100) * innerHeight} x2={innerWidth} y2={innerHeight - (y / 100) * innerHeight} stroke="#c9b8a8" strokeOpacity="0.3" strokeDasharray="2,2" />
            </g>
          ))}
          {/* X軸 */}
          <line x1="0" y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#c9b8a8" strokeWidth="1.5" />
          <text x={innerWidth / 2} y={innerHeight + 15} textAnchor="middle" fontSize="10" fill="#6b7280">時間</text>

          {/* 折れ線 */}
          <polyline
            fill="none"
            stroke="#a8d5ba"
            strokeWidth="3"
            points={points}
          />
        </g>
      </svg>
    );
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-[#5a8f7b] flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          猫背スコアレポート
        </h2>
        <div className="flex items-center space-x-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isRecordingEnabled}
              onChange={() => setIsRecordingEnabled(!isRecordingEnabled)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#c9b8a8]/30 rounded-full peer peer-focus:ring-4 peer-focus:ring-[#a8d5ba]/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-[#c9b8a8] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#a8d5ba]"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">記録</span>
          </label>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-[#a8d5ba] text-white text-sm rounded-2xl hover:bg-[#93c9a8] transition-all duration-300 disabled:bg-[#c9b8a8]/50 disabled:cursor-not-allowed shadow-md"
            disabled={scoreHistory.length === 0}
          >
            CSVでエクスポート
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
        <div className="p-6 bg-[#a8d5ba]/10 border border-[#a8d5ba]/30 rounded-3xl">
          <p className="text-sm text-gray-600 mb-2">平均スコア</p>
          <p className="text-4xl font-bold text-[#5a8f7b]">{stats.averageScore.toFixed(1)}%</p>
        </div>
        <div className="p-6 bg-[#d4a59a]/10 border border-[#d4a59a]/30 rounded-3xl">
          <p className="text-sm text-gray-600 mb-2">最大スコア</p>
          <p className="text-4xl font-bold text-[#d4a59a]">{stats.maxScore.toFixed(1)}%</p>
        </div>
        <div className="p-6 bg-[#f4d06f]/10 border border-[#f4d06f]/30 rounded-3xl">
          <p className="text-sm text-gray-600 mb-2">総計測時間</p>
          <p className="text-2xl font-bold text-[#d4a04f]">{formatDuration(stats.totalTime)}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">スコア推移</h3>
        <div className="w-full bg-white/60 backdrop-blur-sm border border-[#c9b8a8]/30 rounded-3xl p-4">
          <LineChart />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">スコア履歴</h3>
        <div className="max-h-60 overflow-y-auto rounded-3xl border border-[#c9b8a8]/30">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-600 uppercase bg-[#c9b8a8]/20 sticky top-0">
              <tr>
                <th scope="col" className="px-6 py-3 rounded-tl-3xl">時刻</th>
                <th scope="col" className="px-6 py-3 rounded-tr-3xl">猫背スコア</th>
              </tr>
            </thead>
            <tbody>
              {[...scoreHistory].reverse().map((item, index) => (
                <tr key={index} className="bg-white/40 border-b border-[#c9b8a8]/20 hover:bg-[#a8d5ba]/10 transition-colors">
                  <td className="px-6 py-3 text-gray-700">{new Date(item.time).toLocaleTimeString()}</td>
                  <td className="px-6 py-3 font-semibold text-gray-700">
                    {item.score.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PostureReport;
