"use client";

import React, { useState, useEffect, useCallback } from 'react';
import InfoModal from './InfoModal';

// Settings are now local to the component
interface TimerSettings {
  pomodoroWork: number;
  pomodoroShortBreak: number;
  pomodoroLongBreak: number;
  pomodoroCycles: number;
  autoRestartAfterCycle: boolean; // サイクル完了後に自動で再開するか
}

// 開発モードかどうかを判定（環境変数で制御）
const isDevelopmentMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  pomodoroWork: 25,
  pomodoroShortBreak: 5,
  pomodoroLongBreak: 15,
  pomodoroCycles: 4,
  autoRestartAfterCycle: true, // デフォルトは自動再開
};

type SessionType = '作業' | '短い休憩' | '長い休憩';
type NotificationType = 'desktop' | 'voice' | 'none';

const PomodoroTimer = () => {
  const [timerSettings, setTimerSettings] = useState(DEFAULT_TIMER_SETTINGS);
  const [tempTimerSettings, setTempTimerSettings] = useState(DEFAULT_TIMER_SETTINGS);
  
  const { pomodoroWork, pomodoroShortBreak, pomodoroLongBreak, pomodoroCycles, autoRestartAfterCycle } = timerSettings;

  const [timeLeft, setTimeLeft] = useState(isDevelopmentMode ? pomodoroWork : pomodoroWork * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('作業');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [notificationType, setNotificationType] = useState<NotificationType>('desktop');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  useEffect(() => {
    setIsElectron(typeof window !== 'undefined' && !!window.electron);
  }, []);

  // Update timer only when settings are saved or session type changes
  useEffect(() => {
    if (isActive) return;
    const multiplier = isDevelopmentMode ? 1 : 60; // 開発モードは秒、通常モードは分を秒に変換
    switch (sessionType) {
      case '作業':
        setTimeLeft(pomodoroWork * multiplier);
        break;
      case '短い休憩':
        setTimeLeft(pomodoroShortBreak * multiplier);
        break;
      case '長い休憩':
        setTimeLeft(pomodoroLongBreak * multiplier);
        break;
    }
  }, [pomodoroWork, pomodoroShortBreak, pomodoroLongBreak, sessionType]);



  const sendNotification = useCallback((message: string) => {
    if (notificationType === 'desktop') {
      if (typeof window !== 'undefined' && window.electron?.showNotification) {
        window.electron.showNotification({ title: "ポモドーロタイマー", body: message, silent: true });
      } else { // Web browser environment
        // パーミッションがdefaultの場合のみ要求し、その後通知
        if (Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              new Notification("ポモドーロタイマー", { body: message, silent: true });
            }
          });
        } else if (Notification.permission === 'granted') {
          new Notification("ポモドーロタイマー", { body: message, silent: true });
        }
      }
    } else if (notificationType === 'voice') {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "ja-JP";
      speechSynthesis.speak(utterance);
    }
  }, [notificationType]);

  const switchSession = useCallback((type: SessionType, shouldNotify: boolean, autoStart: boolean = false) => {
    setIsActive(autoStart);
    setSessionType(type);
    const multiplier = isDevelopmentMode ? 1 : 60; // 開発モードは秒、通常モードは分を秒に変換
    let notificationMessage = '';
    switch (type) {
      case '作業':
        setTimeLeft(pomodoroWork * multiplier);
        notificationMessage = '作業を始めましょう！';
        break;
      case '短い休憩':
        setTimeLeft(pomodoroShortBreak * multiplier);
        notificationMessage = '短い休憩を取りましょう！';
        break;
      case '長い休憩':
        setTimeLeft(pomodoroLongBreak * multiplier);
        notificationMessage = '長い休憩を始めましょう！';
        break;
    }
    if (shouldNotify) sendNotification(notificationMessage);
  }, [sendNotification, pomodoroWork, pomodoroShortBreak, pomodoroLongBreak]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(time => time - 1), 1000);
    } else if (timeLeft === 0 && isActive) { // check isActive to prevent multiple triggers
      const newPomodoroCount = sessionType === '作業' ? pomodoroCount + 1 : pomodoroCount;
      if (sessionType === '作業') setPomodoroCount(newPomodoroCount);

      // サイクル完了後の処理
      if (sessionType === '長い休憩' && !autoRestartAfterCycle) {
        // 長い休憩が終わり、自動再開がオフの場合は停止
        sendNotification('全サイクルが完了しました！お疲れ様でした。');
        switchSession('作業', false, false);
      } else {
        // 通常の遷移（自動的に次のセッションを開始）
        const nextSession = sessionType === '作業'
          ? (newPomodoroCount > 0 && newPomodoroCount % pomodoroCycles === 0 ? '長い休憩' : '短い休憩')
          : '作業';
        switchSession(nextSession, true, true);
      }
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft, sessionType, pomodoroCount, switchSession, pomodoroCycles, autoRestartAfterCycle, sendNotification]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = useCallback(() => setIsActive(!isActive), [isActive]);
  const resetTimer = useCallback(() => switchSession(sessionType, false, false), [sessionType, switchSession]);

  // タイマーウィンドウを開く
  const showTimerWindow = () => {
    if (typeof window !== 'undefined' && window.electron?.showTimerWindow) {
      window.electron.showTimerWindow();
      // ウィンドウを開いたら即座に現在の状態を送信
      if (window.electron?.updateTimerWindow) {
        window.electron.updateTimerWindow({
          timeLeft,
          isActive,
          sessionType,
        });
      }
    }
  };

  // タイマー状態が変わるたびにウィンドウを更新
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron?.updateTimerWindow) {
      window.electron.updateTimerWindow({
        timeLeft,
        isActive,
        sessionType,
      });
    }
  }, [timeLeft, isActive, sessionType]);

  // タイマーウィンドウからの操作イベントを受け取る
  useEffect(() => {
    if (typeof window !== 'undefined' && window.electron?.onToggleTimerFromWindow) {
      window.electron.onToggleTimerFromWindow(toggleTimer);
    }
    if (typeof window !== 'undefined' && window.electron?.onResetTimerFromWindow) {
      window.electron.onResetTimerFromWindow(resetTimer);
    }
  }, [toggleTimer, resetTimer]);

  const openSettings = () => {
    setTempTimerSettings(timerSettings);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setTimerSettings(tempTimerSettings);
    setIsSettingsOpen(false);
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setTempTimerSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };

  // タイマー関連のショートカットキー処理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // input要素内では無効化
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      // 設定モーダルが開いている時は無効化
      if (isSettingsOpen) {
        return;
      }

      switch (event.key) {
        case ' ': // Space
          event.preventDefault();
          toggleTimer();
          break;
        case '1':
          switchSession('作業', false);
          break;
        case '2':
          switchSession('短い休憩', false);
          break;
        case '3':
          switchSession('長い休憩', false);
          break;
        case 'r':
        case 'R':
          resetTimer();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, toggleTimer, switchSession, resetTimer]);

  return (
    <>
      <div className="relative bg-white/60 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-[#c9b8a8]/30 text-gray-700 text-center w-full">
        <button onClick={openSettings} className="absolute top-4 left-4 w-8 h-8 bg-[#c9b8a8]/30 hover:bg-[#c9b8a8]/50 text-gray-700 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
        </button>

        <h2 className="text-xl font-bold mb-2 text-[#5a8f7b]">ポモドーロタイマー</h2>
        <div className="mb-2">
          <p className="text-sm">{`セッション: ${sessionType}`}</p>
          <p className="text-xs text-gray-500">{`${pomodoroCount} サイクル完了`}</p>
          {!isSettingsOpen && (
            <p className="text-xs text-gray-400 mt-1">
              {`${pomodoroCycles}回の作業セッション後に長い休憩に入ります。`}
            </p>
          )}
        </div>
        <div className="flex justify-center space-x-2 mb-4">
          <button onClick={() => switchSession('作業', false)} className={`px-3 py-1 text-sm rounded-full transition-colors ${sessionType === '作業' ? 'bg-[#a8d5ba] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>作業</button>
          <button onClick={() => switchSession('短い休憩', false)} className={`px-3 py-1 text-sm rounded-full transition-colors ${sessionType === '短い休憩' ? 'bg-[#a8d5ba] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>短い休憩</button>
          <button onClick={() => switchSession('長い休憩', false)} className={`px-3 py-1 text-sm rounded-full transition-colors ${sessionType === '長い休憩' ? 'bg-[#a8d5ba] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>長い休憩</button>
        </div>
        <div className="text-6xl font-mono mb-4 text-[#5a8f7b]">{formatTime(timeLeft)}</div>
        <div className="flex flex-col gap-3 mb-4 w-full">
          <div className="flex justify-center gap-3">
            <button onClick={toggleTimer} className="flex-1 px-4 py-2 bg-[#a8d5ba] text-white rounded-2xl hover:bg-[#93c9a8] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold flex items-center justify-center gap-2 text-sm">
              {isActive ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" /></svg>
                  <span className="whitespace-nowrap">一時停止</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" /></svg>
                  <span className="whitespace-nowrap">開始</span>
                </>
              )}
            </button>
            <button onClick={resetTimer} className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-2xl hover:bg-gray-400 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold flex items-center justify-center gap-2 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M9.53 2.47a.75.75 0 0 1 0 1.06L4.81 8.25H15a6.75 6.75 0 0 1 0 13.5h-3a.75.75 0 0 1 0-1.5h3a5.25 5.25 0 1 0 0-10.5H4.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>
              <span className="whitespace-nowrap">リセット</span>
            </button>
          </div>
          {isElectron && (
            <button onClick={showTimerWindow} className="w-full px-6 py-2 bg-[#c9b8a8] text-white rounded-2xl hover:bg-[#b8a798] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M2.25 5.25a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3V15a3 3 0 0 1-3 3h-3v.257c0 .597.237 1.17.659 1.591l.621.622a.75.75 0 0 1-.53 1.28h-9a.75.75 0 0 1-.53-1.28l.621-.622a2.25 2.25 0 0 0 .659-1.59V18h-3a3 3 0 0 1-3-3V5.25Zm1.5 0v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5Z" clipRule="evenodd" /></svg>
              ウィンドウ表示
            </button>
          )}
        </div>
        <div className="text-sm">
          <p className="mb-2 font-medium">通知方法:</p>
          <div className="flex justify-center space-x-2">
            <button onClick={() => setNotificationType('desktop')} className={`px-3 py-1 text-sm rounded-full transition-colors ${notificationType === 'desktop' ? 'bg-[#a8d5ba] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>デスクトップ</button>
            <button onClick={() => setNotificationType('voice')} className={`px-3 py-1 text-sm rounded-full transition-colors ${notificationType === 'voice' ? 'bg-[#a8d5ba] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>音声</button>
            <button onClick={() => setNotificationType('none')} className={`px-3 py-1 text-sm rounded-full transition-colors ${notificationType === 'none' ? 'bg-[#a8d5ba] text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>なし</button>
          </div>
        </div>
      </div>
      <InfoModal isOpen={isSettingsOpen} onClose={closeSettings} title="ポモドーロタイマー設定">
        <div className="space-y-4">
            {isDevelopmentMode && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800 font-medium">開発モード: 秒単位で設定できます</p>
              </div>
            )}
            <div>
              <label htmlFor="pomodoroWork" className="block text-sm font-medium text-gray-700 mb-2">
                作業時間: <span className="font-bold text-[#5a8f7b]">{tempTimerSettings.pomodoroWork}{isDevelopmentMode ? '秒' : '分'}</span>
              </label>
              <input
                id="pomodoroWork"
                name="pomodoroWork"
                type="range"
                min={isDevelopmentMode ? "1" : "5"}
                max={isDevelopmentMode ? "120" : "60"}
                value={tempTimerSettings.pomodoroWork}
                onChange={handleSettingsChange}
                className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba] mt-1"
              />
            </div>
            <div>
              <label htmlFor="pomodoroShortBreak" className="block text-sm font-medium text-gray-700 mb-2">
                短い休憩: <span className="font-bold text-[#5a8f7b]">{tempTimerSettings.pomodoroShortBreak}{isDevelopmentMode ? '秒' : '分'}</span>
              </label>
              <input
                id="pomodoroShortBreak"
                name="pomodoroShortBreak"
                type="range"
                min={isDevelopmentMode ? "1" : "1"}
                max={isDevelopmentMode ? "60" : "30"}
                value={tempTimerSettings.pomodoroShortBreak}
                onChange={handleSettingsChange}
                className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba] mt-1"
              />
            </div>
            <div>
              <label htmlFor="pomodoroLongBreak" className="block text-sm font-medium text-gray-700 mb-2">
                長い休憩: <span className="font-bold text-[#5a8f7b]">{tempTimerSettings.pomodoroLongBreak}{isDevelopmentMode ? '秒' : '分'}</span>
              </label>
              <input
                id="pomodoroLongBreak"
                name="pomodoroLongBreak"
                type="range"
                min={isDevelopmentMode ? "1" : "5"}
                max={isDevelopmentMode ? "120" : "60"}
                value={tempTimerSettings.pomodoroLongBreak}
                onChange={handleSettingsChange}
                className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba] mt-1"
              />
            </div>
            <div>
              <label htmlFor="pomodoroCycles" className="block text-sm font-medium text-gray-700 mb-2">サイクル数: <span className="font-bold text-[#5a8f7b]">{tempTimerSettings.pomodoroCycles}回</span></label>
              <input id="pomodoroCycles" name="pomodoroCycles" type="range" min="2" max="10" value={tempTimerSettings.pomodoroCycles} onChange={handleSettingsChange} className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba] mt-1" />
            </div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="autoRestartAfterCycle" className="text-sm font-medium text-gray-700">サイクル完了後も自動継続</label>
                  <p className="text-xs text-gray-500 mt-1">オフにすると長い休憩後に停止します</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="autoRestartAfterCycle"
                    name="autoRestartAfterCycle"
                    type="checkbox"
                    checked={tempTimerSettings.autoRestartAfterCycle}
                    onChange={handleSettingsChange}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#a8d5ba]/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#a8d5ba]"></div>
                </label>
              </div>
            </div>
        </div>
      </InfoModal>
    </>
  );
};

export default PomodoroTimer;