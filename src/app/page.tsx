"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePoseDetection } from "@/app/usePoseDetection";
import { useDrowsinessDetection } from "@/app/useDrowsinessDetection";
import { useSession, signIn, signOut } from 'next-auth/react';

const DEFAULT_SETTINGS = {
  threshold: 40, // %
  delay: 5, // seconds
  reNotificationMode: 'cooldown', // 'cooldown' or 'continuous'
  cooldownTime: 60, // seconds
  continuousInterval: 10, // seconds
  drowsinessEarThreshold: 0.2,
  drowsinessTimeThreshold: 2, // seconds
};

export default function Home() {
  const { data: session } = useSession();
  console.log('[Home Component] Session:', session);
  console.log('[Home Component] Session User ID:', session?.user?.id);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDrowsinessDetectionEnabled, setIsDrowsinessDetectionEnabled] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // --- カスタムフック ---
  const { slouchScore } = usePoseDetection({ videoRef, isPaused });
  const { isDrowsy, ear } = useDrowsinessDetection({ 
    videoRef, 
    isEnabled: isDrowsinessDetectionEnabled, 
    isPaused, 
    settings 
  });

  // --- 状態管理 ---
  const [notificationTimer, setNotificationTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const [notificationType, setNotificationType] = useState("voice");
  const [isContinuouslyNotifying, setIsContinuouslyNotifying] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- 通知ロジック ---
  const triggerNotification = useCallback((message: string) => {
    console.log('[triggerNotification] Checking session.user.id:', session?.user?.id);
    if (notificationType === 'voice') {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "ja-JP";
      speechSynthesis.speak(utterance);
    } else if (notificationType === 'desktop' && Notification.permission === 'granted') {
      new Notification("syakitto", {
        body: message,
        silent: true,
      });
    } else if (notificationType === 'line' && session?.user?.id) {
      // LINE通知のAPIを呼び出す
      fetch('/api/send-line-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          message: message,
        }),
      });
    }
  }, [notificationType, session]);

  useEffect(() => {
    if (notificationType === 'desktop') {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, [notificationType]);

  // 猫背通知トリガー
  useEffect(() => {
    if (isPaused) return;
    const { threshold, delay, reNotificationMode, cooldownTime } = settings;
    const now = Date.now();

    if (slouchScore > threshold) {
      if (reNotificationMode === 'cooldown' && !notificationTimer && now - lastNotificationTime > cooldownTime * 1000) {
        const timer = setTimeout(() => {
          triggerNotification("ピシッとして！");
          setLastNotificationTime(Date.now());
          setNotificationTimer(null);
        }, delay * 1000);
        setNotificationTimer(timer);
      } else if (reNotificationMode === 'continuous' && !isContinuouslyNotifying) {
        const timer = setTimeout(() => {
          if (!isContinuouslyNotifying) {
            setIsContinuouslyNotifying(true);
          }
        }, delay * 1000);
        setNotificationTimer(timer);
      }
    } else {
      if (notificationTimer) {
        clearTimeout(notificationTimer);
        setNotificationTimer(null);
      }
      if (isContinuouslyNotifying) {
        setIsContinuouslyNotifying(false);
      }
    }
  }, [slouchScore, lastNotificationTime, settings, isContinuouslyNotifying, triggerNotification, isPaused, notificationTimer]);

  // 連続通知
  useEffect(() => {
    if (!isContinuouslyNotifying || isPaused) return;

    triggerNotification("猫背になっています。姿勢を直してください。");
    setLastNotificationTime(Date.now());

    const interval = setInterval(() => {
      triggerNotification("猫背になっています。姿勢を直してください。");
      setLastNotificationTime(Date.now());
    }, settings.continuousInterval * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isContinuouslyNotifying, settings.continuousInterval, triggerNotification, isPaused]);

  // --- 眠気通知トリガー ---
  useEffect(() => {
    if (isDrowsy) {
      triggerNotification("シャキッとして！");
    }
  }, [isDrowsy, triggerNotification]);


  const borderColor = `hsl(${120 * (1 - slouchScore / 100)}, 100%, 50%)`;

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">syakitto</h1>
      <div className="absolute top-4 right-4">
        {session ? (
          <button
            onClick={() => signOut()}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors"
          >
            ログアウト
          </button>
        ) : (
          <button
            onClick={() => signIn('line')}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors"
          >
            LINEでログイン
          </button>
        )}
      </div>
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

      <button
        onClick={() => setIsPaused(!isPaused)}
        className="w-40 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
      >
        {isPaused ? '▶ 再開' : '❚❚ 一時停止'}
      </button>

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
          {session && (
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="notificationType"
                value="line"
                checked={notificationType === 'line'}
                onChange={(e) => setNotificationType(e.target.value)}
                className="form-radio h-4 w-4 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
              />
              <span className="text-gray-400">LINE</span>
            </label>
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

              {/* 再通知ルール */}
              <div className="border-t border-gray-700 pt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">通知の繰り返し</label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reNotificationMode"
                      value="cooldown"
                      checked={settings.reNotificationMode === 'cooldown'}
                      onChange={(e) => setSettings(s => ({ ...s, reNotificationMode: e.target.value }))}
                      className="form-radio h-4 w-4 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-400">クールダウン</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reNotificationMode"
                      value="continuous"
                      checked={settings.reNotificationMode === 'continuous'}
                      onChange={(e) => setSettings(s => ({ ...s, reNotificationMode: e.target.value }))}
                      className="form-radio h-4 w-4 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-gray-400">連続通知</span>
                  </label>
                </div>
              </div>

              {/* 再通知時間 */}
              <div>
                {settings.reNotificationMode === 'cooldown' ? (
                  <div>
                    <label htmlFor="cooldownTime" className="block text-sm font-medium text-gray-300">通知の間隔: <span className="font-bold text-blue-400">{settings.cooldownTime}秒</span></label>
                    <input
                      type="range"
                      id="cooldownTime"
                      min="10"
                      max="180"
                      step="5"
                      value={settings.cooldownTime}
                      onChange={(e) => setSettings(s => ({ ...s, cooldownTime: Number(e.target.value) }))}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="continuousInterval" className="block text-sm font-medium text-gray-300">連続通知の間隔: <span className="font-bold text-blue-400">{settings.continuousInterval}秒</span></label>
                    <input
                      type="range"
                      id="continuousInterval"
                      min="5"
                      max="60"
                      value={settings.continuousInterval}
                      onChange={(e) => setSettings(s => ({ ...s, continuousInterval: Number(e.target.value) }))}
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-2"
                    />
                  </div>
                )}
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

      {/* Settings Button */}
      <div className="absolute bottom-6 right-6">
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
