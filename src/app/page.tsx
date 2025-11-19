"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { usePoseDetection, ScoreHistory } from "@/app/usePoseDetection";
import { useDrowsinessDetection } from "@/app/useDrowsinessDetection";
import { useNotification } from "@/app/useNotification";
import SettingsModal, { Settings } from "@/app/SettingsModal"; // SettingsModalとSettingsをインポート

const DEFAULT_SETTINGS: Settings = {
  threshold: 40, // %
  delay: 5, // seconds
  reNotificationMode: 'cooldown',
  cooldownTime: 60, // seconds
  continuousInterval: 10,
  drowsinessEarThreshold: 0.2,
  drowsinessTimeThreshold: 2, // seconds
};

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (0 <= h && h < 60) { r = c; g = x; b = 0; }
  else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
  else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
  else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
  else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
  else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return [r, g, b];
}

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

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDrowsinessDetectionEnabled, setIsDrowsinessDetectionEnabled] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationTimestamp, setCalibrationTimestamp] = useState<Date | null>(null);
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false); // 初期値をfalseに変更

  useEffect(() => {
    if (window.electron?.isElectron) {
      setIsElectron(true);
    }
  }, []);

  const { slouchScore, isCalibrated, calibrate, scoreHistory } = usePoseDetection({ videoRef, isPaused, isRecordingEnabled });
  const { isDrowsy, ear } = useDrowsinessDetection({
    videoRef,
    isEnabled: isDrowsinessDetectionEnabled,
    isPaused,
    settings
  });

  const {
    notificationType,
    setNotificationType,
    notificationSound,
    setNotificationSound,
    SOUND_OPTIONS,
  } = useNotification({
    slouchScore,
    isDrowsy,
    isPaused,
    settings,
  });

  useEffect(() => {
    if (window.electron?.updateTrayIcon) {
      const canvas = document.createElement('canvas');
      const size = 32;
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');

      if (context) {
        const hue = 120 * (1 - Math.min(slouchScore, 100) / 100);
        const [r, g, b] = hslToRgb(hue, 100, 50);
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.beginPath();
        context.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
        context.fill();
        const dataUrl = canvas.toDataURL('image/png');
        window.electron.updateTrayIcon(dataUrl);
      }
    }
  }, [slouchScore]);

  const borderColor = `hsl(${120 * (1 - slouchScore / 100)}, 100%, 50%)`;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">syakitto</h1>
      <div className="flex space-x-8">
        <div>
          <p className="text-xl mb-2 text-center">猫背スコア</p>
          <p className="text-5xl font-bold mb-6 text-center" style={{ color: borderColor }}>
            {Math.round(slouchScore)}%
          </p>
        </div>
        {isDrowsinessDetectionEnabled && (
          <div>
            <p className="text-xl mb-2 text-center">目の開き具合 (EAR)</p>
            <p className="text-5xl font-bold mb-6 text-center">
              {ear.toFixed(2)}
            </p>
          </div>
        )}
      </div>

      <div className="relative w-max mx-auto mb-4">
        <video
          ref={videoRef}
          width={480}
          height={360}
          className="rounded-lg border border-gray-700"
          style={{ transform: "scaleX(-1)" }}
        />
        {isPaused && (
          <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center rounded-lg">
            <p className="text-white text-2xl font-bold">PAUSED</p>
          </div>
        )}
      </div>

      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="w-48 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
        >
          {isPaused ? '▶ 再開' : '❚❚ 一時停止'}
        </button>
        <button
          onClick={async () => {
            setIsCalibrating(true);
            await calibrate();
            setCalibrationTimestamp(new Date());
            setIsCalibrating(false);
          }}
          className="w-48 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isCalibrating}
        >
          {isCalibrating ? '記録中...' : (isCalibrated ? '良い姿勢を再記録' : '良い姿勢を記録')}
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        {isCalibrated && calibrationTimestamp ? `良い姿勢を記録済み (${calibrationTimestamp.toLocaleTimeString()})` : "良い姿勢が記録されていません"}
      </p>

      {isReportOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-gray-800 rounded-2xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsReportOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600"
              aria-label="レポートを閉じる"
            >
              ×
            </button>
            <PostureReport scoreHistory={scoreHistory} isRecordingEnabled={isRecordingEnabled} setIsRecordingEnabled={setIsRecordingEnabled} />
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <div className="flex justify-center items-center space-x-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="notificationType"
              value="none"
              checked={notificationType === 'none'}
              onChange={(e) => setNotificationType(e.target.value)}
              className="form-radio h-4 w-4 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-400">なし</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="notificationType"
              value="voice"
              checked={notificationType === 'voice'}
              onChange={(e) => setNotificationType(e.target.value)}
              className="form-radio h-4 w-4 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-400">音声</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="notificationType"
              value="desktop"
              checked={notificationType === 'desktop'}
              onChange={(e) => setNotificationType(e.target.value)}
              className="form-radio h-4 w-4 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-400">デスクトップ</span>
          </label>
          {isElectron && (
            <>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="notificationType"
                  value="flash"
                  checked={notificationType === 'flash'}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="form-radio h-4 w-4 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-400">フラッシュ</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="notificationType"
                  value="animation"
                  checked={notificationType === 'animation'}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="form-radio h-4 w-4 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-400">アニメーション</span>
              </label>
            </>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-400">
        ※ カメラ映像はローカル処理のみ。肩が見えなくてもOK。
      </p>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
        isDrowsinessDetectionEnabled={isDrowsinessDetectionEnabled}
        setIsDrowsinessDetectionEnabled={setIsDrowsinessDetectionEnabled}
        notificationType={notificationType}
        notificationSound={notificationSound}
        setNotificationSound={setNotificationSound}
        SOUND_OPTIONS={SOUND_OPTIONS}
        DEFAULT_SETTINGS={DEFAULT_SETTINGS}
      />

      {isInfoOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsInfoOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600"
              aria-label="閉じる"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">Syakittoの仕組みと設定</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold">1．猫背検知</h3>
                <p>
                  Syakittoは、肩と耳の位置を検知することで猫背を判断します。耳が肩よりも画面に近づいていくと、猫背スコアが上昇します。
                </p>
                <p className="mt-2">
                  設定では、「猫背と判断するスコア」と「この秒数続いたら通知」の2つの項目を調整できます。
                  「猫背と判断するスコア」は、猫背とみなすスコアの閾値です。この数値を超えると猫背と判断されます。
                  「この秒数続いたら通知」は、猫背スコアが閾値を超えた状態が指定した秒数継続した場合に通知を行うかの設定です。
                  これらの数値を調整することで、ご自身の作業環境や姿勢に合わせて検知の厳しさを変更できます。
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold">2．眠気検知</h3>
                <p>
                  眠気はEAR（Eye Aspect Ratio：目の開き具合を数値で表したもの）を用いて検知されます。EARが一定の閾値を下回る時間が継続すると、「眠い」と判断されます。
                </p>
                <p className="mt-2">
                  眠気検知は初期設定ではオフになっています。設定画面で「眠気検知を有効にする」をオンにすることで、眠気検知が開始され、目の開き具合（EAR）が表示されるようになります。
                  眠気検知を有効にすると、「目の開き具合のしきい値」と「眠気と判断するまでの時間」を調整できるようになります。
                  「目の開き具合のしきい値」は、目が閉じていると判断するEARの閾値です。
                  「眠気と判断するまでの時間」は、目が閉じている状態が指定した秒数継続した場合に眠気と判断するかの設定です。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 right-6 flex space-x-2">
        <button
          onClick={() => {
            if (window.confirm('macOS版インストーラーをダウンロードしますか？')) {
              window.location.href = 'https://github.com/TsubasaShioda/syakitto/releases/download/v0.1.0/Posture.Checker-0.1.0-arm64.dmg';
            }
          }}
          className="w-14 h-14 bg-gray-700 text-white rounded-full flex items-center justify-center text-2xl hover:bg-gray-600 transition-colors"
          aria-label="macOS版をダウンロード"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
        </button>
        <button
          onClick={() => setIsInfoOpen(true)}
          className="w-14 h-14 bg-gray-700 text-white rounded-full flex items-center justify-center text-2xl hover:bg-gray-600 transition-colors"
          aria-label="情報ページを開く"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
        </button>
        <button
          onClick={() => setIsReportOpen(true)}
          className="w-14 h-14 bg-gray-700 text-white rounded-full flex items-center justify-center text-2xl hover:bg-gray-600 transition-colors"
          aria-label="スコア履歴を開く"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
        </button>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-14 h-14 bg-gray-700 text-white rounded-full flex items-center justify-center text-2xl hover:bg-gray-600 transition-colors"
          aria-label="設定を開く"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </main>
  );
}