import { useState, useEffect, useCallback, useRef } from 'react';

interface UseNotificationProps {
  slouchScore: number;
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

export const useNotification = ({ slouchScore, isPaused, settings }: UseNotificationProps): UseNotificationReturn => {
  const notificationTimer = useRef<NodeJS.Timeout | null>(null);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const [notificationType, setNotificationType] = useState("voice");
  const [notificationSound, setNotificationSound] = useState("voice");
  const [isContinuouslyNotifying, setIsContinuouslyNotifying] = useState(false);

  const SOUND_OPTIONS = [
    { value: "voice", label: "音声" },
    { value: "Syakiin01.mp3", label: "シャキッ！！" },
  ];

  const triggerNotification = useCallback((message: string) => {
    if (notificationType === 'none') {
      return;
    } else if (notificationType === 'desktop' && Notification.permission === 'granted') {
      new Notification("syakitto", {
        body: message,
        silent: true,
      });
    } else if (notificationType === 'voice') {
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
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, [notificationType]);

  // --- 通知トリガー ---
  useEffect(() => {
    if (isPaused) return;
    const { threshold, delay, reNotificationMode, cooldownTime } = settings;
    const now = Date.now();

    if (slouchScore > threshold) {
      if (reNotificationMode === 'cooldown' && !notificationTimer.current && now - lastNotificationTime > cooldownTime * 1000) {
        notificationTimer.current = setTimeout(() => {
          triggerNotification("猫背になっています。姿勢を直してください。");
          setLastNotificationTime(Date.now());
          notificationTimer.current = null;
        }, delay * 1000);
      } else if (reNotificationMode === 'continuous' && !isContinuouslyNotifying) {
        notificationTimer.current = setTimeout(() => {
          if (!isContinuouslyNotifying) { // タイマー発火時にもう一度チェック
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

    // 最初の通知を実行
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

  return {
    notificationType,
    setNotificationType,
    notificationSound,
    setNotificationSound,
    isContinuouslyNotifying,
    SOUND_OPTIONS,
  };
};