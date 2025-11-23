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
          <line x1="0" y1="0" x2="0" y2={innerHeight} stroke="#4A5568" />
          {[0, 50, 100].map(y => (
            <g key={y}>
              <text x="-25" y={(innerHeight - (y / 100) * innerHeight) + 4} fontSize="10" fill="#A0AEC0">{y}%</text>
              <line x1="0" y1={innerHeight - (y / 100) * innerHeight} x2={innerWidth} y2={innerHeight - (y / 100) * innerHeight} stroke="#4A5568" strokeDasharray="2,2" />
            </g>
          ))}
          {/* X軸 */}
          <line x1="0" y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#4A5568" />
          <text x={innerWidth / 2} y={innerHeight + 15} textAnchor="middle" fontSize="10" fill="#A0AEC0">時間</text>

          {/* 折れ線 */}
          <polyline
            fill="none"
            stroke="#63B3ED"
            strokeWidth="2"
            points={points}
          />
        </g>
      </svg>
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 p-6 bg-gray-800 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">猫背スコアレポート</h2>
        <div className="flex items-center space-x-4">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isRecordingEnabled}
              onChange={() => setIsRecordingEnabled(!isRecordingEnabled)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-300">記録</span>
          </label>
          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-500 transition-colors disabled:bg-gray-500"
            disabled={scoreHistory.length === 0}
          >
            CSVでエクスポート
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">平均スコア</p>
          <p className="text-3xl font-bold text-blue-400">{stats.averageScore.toFixed(1)}%</p>
        </div>
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">最大スコア</p>
          <p className="text-3xl font-bold text-red-400">{stats.maxScore.toFixed(1)}%</p>
        </div>
        <div className="p-4 bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-400">総計測時間</p>
          <p className="text-xl font-bold">{formatDuration(stats.totalTime)}</p>
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">スコア推移</h3>
        <div className="w-full bg-gray-900 rounded-md p-2">
          <LineChart />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">スコア履歴</h3>
        <div className="max-h-60 overflow-y-auto rounded-md">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-700 sticky top-0">
              <tr>
                <th scope="col" className="px-4 py-2">時刻</th>
                <th scope="col" className="px-4 py-2">猫背スコア</th>
              </tr>
            </thead>
            <tbody>
              {[...scoreHistory].reverse().map((item, index) => (
                <tr key={index} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600">
                  <td className="px-4 py-2">{new Date(item.time).toLocaleTimeString()}</td>
                  <td className="px-4 py-2">
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
