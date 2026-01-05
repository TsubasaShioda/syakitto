import { useRef, useState, useEffect } from "react";
import { usePoseDetection } from "./usePoseDetection";
import { useNotification } from "./useNotification";
import { DEFAULT_SETTINGS } from "./settings";

export const usePostureApp = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSlouchDetectionEnabled, setIsSlouchDetectionEnabled] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isElectron, setIsElectron] = useState(false);
  const [animationType, setAnimationType] = useState('toggle');
  const [isWelcomeOpen, setIsWelcomeOpenState] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpenState] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('hasSeenWelcomePopup')) {
      setIsWelcomeOpenState(true);
    }
  }, []);

  const handleWelcomePopupClose = () => {
    setIsWelcomeOpenState(false);
    localStorage.setItem('hasSeenWelcomePopup', 'true');
    if (!localStorage.getItem('hasSeenNotificationSettingsPopup')) {
      setIsNotificationSettingsOpenState(true);
    }
  };

  const handleNotificationSettingsPopupClose = () => {
    setIsNotificationSettingsOpenState(false);
    localStorage.setItem('hasSeenNotificationSettingsPopup', 'true');
  };

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationTimestamp, setCalibrationTimestamp] = useState<Date | null>(null);
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false); // Re-introduced
  const [isCameraViewVisible, setIsCameraViewVisible] = useState(true);

  const { slouchScore, isCalibrated, calibrate, scoreHistory, stopCamera } = usePoseDetection({
    videoRef,
    isPaused,
    isRecordingEnabled, // Passed correctly
    isEnabled: isSlouchDetectionEnabled,
  });

  useEffect(() => {
    if (window.electron?.isElectron) {
      setIsElectron(true);
      const handleBeforeQuit = () => {
        try {
          setIsSlouchDetectionEnabled(false);
          stopCamera();
        } catch (e) {
          console.error('[Renderer] Error during cleanup:', e);
        }
        window.electron?.cleanupComplete();
      };
      window.electron.onBeforeQuit(handleBeforeQuit);
      return () => window.electron?.removeOnBeforeQuit();
    }
  }, [isElectron, stopCamera]);

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
    animationType,
  });

  const handleCalibrate = async () => {
    setIsCalibrating(true);
    await calibrate();
    setCalibrationTimestamp(new Date());
    setIsCalibrating(false);
  };

  const handleDownload = () => {
    if (window.confirm('macOS版インストーラーをダウンロードしますか？')) {
      window.location.href = 'https://github.com/TsubasaShioda/syakitto/releases/download/v0.2.4/syakitto-0.2.4-arm64.dmg';
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
    handleWelcomePopupClose,
    isNotificationSettingsOpen,
    handleNotificationSettingsPopupClose,
    isCalibrating,
    calibrationTimestamp,
    isRecordingEnabled, // Returned
    setIsRecordingEnabled, // Returned
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
    animationType,
    setAnimationType,
  };
};