import { useRef, useState, useEffect } from "react";
import { usePoseDetection } from "./usePoseDetection";
import { useDrowsinessDetection } from "./useDrowsinessDetection";
import { useNotification } from "./useNotification";
import { Settings, DEFAULT_SETTINGS, hslToRgb } from "./SettingsModal";

export const usePostureApp = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isDrowsinessDetectionEnabled, setIsDrowsinessDetectionEnabled] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationTimestamp, setCalibrationTimestamp] = useState<Date | null>(null);
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);
  const [isVisualizationEnabled, setIsVisualizationEnabled] = useState(false);
  const [isTimerVisible, setIsTimerVisible] = useState(false);

  const { slouchScore, isCalibrated, calibrate, scoreHistory, poses, debugValues, stopCamera } = usePoseDetection({ videoRef, isPaused, isRecordingEnabled });

  useEffect(() => {
    if (window.electron?.isElectron) {
      setIsElectron(true);

      // アプリ終了前のクリーンアップイベントを登録
      window.electron.onBeforeQuit(() => {
        console.log('Received before-quit event, stopping camera...');
        stopCamera();
        // クリーンアップ完了を通知
        setTimeout(() => {
          window.electron?.cleanupComplete();
        }, 500); // カメラ停止に少し時間を与える
      });
    }
  }, [stopCamera]);
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
      window.location.href = 'https://github.com/TsubasaShioda/syakitto/releases/download/v0.1.0/Posture.Checker-0.1.0-arm64.dmg';
    }
  };

  return {
    videoRef,
    isPaused,
    setIsPaused,
    isDrowsinessDetectionEnabled,
    setIsDrowsinessDetectionEnabled,
    settings,
    setSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    isElectron,
    isInfoOpen,
    setIsInfoOpen,
    isReportOpen,
    setIsReportOpen,
    isCalibrating,
    calibrationTimestamp,
    isRecordingEnabled,
    setIsRecordingEnabled,
    isVisualizationEnabled,
    setIsVisualizationEnabled,
    isTimerVisible,
    setIsTimerVisible,
    slouchScore,
    isCalibrated,
    calibrate: handleCalibrate,
    scoreHistory,
    poses,
    debugValues,
    isDrowsy,
    ear,
    notificationType,
    setNotificationType,
    notificationSound,
    setNotificationSound,
    SOUND_OPTIONS,
    borderColor,
    handleDownload,
  };
};