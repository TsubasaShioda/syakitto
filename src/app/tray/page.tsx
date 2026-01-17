"use client";

import { useState, useEffect, useCallback } from "react";
import ToggleSwitch from "../components/ToggleSwitch";

export default function TrayPage() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await window.electron.getSettings();
        setNotificationsEnabled(settings.notification.all);
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();

    const cleanup = window.trayAPI.onUpdatePostureScore((newScore: number) => {
      setScore(newScore);
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  const handleToggle = useCallback(async () => {
    const newEnabled = !notificationsEnabled;
    setNotificationsEnabled(newEnabled);
    try {
      window.electron.toggleNotifications(newEnabled);
    } catch (error) {
      console.error("Failed to toggle notifications:", error);
      setNotificationsEnabled(!newEnabled);
    }
  }, [notificationsEnabled]);

  const handleQuit = () => {
    window.electron.quitApp();
  };

  return (
    // ライトモードは白(white/80)、ダークモードは黒(black/60)に自動変化
    <div className="h-screen w-full bg-white/80 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 text-gray-800 dark:text-white font-sans select-none overflow-hidden flex flex-col shadow-xl">
      
      {/* メインエリア */}
      <div className="flex-1 flex flex-col items-center justify-center pt-3">
        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold tracking-wide uppercase mb-1">
          猫背スコア
        </p>
        <div className="flex items-baseline space-x-1">
          {/* スコア表示 */}
          <span className="text-6xl font-bold text-gray-800 dark:text-white tracking-tighter leading-none">
            {Math.round(score)}
          </span>
          {/*「％」表示 */}
          <span className="text-lg text-gray-400 dark:text-white/50 font-medium">％</span>
        </div>
      </div>

      {/* コントロールエリア */}
      <div className="px-4 py-3">
        <div className="bg-gray-200/50 dark:bg-white/10 rounded-xl p-3 flex items-center justify-between transition-colors">
          <div className="flex items-center space-x-2.5">
            {/* アイコンの色もモードに合わせて調整 */}
            <svg className="w-5 h-5 text-gray-600 dark:text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="text-sm font-bold text-gray-700 dark:text-white/90">通知</span>
          </div>
          <ToggleSwitch isEnabled={notificationsEnabled} onToggle={handleToggle} />
        </div>
      </div>

      {/* フッターエリア */}
      <div className="border-t border-gray-200 dark:border-white/10 p-2 mt-auto bg-gray-50/50 dark:bg-black/20">
        <button
          onClick={handleQuit}
          className="w-full flex items-center justify-center space-x-2 py-2 text-xs font-medium text-gray-500 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg transition-all duration-200"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>アプリを終了</span>
        </button>
      </div>
    </div>
  );
}