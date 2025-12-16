import { useRef, useState, useEffect } from "react";
import { usePoseDetection } from "./usePoseDetection";
import { useDrowsinessDetection } from "./useDrowsinessDetection";
import { useNotification } from "./useNotification";
import { DEFAULT_SETTINGS, hslToRgb } from "./SettingsModal";
import { useBGM, BGM_OPTIONS } from "./useBGM";

export const usePostureApp = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDrowsinessDetectionEnabled, setIsDrowsinessDetectionEnabled] = useState(false);
  const [isSlouchDetectionEnabled, setIsSlouchDetectionEnabled] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);

  const [isReportOpen, setIsReportOpen] = useState(false);
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
  const [isTimerVisible, setIsTimerVisible] = useState(false);
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
          setIsDrowsinessDetectionEnabled(false);
          stopCamera();
        } catch (e) {
          console.error('[Renderer] Error during cleanup:', e);
        }
        // クリーンアップ処理が完了したら、すぐにメインプロセスに通知する
        window.electron?.cleanupComplete();
      };

      window.electron.onBeforeQuit(handleBeforeQuit);

      return () => {
        window.electron?.removeOnBeforeQuit(handleBeforeQuit);
      };
    }
  }, [isElectron, stopCamera]); // isElectronとstopCameraに依存させる
  
  const { isDrowsy, ear } = useDrowsinessDetection({
    videoRef,
    isEnabled: isDrowsinessDetectionEnabled,
    isPaused,
    settings
  });

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

  const {
    currentBGM,
    isPlaying: isBGMPlaying,
    volume: bgmVolume,
    playBGM,
    pauseBGM,
    selectBGM,
    setBGMVolume,
  } = useBGM();

  useEffect(() => {
    if (window.electron?.updateTrayIcon) {
      const canvas = document.createElement('canvas');
      const size = 32;
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext('2d');

      if (context) {
        const hue = 120 * (1 - Math.min(slouchScore, 100) / 100);
        const [r, g, b] = hslToRgb(hue, 100, 50);
        context.fillStyle = `rgb(${r}, ${g}, ${b})`;
        context.beginPath();
        context.arc(size / 2, size / 2, size / 2 - 2, 0, 2 * Math.PI);
        context.fill();
        const dataUrl = canvas.toDataURL('image/png');
        window.electron.updateTrayIcon(dataUrl);
      }
    }
  }, [slouchScore]);

  const borderColor = `hsl(${120 * (1 - slouchScore / 100)}, 100%, 50%)`;

  const handleCalibrate = async () => {
    setIsCalibrating(true);
    await calibrate();
    setCalibrationTimestamp(new Date());
    setIsCalibrating(false);
  };

  const handleDownload = () => {
    if (window.confirm('macOS版インストーラーをダウンロードしますか？')) {
      window.location.href = 'https://github.com/TsubasaShioda/syakitto/releases/download/v0.2.1/syakitto-0.2.1-arm64.dmg';
    }
  };

  return {
    videoRef,
    isPaused,
    setIsPaused,
    isDrowsinessDetectionEnabled,
    setIsDrowsinessDetectionEnabled,
    isSlouchDetectionEnabled,
    setIsSlouchDetectionEnabled,
    settings,
    setSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    isElectron,
    isReportOpen,
    setIsReportOpen,
    isWelcomeOpen,
    setIsWelcomeOpen,
    isCalibrating,
    calibrationTimestamp,
    isRecordingEnabled,
    setIsRecordingEnabled,
    isVisualizationEnabled,
    setIsVisualizationEnabled,
    isTimerVisible,
    setIsTimerVisible,
    isCameraViewVisible,
    setIsCameraViewVisible,
    slouchScore,
    isCalibrated,
    calibrate: handleCalibrate,
    scoreHistory,
    isDrowsy,
    ear,
    notificationType,
    setNotificationType,
    notificationSound,
    setNotificationSound,
    SOUND_OPTIONS,
    borderColor,
    handleDownload,
    // BGM related states and functions
    currentBGM,
    isBGMPlaying,
    bgmVolume,
    playBGM,
    pauseBGM,
    selectBGM,
    setBGMVolume,
    BGM_OPTIONS,
  };
};