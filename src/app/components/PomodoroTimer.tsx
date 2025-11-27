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
      <div className="absolute inset-0 bg-gray-800 bg-opacity-95 p-4 rounded-lg flex flex-col justify-center space-y-2">
        <div className='text-sm'>
          <label>作業時間: {tempTimerSettings.pomodoroWork}分</label>
          <input ref={workRef} type="range" min="5" max="60" defaultValue={tempTimerSettings.pomodoroWork} onMouseUp={handleValueChange} onTouchEnd={handleValueChange} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-1" />
        </div>
        <div className='text-sm'>
          <label>短い休憩: {tempTimerSettings.pomodoroShortBreak}分</label>
          <input ref={shortBreakRef} type="range" min="1" max="30" defaultValue={tempTimerSettings.pomodoroShortBreak} onMouseUp={handleValueChange} onTouchEnd={handleValueChange} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-1" />
        </div>
        <div className='text-sm'>
          <label>長い休憩: {tempTimerSettings.pomodoroLongBreak}分</label>
          <input ref={longBreakRef} type="range" min="5" max="60" defaultValue={tempTimerSettings.pomodoroLongBreak} onMouseUp={handleValueChange} onTouchEnd={handleValueChange} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-1" />
        </div>
        <div className='text-sm'>
          <label>サイクル数: {tempTimerSettings.pomodoroCycles}回</label>
          <input ref={cyclesRef} type="range" min="2" max="10" defaultValue={tempTimerSettings.pomodoroCycles} onMouseUp={handleValueChange} onTouchEnd={handleValueChange} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer mt-1" />
        </div>
        <button onClick={closeSettings} className="absolute top-2 right-2 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600">×</button>
      </div>
    );
  };

  return (
    <div className="relative bg-gray-800 p-4 rounded-lg shadow-lg text-white text-center w-64">
      <button onClick={openSettings} className="absolute top-2 left-2 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
      </button>

      <h2 className="text-xl font-bold mb-2">ポモドーロタイマー</h2>
      <div className="mb-2">
        <p>{`セッション: ${sessionType}`}</p>
        <p>{`${pomodoroCount} サイクル完了`}</p>
        {!isSettingsOpen && (
          <p className="text-xs text-gray-400 mt-1">
            {`${pomodoroCycles}回の作業セッション後に長い休憩に入ります。`}
          </p>
        )}
      </div>
      <div className="flex justify-center space-x-2 mb-4">
        <button onClick={() => switchSession('作業', false)} className={`px-2 py-1 text-sm rounded ${sessionType === '作業' ? 'bg-blue-600' : 'bg-gray-700'}`}>作業</button>
        <button onClick={() => switchSession('短い休憩', false)} className={`px-2 py-1 text-sm rounded ${sessionType === '短い休憩' ? 'bg-green-600' : 'bg-gray-700'}`}>短い休憩</button>
        <button onClick={() => switchSession('長い休憩', false)} className={`px-2 py-1 text-sm rounded ${sessionType === '長い休憩' ? 'bg-purple-600' : 'bg-gray-700'}`}>長い休憩</button>
      </div>
      <div className="text-6xl font-mono mb-4">{formatTime(timeLeft)}</div>
      <div className="flex justify-center space-x-4 mb-4">
        <button onClick={toggleTimer} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-24">{isActive ? '一時停止' : '開始'}</button>
        <button onClick={resetTimer} className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded w-24">リセット</button>
      </div>
      <div className="text-sm">
        <p className="mb-1">通知方法:</p>
        <div className="flex justify-center space-x-4">
          <label className="flex items-center space-x-1 cursor-pointer"><input type="radio" value="desktop" checked={notificationType === 'desktop'} onChange={() => setNotificationType('desktop')} className="form-radio h-3 w-3 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"/><span>デスクトップ</span></label>
          <label className="flex items-center space-x-1 cursor-pointer"><input type="radio" value="voice" checked={notificationType === 'voice'} onChange={() => setNotificationType('voice')} className="form-radio h-3 w-3 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"/><span>音声</span></label>
          <label className="flex items-center space-x-1 cursor-pointer"><input type="radio" value="none" checked={notificationType === 'none'} onChange={() => setNotificationType('none')} className="form-radio h-3 w-3 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"/><span>なし</span></label>
        </div>
      </div>
      {isSettingsOpen && <SettingsView />}
    </div>
  );
};

export default PomodoroTimer;
