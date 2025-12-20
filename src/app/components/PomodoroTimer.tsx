"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';

// Settings are now local to the component
interface TimerSettings {
  pomodoroWork: number;
  pomodoroShortBreak: number;
  pomodoroLongBreak: number;
  pomodoroCycles: number;
}

const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  pomodoroWork: 25,
  pomodoroShortBreak: 5,
  pomodoroLongBreak: 15,
  pomodoroCycles: 4,
};

type SessionType = '作業' | '短い休憩' | '長い休憩';
type NotificationType = 'desktop' | 'voice' | 'none';

const PomodoroTimer = () => {
  const [timerSettings, setTimerSettings] = useState(DEFAULT_TIMER_SETTINGS);
  const [tempTimerSettings, setTempTimerSettings] = useState(DEFAULT_TIMER_SETTINGS);
  
  const { pomodoroWork, pomodoroShortBreak, pomodoroLongBreak, pomodoroCycles } = timerSettings;

  const [timeLeft, setTimeLeft] = useState(pomodoroWork * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionType, setSessionType] = useState<SessionType>('作業');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [notificationType, setNotificationType] = useState<NotificationType>('desktop');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Update timer only when settings are saved or session type changes
  useEffect(() => {
    if (isActive) return;
    switch (sessionType) {
      case '作業':
        setTimeLeft(pomodoroWork * 60);
        break;
      case '短い休憩':
        setTimeLeft(pomodoroShortBreak * 60);
        break;
      case '長い休憩':
        setTimeLeft(pomodoroLongBreak * 60);
        break;
    }
  }, [pomodoroWork, pomodoroShortBreak, pomodoroLongBreak, sessionType, isActive]);

  useEffect(() => {
    if (notificationType === 'desktop' && !(typeof window !== 'undefined' && window.electron?.showNotification)) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, [notificationType]);

  const sendNotification = useCallback((message: string) => {
    if (notificationType === 'desktop') {
      if (typeof window !== 'undefined' && window.electron?.showNotification) {
        window.electron.showNotification({ title: "ポモドーロタイマー", body: message, silent: true });
      } else if (Notification.permission === 'granted') {
        new Notification("ポモドーロタイマー", { body: message, silent: true });
      }
    } else if (notificationType === 'voice') {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "ja-JP";
      speechSynthesis.speak(utterance);
    }
  }, [notificationType]);

  const switchSession = useCallback((type: SessionType, shouldNotify: boolean) => {
    setIsActive(false);
    setSessionType(type);
    let notificationMessage = '';
    switch (type) {
      case '作業':
        setTimeLeft(pomodoroWork * 60);
        notificationMessage = '作業を始めましょう！';
        break;
      case '短い休憩':
        setTimeLeft(pomodoroShortBreak * 60);
        notificationMessage = '短い休憩を取りましょう！';
        break;
      case '長い休憩':
        setTimeLeft(pomodoroLongBreak * 60);
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

      const nextSession = sessionType === '作業'
        ? (newPomodoroCount > 0 && newPomodoroCount % pomodoroCycles === 0 ? '長い休憩' : '短い休憩')
        : '作業';
      switchSession(nextSession, true);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isActive, timeLeft, sessionType, pomodoroCount, switchSession, pomodoroCycles]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => switchSession(sessionType, false);

  // タイマーウィンドウを開く
  const showTimerWindow = () => {
    if (typeof window !== 'undefined' && window.electron?.showTimerWindow) {
      window.electron.showTimerWindow();
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

  const openSettings = () => {
    setTempTimerSettings(timerSettings);
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setTimerSettings(tempTimerSettings);
    setIsSettingsOpen(false);
  };

  const SettingsView = () => {
    const workRef = useRef<HTMLInputElement>(null);
    const shortBreakRef = useRef<HTMLInputElement>(null);
    const longBreakRef = useRef<HTMLInputElement>(null);
    const cyclesRef = useRef<HTMLInputElement>(null);

    const handleValueChange = () => {
      setTempTimerSettings({
        pomodoroWork: Number(workRef.current?.value ?? tempTimerSettings.pomodoroWork),
        pomodoroShortBreak: Number(shortBreakRef.current?.value ?? tempTimerSettings.pomodoroShortBreak),
        pomodoroLongBreak: Number(longBreakRef.current?.value ?? tempTimerSettings.pomodoroLongBreak),
        pomodoroCycles: Number(cyclesRef.current?.value ?? tempTimerSettings.pomodoroCycles),
      });
    };
    
    return (
      <div className="absolute inset-0 bg-white/90 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-center space-y-2">
        <div className='text-sm'>
          <label className="text-gray-600">作業時間: {tempTimerSettings.pomodoroWork}分</label>
          <input ref={workRef} type="range" min="5" max="60" defaultValue={tempTimerSettings.pomodoroWork} onMouseUp={handleValueChange} onTouchEnd={handleValueChange} className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba] mt-1" />
        </div>
        <div className='text-sm'>
          <label className="text-gray-600">短い休憩: {tempTimerSettings.pomodoroShortBreak}分</label>
          <input ref={shortBreakRef} type="range" min="1" max="30" defaultValue={tempTimerSettings.pomodoroShortBreak} onMouseUp={handleValueChange} onTouchEnd={handleValueChange} className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba] mt-1" />
        </div>
        <div className='text-sm'>
          <label className="text-gray-600">長い休憩: {tempTimerSettings.pomodoroLongBreak}分</label>
          <input ref={longBreakRef} type="range" min="5" max="60" defaultValue={tempTimerSettings.pomodoroLongBreak} onMouseUp={handleValueChange} onTouchEnd={handleValueChange} className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba] mt-1" />
        </div>
        <div className='text-sm'>
          <label className="text-gray-600">サイクル数: {tempTimerSettings.pomodoroCycles}回</label>
          <input ref={cyclesRef} type="range" min="2" max="10" defaultValue={tempTimerSettings.pomodoroCycles} onMouseUp={handleValueChange} onTouchEnd={handleValueChange} className="w-full h-2 bg-[#c9b8a8]/30 rounded-lg appearance-none cursor-pointer accent-[#a8d5ba] mt-1" />
        </div>
        <button onClick={closeSettings} className="absolute top-4 right-4 w-8 h-8 bg-[#c9b8a8]/30 hover:bg-[#c9b8a8]/50 text-gray-700 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110">×</button>
      </div>
    );
  };

  return (
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
          <button onClick={toggleTimer} className="flex-1 px-6 py-2 bg-[#a8d5ba] text-white rounded-2xl hover:bg-[#93c9a8] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold flex items-center justify-center gap-2">
            {isActive ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" /></svg>
                一時停止
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" /></svg>
                開始
              </>
            )}
          </button>
          <button onClick={resetTimer} className="flex-1 px-6 py-2 bg-gray-300 text-gray-700 rounded-2xl hover:bg-gray-400 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 font-semibold flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M9.53 2.47a.75.75 0 0 1 0 1.06L4.81 8.25H15a6.75 6.75 0 0 1 0 13.5h-3a.75.75 0 0 1 0-1.5h3a5.25 5.25 0 1 0 0-10.5H4.81l4.72 4.72a.75.75 0 1 1-1.06 1.06l-6-6a.75.75 0 0 1 0-1.06l6-6a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>
            リセット
          </button>
        </div>
        {typeof window !== 'undefined' && window.electron && (
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
      {isSettingsOpen && <SettingsView />}
    </div>
  );
};

export default PomodoroTimer;
