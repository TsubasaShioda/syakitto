/**
 * @file このファイルは、ユーザーの姿勢スコアに基づいて通知をトリガーするロジックをカプセル化したカスタムReactフック `useNotification` を定義します。
 *
 * 主な責務：
 * - ユーザーの猫背スコアが設定されたしきい値を超え、かつ指定された時間が経過した際に通知を発行する。
 * - `cooldown`（一度通知したら一定時間待つ）と`continuous`（猫背である限り定期的に通知する）の2つの再通知モードを管理する。
 * - ユーザーが選択した通知タイプ（デスクトップ、音声、アニメーション）に応じて、適切な通知方法を呼び出す。
 * - Electron環境とWebブラウザ環境の両方で動作するように、プラットフォームを意識した通知処理を行う。
 * - 猫背状態に応じてブラウザのドキュメントタイトルを動的に変更する。
 *
 * @hook useNotification
 * @param {UseNotificationProps} props - フックの動作に必要なプロパティ（姿勢スコア、設定、通知タイプなど）。
 * @returns {void}
 */
// useNotification.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Settings } from '@/electron-api.d';

interface UseNotificationProps {
  slouchScore: number;
  isPaused: boolean;
  settings: Settings;
  notificationType: string;
  notificationSound: string;
  animationType: string;
  onNotificationBlocked: () => void;
}

export const useNotification = ({ 
  slouchScore, 
  isPaused, 
  settings, 
  notificationType, 
  notificationSound, 
  animationType,
  onNotificationBlocked
}: UseNotificationProps) => {
  const notificationTimer = useRef<NodeJS.Timeout | null>(null);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const [isContinuouslyNotifying, setIsContinuouslyNotifying] = useState(false);

  const originalTitleRef = useRef<string | null>(null);

  // 初期タイトルを保存
  useEffect(() => {
    if (typeof document !== 'undefined') {
      originalTitleRef.current = document.title;
    }
  }, []);

  const triggerNotification = useCallback((message: string, isSlouching: boolean) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    // --- タイトル通知 (常に実行) ---
    if (isSlouching) {
      document.title = "⚠️猫背になっています！";
    } else {
      if (originalTitleRef.current) {
        document.title = originalTitleRef.current;
      }
    }

    if (!isSlouching) return;

    // --- 選択された通知 ---
    if (window.electron) {
      // Electron environment
      switch (notificationType) {
        case 'animation':
          switch (animationType) {
            case 'toggle': window.electron.showAnimationNotification?.(); break;
            case 'cat_hand': window.electron.showCatHandNotification?.(); break;
            case 'noise': window.electron.showNoiseNotification?.(); break;
          }
          break;
        case 'desktop':
          window.electron.showNotification?.({
            title: "syakitto",
            body: message,
            silent: true,
            icon: '/icons/syakitto_w_trans.png'
          });
          break;
        case 'voice':
          if (notificationSound === 'voice') {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = "ja-JP";
            speechSynthesis.speak(utterance);
          } else if (notificationSound.endsWith('.mp3')) {
            const audio = new Audio(`/sounds/${notificationSound}`);
            audio.play();
          }
          break;
      }
    } else {
      // Web browser environment
      switch (notificationType) {
        case 'desktop':
          if (Notification.permission === 'granted') {
            new Notification("syakitto", {
              body: message,
              silent: true,
              icon: '/icons/syakitto_w_trans.png'
            });
          } else { // 'denied' or 'default'
            onNotificationBlocked();
            return;
          }
          break;
        case 'voice':
          if (notificationSound === 'voice') {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.lang = "ja-JP";
            speechSynthesis.speak(utterance);
          } else if (notificationSound.endsWith('.mp3')) {
            const audio = new Audio(`/sounds/${notificationSound}`);
            audio.play();
          }
          break;
      }
    }
  }, [notificationType, notificationSound, animationType, onNotificationBlocked]);

  // --- 猫背通知トリガー ---
  useEffect(() => {
    if (isPaused) return;
    const { slouch: threshold, duration: delay, reNotificationMode, cooldownTime } = settings.threshold;
    const now = Date.now();

    const isSlouchingNow = slouchScore > threshold;

    // 姿勢が戻った場合の処理
    if (!isSlouchingNow) {
        triggerNotification("", false); // タイトルをリセット
        if (notificationTimer.current) {
            clearTimeout(notificationTimer.current);
            notificationTimer.current = null;
        }
        if (isContinuouslyNotifying) {
            setIsContinuouslyNotifying(false);
        }
        return;
    }

    // 猫背になった場合の通知ロジック
    if (reNotificationMode === 'cooldown' && !notificationTimer.current && now - lastNotificationTime > cooldownTime * 1000) {
      notificationTimer.current = setTimeout(() => {
        triggerNotification("猫背になっています。姿勢を直してください。", true);
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
  }, [slouchScore, lastNotificationTime, settings, isContinuouslyNotifying, triggerNotification, isPaused]);

  // --- 連続通知の実行 ---
  useEffect(() => {
    if (!isContinuouslyNotifying || isPaused) return;

    triggerNotification("猫背になっています。姿勢を直してください。", true);
    setLastNotificationTime(Date.now());

    const interval = setInterval(() => {
      triggerNotification("猫背になっています。姿勢を直してください。", true);
      setLastNotificationTime(Date.now());
    }, settings.threshold.continuousInterval * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isContinuouslyNotifying, settings.threshold.continuousInterval, triggerNotification, isPaused]);
};