import { useState, useEffect, useCallback, useRef } from 'react';

interface UseNotificationProps {
  slouchScore: number;
  isDrowsy: boolean;
  isPaused: boolean;
  settings: {
    threshold: number;
    delay: number;
    reNotificationMode: 'cooldown' | 'continuous';
    cooldownTime: number;
    continuousInterval: number;
  };
}

interface UseNotificationReturn {
  notificationType: string;
  setNotificationType: (type: string) => void;
  notificationSound: string;
  setNotificationSound: (sound: string) => void;
  isContinuouslyNotifying: boolean;
  SOUND_OPTIONS: { value: string; label: string }[];
}

export const useNotification = ({ slouchScore, isDrowsy, isPaused, settings }: UseNotificationProps): UseNotificationReturn => {
  const notificationTimer = useRef<NodeJS.Timeout | null>(null);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const [notificationType, setNotificationType] = useState("voice");
  const [notificationSound, setNotificationSound] = useState("voice");
  const [isContinuouslyNotifying, setIsContinuouslyNotifying] = useState(false);

  const SOUND_OPTIONS = [
    { value: "voice", label: "音声" },
    { value: "Syakiin01.mp3", label: "シャキッ！！" },
    { value: "knock01.mp3", label: "コンコン" },
    { value: "monster-snore01.mp3", label: "いびき" },
    { value: "page06.mp3", label: "ペラっ" },
    { value: "shutter01.mp3", label: "シャッター音" },
  ];

  const triggerNotification = useCallback((message: string) => {
    console.log('triggerNotification called with message:', message);

    // デスクトップ通知 (desktop の場合)
    if (notificationType === 'desktop') {
      console.log('Checking for window.electron:', window.electron);
      if (typeof window !== 'undefined' && window.electron && window.electron.showNotification) {
        console.log('Using Electron notification');
        window.electron.showNotification({
          title: "syakitto",
          body: message,
          silent: true,
        });
      } else if (Notification.permission === 'granted') {
        console.log('Using browser notification');
        new Notification("syakitto", {
          body: message,
          silent: true,
        });
      }
    }
    
    // 音声通知 (voice の場合)
    if (notificationType === 'voice') {
      if (notificationSound === 'voice') {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.lang = "ja-JP";
        speechSynthesis.speak(utterance);
      } else if (notificationSound.endsWith('.mp3')) {
        const audio = new Audio(`/sounds/${notificationSound}`);
        audio.play();
      }
    }
  }, [notificationType, notificationSound]);

  // --- デスクトップ通知の許可 ---
  useEffect(() => {
    if (notificationType === 'desktop') {
      if (!(typeof window !== 'undefined' && window.electron && window.electron.showNotification)) {
        if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    }
  }, [notificationType]);

  // --- 猫背通知トリガー ---
  useEffect(() => {
    if (isPaused) return;
    const { threshold, delay, reNotificationMode, cooldownTime } = settings;
    const now = Date.now();

    console.log(`slouchScore: ${slouchScore}, threshold: ${threshold}`);

    if (slouchScore > threshold) {
      console.log('Slouch score exceeded threshold');
      if (reNotificationMode === 'cooldown' && !notificationTimer.current && now - lastNotificationTime > cooldownTime * 1000) {
        notificationTimer.current = setTimeout(() => {
          triggerNotification("猫背になっています。姿勢を直してください。");
          setLastNotificationTime(Date.now());
          notificationTimer.current = null;
        }, delay * 1000);
      } else if (reNotificationMode === 'continuous' && !isContinuouslyNotifying) {
        notificationTimer.current = setTimeout(() => {
          if (!isContinuouslyNotifying) {
            setIsContinuouslyNotifying(true);
          }
        }, delay * 1000);
      }
    } else {
      if (notificationTimer.current) {
        clearTimeout(notificationTimer.current);
        notificationTimer.current = null;
      }
      if (isContinuouslyNotifying) {
        setIsContinuouslyNotifying(false);
      }
    }
  }, [slouchScore, lastNotificationTime, settings, isContinuouslyNotifying, triggerNotification, isPaused]);

  // --- 連続通知の実行 ---
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
    if (isDrowsy && !isPaused) {
      triggerNotification("眠気を検知しました。休憩してください。");
    }
  }, [isDrowsy, isPaused, triggerNotification]);

  return {
    notificationType,
    setNotificationType,
    notificationSound,
    setNotificationSound,
    isContinuouslyNotifying,
    SOUND_OPTIONS,
  };
};