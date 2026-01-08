import { useRef, useState, useEffect, useCallback } from "react";
import { usePoseDetection } from "./usePoseDetection";
import { useNotification } from "./useNotification";
import { DEFAULT_SETTINGS } from "./settings";

export const usePostureApp = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSlouchDetectionEnabled, setIsSlouchDetectionEnabled] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isElectron, setIsElectron] = useState(false);
  const [animationType, setAnimationType] = useState('toggle'); // 'toggle', 'cat_hand', 'noise', 'dimmer'
  const [isWelcomeOpen, setIsWelcomeOpenState] = useState(() => {
    // For SSR safety
    if (typeof window === 'undefined') {
      return false;
    }
    return !localStorage.getItem('hasSeenWelcomePopup');
  });
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpenState] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [isPostureSettingsOpen, setIsPostureSettingsOpen] = useState(false);
  const [isNotificationHelpOpen, setIsNotificationHelpOpen] = useState(false);



  const handleWelcomePopupClose = () => {
    setIsWelcomeOpenState(false);
    localStorage.setItem('hasSeenWelcomePopup', 'true');

    const hasSeenNotificationSettingsPopup = localStorage.getItem('hasSeenNotificationSettingsPopup');
    if (!hasSeenNotificationSettingsPopup) {
      setIsNotificationSettingsOpenState(true);
    }
  };

  const handleNotificationSettingsPopupClose = () => {
    setIsNotificationSettingsOpenState(false);
    localStorage.setItem('hasSeenNotificationSettingsPopup', 'true');
  };

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationTimestamp, setCalibrationTimestamp] = useState<Date | null>(null);
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);
  const [isCameraViewVisible, setIsCameraViewVisible] = useState(true);

  const { slouchScore, isCalibrated, calibrate, scoreHistory, stopCamera, resetState: resetPoseState } = usePoseDetection({
    videoRef,
    isPaused,
    isRecordingEnabled,
    isEnabled: isSlouchDetectionEnabled,
  });

  const setSlouchDetectionEnabled = useCallback((enabled: boolean) => {
    setIsSlouchDetectionEnabled(enabled);
    if (!enabled) {
      resetPoseState();
    }
  }, [resetPoseState]);

  useEffect(() => {
    if (window.electron?.isElectron) {
      setIsElectron(true);
      const handleBeforeQuit = () => {
        try {
          setSlouchDetectionEnabled(false);
          stopCamera();
        } catch (e) {
          console.error('[Renderer] Error during cleanup:', e);
        } 
        window.electron?.cleanupComplete();
      };
      window.electron.onBeforeQuit(handleBeforeQuit);
      return () => window.electron?.removeOnBeforeQuit();
    }
  }, [isElectron, stopCamera, resetPoseState, setSlouchDetectionEnabled]);

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

  // Dimmerアニメーションのスコア更新専用Effect
  useEffect(() => {
    if (isElectron && animationType === 'dimmer') {
      window.electron.requestDimmerUpdate(slouchScore);
    }
  }, [slouchScore, animationType, isElectron]);

  // Dimmerアニメーションの有効/無効化とアンマウント時のクリーンアップEffect
  useEffect(() => {
    if (!isElectron) return;

    // animationTypeが 'dimmer' でなくなった場合にウィンドウを閉じる
    if (animationType !== 'dimmer') {
      window.electron.requestDimmerUpdate(0);
    }

    // コンポーネントがアンマウントされる際のクリーンアップ
    return () => {
      if (window.electron) {
        window.electron.requestDimmerUpdate(0);
      }
    };
  }, [animationType, isElectron]);

  return {
    videoRef,
    isPaused,
    setIsPaused,
    isSlouchDetectionEnabled,
    setSlouchDetectionEnabled,
    settings,
    setSettings,
    isElectron,
    isWelcomeOpen,
    handleWelcomePopupClose,
    isNotificationSettingsOpen,
    handleNotificationSettingsPopupClose,
    isShortcutHelpOpen,
    setIsShortcutHelpOpen,
    isPostureSettingsOpen,
    setIsPostureSettingsOpen,
    isNotificationHelpOpen,
    setIsNotificationHelpOpen,
    isCalibrating,
    calibrationTimestamp,
    isRecordingEnabled,
    setIsRecordingEnabled,
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