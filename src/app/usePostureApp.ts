import { useRef, useState, useEffect, useCallback } from "react";
import { usePoseDetection } from "./usePoseDetection";
import { useNotification } from "./useNotification";
import { DEFAULT_SETTINGS } from "./settings";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

export const usePostureApp = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSlouchDetectionEnabled, setIsSlouchDetectionEnabled] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isElectron, setIsElectron] = useState(false);
  const [animationType, setAnimationType] = useState('toggle'); // 'toggle', 'cat_hand', 'noise', 'dimmer'
  const [isWelcomeOpen, setIsWelcomeOpenState] = useState(false); // Default to false, controlled by useEffect
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpenState] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);

  useEffect(() => {
    const hasSeenWelcomePopup = localStorage.getItem('hasSeenWelcomePopup');
    if (!hasSeenWelcomePopup) {
      setIsWelcomeOpenState(true);
    }
  }, []);

  const handleWelcomePopupClose = useCallback(() => {
    setIsWelcomeOpenState(false);
    localStorage.setItem('hasSeenWelcomePopup', 'true');

    const hasSeenNotificationSettingsPopup = localStorage.getItem('hasSeenNotificationSettingsPopup');
    if (!hasSeenNotificationSettingsPopup) {
      setIsNotificationSettingsOpenState(true);
    }
  }, []);

  const handleNotificationSettingsPopupClose = useCallback(() => {
    setIsNotificationSettingsOpenState(false);
    localStorage.setItem('hasSeenNotificationSettingsPopup', 'true');
  }, []);

  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationTimestamp, setCalibrationTimestamp] = useState<Date | null>(null);
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);
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

  const handleCalibrate = useCallback(async () => {
    setIsCalibrating(true);
    await calibrate();
    setCalibrationTimestamp(new Date());
    setIsCalibrating(false);
  }, [calibrate]);

  const handleDownload = () => {
    if (window.confirm('macOS版インストーラーをダウンロードしますか？')) {
      window.location.href = 'https://github.com/TsubasaShioda/syakitto/releases/download/v0.2.4/syakitto-0.2.4-arm64.dmg';
    }
  };

  // ショートカットハンドラー
  const handleShortcut = useCallback((action: string) => {
    // モーダルが開いている場合はEscのみ処理
    const hasModalOpen = isWelcomeOpen || isNotificationSettingsOpen || isShortcutHelpOpen;

    if (hasModalOpen && action !== 'CLOSE_MODAL') {
      return;
    }

    switch (action) {
      case 'SHOW_SHORTCUTS':
        setIsShortcutHelpOpen(true);
        break;

      case 'CLOSE_MODAL':
        // 開いているモーダルを閉じる
        if (isShortcutHelpOpen) {
          setIsShortcutHelpOpen(false);
        } else if (isWelcomeOpen) {
          handleWelcomePopupClose();
        } else if (isNotificationSettingsOpen) {
          handleNotificationSettingsPopupClose();
        }
        break;

      case 'TOGGLE_SLOUCH_DETECTION':
        setIsSlouchDetectionEnabled(prev => !prev);
        break;

      case 'TOGGLE_CAMERA':
        setIsCameraViewVisible(prev => !prev);
        break;

      case 'TOGGLE_PAUSE':
        setIsPaused(prev => !prev);
        break;

      case 'CALIBRATE':
        handleCalibrate();
        break;

      default:
        break;
    }
  }, [
    isWelcomeOpen,
    isNotificationSettingsOpen,
    isShortcutHelpOpen,
    handleWelcomePopupClose,
    handleNotificationSettingsPopupClose,
    handleCalibrate,
  ]);

  // ショートカットキーを有効化
  useKeyboardShortcuts(handleShortcut, {
    enabled: true,
    ignoreInputs: true
  });

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
    setIsSlouchDetectionEnabled,
    settings,
    setSettings,
    isElectron,
    isWelcomeOpen,
    handleWelcomePopupClose,
    isNotificationSettingsOpen,
    handleNotificationSettingsPopupClose,
    isShortcutHelpOpen,
    setIsShortcutHelpOpen,
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