import { useRef, useState, useEffect } from "react";
import { usePoseDetection } from "./usePoseDetection";
import { useNotification } from "./useNotification";
import { DEFAULT_SETTINGS, hslToRgb } from "./settings";

export const usePostureApp = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSlouchDetectionEnabled, setIsSlouchDetectionEnabled] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isElectron, setIsElectron] = useState(false);

  const [isWelcomeOpen, setIsWelcomeOpenState] = useState(false); // Default to false, controlled by useEffect

  useEffect(() => {
    // Check if the welcome popup has been shown before
    const hasSeenWelcomePopup = localStorage.getItem('hasSeenWelcomePopup');
    if (!hasSeenWelcomePopup) {
      setIsWelcomeOpenState(true); // Show welcome popup if not seen before
    }
  }, []);

  const setIsWelcomeOpen = (isOpen: boolean) => {
    setIsWelcomeOpenState(isOpen);
    if (!isOpen) {
      localStorage.setItem('hasSeenWelcomePopup', 'true'); // Mark as seen when closed
    }
  };
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationTimestamp, setCalibrationTimestamp] = useState<Date | null>(null);
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);
  const [isVisualizationEnabled, setIsVisualizationEnabled] = useState(false);
  const [isCameraViewVisible, setIsCameraViewVisible] = useState(true);

  const { slouchScore, isCalibrated, calibrate, scoreHistory, stopCamera } = usePoseDetection({
    videoRef,
    isPaused,
    isRecordingEnabled,
    isEnabled: isSlouchDetectionEnabled,
  });

  useEffect(() => {
    if (window.electron?.isElectron) {
      setIsElectron(true);

      const handleBeforeQuit = () => {
        try {
          // Note: useStateのセッターを直接呼んでも、この非同期コンテキストでは即時反映されない。
          // しかし、目的は検出を停止することなので、状態の変更自体は機能する。
          setIsSlouchDetectionEnabled(false);
          stopCamera();
        } catch (e) {
          console.error('[Renderer] Error during cleanup:', e);
        }
        // クリーンアップ処理が完了したら、すぐにメインプロセスに通知する
        window.electron?.cleanupComplete();
      };

      window.electron.onBeforeQuit(handleBeforeQuit);

      return () => {
        window.electron?.removeOnBeforeQuit();
      };
    }
  }, [isElectron, stopCamera]); // isElectronとstopCameraに依存させる
  
  const {
    notificationType,
    setNotificationType,
    notificationSound,
    setNotificationSound,
    SOUND_OPTIONS,
  } = useNotification({
    slouchScore,
    isPaused,
    settings,
  });

  const handleCalibrate = async () => {
    setIsCalibrating(true);
    await calibrate();
    setCalibrationTimestamp(new Date());
    setIsCalibrating(false);
  };

  const handleDownload = () => {
    if (window.confirm('macOS版インストーラーをダウンロードしますか？')) {
      window.location.href = 'https://github.com/TsubasaShioda/syakitto/releases/download/v0.2.3/syakitto-0.2.3-arm64.dmg';
    }
  };

  return {
    videoRef,
    isPaused,
    setIsPaused,
    isSlouchDetectionEnabled,
    setIsSlouchDetectionEnabled,
    settings,
    setSettings,
    isElectron,
    isWelcomeOpen,
    setIsWelcomeOpen,
    isCalibrating,
    calibrationTimestamp,
    isRecordingEnabled,
    setIsRecordingEnabled,
    isVisualizationEnabled,
    setIsVisualizationEnabled,
    isCameraViewVisible,
    setIsCameraViewVisible,
    slouchScore,
    isCalibrated,
    calibrate: handleCalibrate,
    scoreHistory,
    notificationType,
    setNotificationType,
    notificationSound,
    setNotificationSound,
    SOUND_OPTIONS,
    handleDownload,
  };
};