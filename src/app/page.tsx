"use client";

import { useEffect, useRef, useState } from "react";
import { usePoseDetection } from "@/app/usePoseDetection";
import { useDrowsinessDetection } from "@/app/useDrowsinessDetection";
import { useNotification } from "@/app/useNotification"; // インポート

const DEFAULT_SETTINGS: {
  threshold: number;
  delay: number;
  reNotificationMode: 'cooldown' | 'continuous';
  cooldownTime: number;
  continuousInterval: number;
  drowsinessEarThreshold: number;
  drowsinessTimeThreshold: number;
} = {
  threshold: 40, // %
  delay: 5, // seconds
  reNotificationMode: 'cooldown',
  cooldownTime: 60, // seconds
  continuousInterval: 10, // これを追加
  drowsinessEarThreshold: 0.2,
  drowsinessTimeThreshold: 2, // seconds
};

// HSL to RGB 変換関数 (canvas で使うため)
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
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

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDrowsinessDetectionEnabled, setIsDrowsinessDetectionEnabled] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  useEffect(() => {
    if (window.electron?.isElectron) {
      setIsElectron(true);
    }
  }, []);

  // --- カスタムフック ---
  const { slouchScore, isCalibrated, calibrate } = usePoseDetection({ videoRef, isPaused });
  const { isDrowsy, ear } = useDrowsinessDetection({
    videoRef,
    isEnabled: isDrowsinessDetectionEnabled,
    isPaused,
    settings
  });

  // useNotification フックを呼び出す
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

  // アイコンを生成してメインプロセスに送信
  useEffect(() => {
    if (window.electron?.updateTrayIcon) {
      const canvas = document.createElement('canvas');
      // Retina対応と、macOSメニューバーの標準的な最大サイズを考慮
      const size = 32; 
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');

      if (context) {
        const hue = 120 * (1 - Math.min(slouchScore, 100) / 100);
        const [r, g, b] = hslToRgb(hue, 100, 50);
        
        // 円を描画
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.beginPath();
        context.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI); // 少し余白を持たせる
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
          className="w-40 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
        >
          {isPaused ? '▶ 再開' : '❚❚ 一時停止'}
        </button>
        <button
          onClick={calibrate}
          className="w-40 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors"
        >
          キャリブレーション
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        {isCalibrated ? "キャリブレーション済み" : "キャリブレーションされていません"}
      </p>

      {/* 通知タイプ */}
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

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600"
              aria-label="設定を閉じる"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-white mb-6">設定</h2>
            <div className="space-y-6">
              {/* トリガー条件 */}
              <div className="border-t border-gray-700 pt-4 space-y-4">
                <div>
                  <label htmlFor="threshold" className="block text-sm font-medium text-gray-300">
                    猫背と判断するスコア: <span className="font-bold text-blue-400">{settings.threshold}%</span>
                  </label>
                  <input
                    type="range"
                    id="threshold"
                    min="0"
                    max="100"
                    value={settings.threshold}
                    onChange={(e) => setSettings(s => ({ ...s, threshold: Number(e.target.value) }))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
                  />
                </div>
                <div>
                  <label htmlFor="delay" className="block text-sm font-medium text-gray-300">この秒数続いたら通知: <span className="font-bold text-blue-400">{settings.delay}秒</span></label>
                  <input
                    type="range"
                    id="delay"
                    min="5"
                    max="60"
                    value={settings.delay}
                    onChange={(e) => setSettings(s => ({ ...s, delay: Number(e.target.value) }))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
                  />
                </div>
              </div>

              {/* 通知音選択 */}
              {notificationType === 'voice' && (
                <div className="border-t border-gray-700 pt-4">
                  <label htmlFor="notificationSound" className="block text-sm font-medium text-gray-300">通知音</label>
                  <select
                    id="notificationSound"
                    name="notificationSound"
                    value={notificationSound}
                    onChange={(e) => setNotificationSound(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    {SOUND_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* 再通知時間 */}
              <div>
                <label htmlFor="cooldownTime" className="block text-sm font-medium text-gray-300">通知の間隔: <span className="font-bold text-blue-400">{settings.cooldownTime}秒</span></label>
                <input
                  type="range"
                  id="cooldownTime"
                  min="5"
                  max="180"
                  step="5"
                  value={settings.cooldownTime}
                  onChange={(e) => setSettings(s => ({ ...s, cooldownTime: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
                />
              </div>

              {/* 眠気検知 */}
              <div className="border-t border-gray-700 pt-4">
                <label htmlFor="drowsinessDetection" className="flex items-center justify-between cursor-pointer text-gray-300">
                  <span>眠気検知を有効にする</span>
                  <input
                    type="checkbox"
                    id="drowsinessDetection"
                    checked={isDrowsinessDetectionEnabled}
                    onChange={(e) => setIsDrowsinessDetectionEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="relative w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
                {isDrowsinessDetectionEnabled && (
                  <div className="pl-4 mt-4 space-y-4 border-l border-gray-600">
                    <div>
                      <label htmlFor="drowsinessEarThreshold" className="block text-sm font-medium text-gray-300">
                        目の開き具合のしきい値: <span className="font-bold text-blue-400">{settings.drowsinessEarThreshold.toFixed(2)}</span>
                      </label>
                      <input
                        type="range"
                        id="drowsinessEarThreshold"
                        min="0.05"
                        max="0.4"
                        step="0.01"
                        value={settings.drowsinessEarThreshold}
                        onChange={(e) => setSettings(s => ({ ...s, drowsinessEarThreshold: Number(e.target.value) }))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
                      />
                    </div>
                    <div>
                      <label htmlFor="drowsinessTimeThreshold" className="block text-sm font-medium text-gray-300">
                        眠気と判断するまでの時間: <span className="font-bold text-blue-400">{settings.drowsinessTimeThreshold}秒</span>
                      </label>
                      <input
                        type="range"
                        id="drowsinessTimeThreshold"
                        min="1"
                        max="180"
                        step="1"
                        value={settings.drowsinessTimeThreshold}
                        onChange={(e) => setSettings(s => ({ ...s, drowsinessTimeThreshold: Number(e.target.value) }))}
                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* アクションボタン */}
              <div className="border-t border-gray-700 pt-6 flex items-center justify-end">
                <button
                  onClick={() => setSettings(DEFAULT_SETTINGS)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
                >
                  設定をリセット
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
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

      {/* Settings Button */}
      <div className="absolute bottom-6 right-6 flex space-x-2">
        <button
          onClick={() => setIsInfoOpen(true)}
          className="w-14 h-14 bg-gray-700 text-white rounded-full flex items-center justify-center text-2xl hover:bg-gray-600 transition-colors"
          aria-label="情報ページを開く"
        >
          ℹ️
        </button>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-14 h-14 bg-gray-700 text-white rounded-full flex items-center justify-center text-2xl hover:bg-gray-600 transition-colors"
          aria-label="設定を開く"
        >
          ⚙️
        </button>
      </div>
    </main>
  );
}