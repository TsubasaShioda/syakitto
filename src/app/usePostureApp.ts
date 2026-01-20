import { useRef, useState, useEffect, useCallback } from "react";
import { usePoseDetection } from "./usePoseDetection";
import { useNotification }
 from "./useNotification";
import { Settings } from "@/electron-api.d";

const initialSettings: Settings = {
  notification: {
    all: true,
    sound: true,
    soundVolume: 0.5,
    soundFile: 'Syakiin01.mp3',
    visual: true,
    visualType: 'cat_hand',
    pomodoro: true,
    type: 'voice',
  },
  threshold: {
    slouch: 60,
    duration: 10,
    reNotificationMode: 'cooldown',
    cooldownTime: 5,
    continuousInterval: 10,
  },
  drowsiness: {
    earThreshold: 0.2,
    timeThreshold: 2,
  },
  shortcut: {
    enabled: true,
    keys: 'CommandOrControl+Shift+S',
  },
  camera: {
    id: 'default',
  },
  pomodoro: {
    work: 25,
    shortBreak: 5,
    longBreak: 15,
    sessions: 4,
  },
  startup: {
    runOnStartup: false,
    startMinimized: false,
  },
};

interface UsePostureAppProps {
  onNotificationBlocked?: () => void;
  isCameraPermissionModalOpen: boolean;
  setIsCameraPermissionModalOpen: (isOpen: boolean) => void;
}

export const usePostureApp = ({ 
  onNotificationBlocked = () => {},
  isCameraPermissionModalOpen,
  setIsCameraPermissionModalOpen,
}: UsePostureAppProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSlouchDetectionEnabled, setIsSlouchDetectionEnabled] = useState(true);
  const [settings, setSettingsState] = useState<Settings>(initialSettings);
  const [isElectron, setIsElectron] = useState(false);
  const [animationType, setAnimationType] = useState('toggle');
  
  const [isWelcomeOpen, setIsWelcomeOpenState] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpenState] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [isPostureSettingsOpen, setIsPostureSettingsOpen] = useState(false);
  const [cameraPermissionState, setCameraPermissionState] = useState<PermissionState>('prompt');
  
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // ハイドレーションセーフティとチュートリアルロジック (私の修正)
    const hasSeen = localStorage.getItem('hasSeenWelcomePopup');
    if (!hasSeen) {
      setIsWelcomeOpenState(true);
    }

    // Electron設定の読み込み (mainからの変更と統合)
    const checkIsElectron = async () => {
      const electron = window.electron;
      if (electron?.isElectron) {
        setIsElectron(true);
        const loadedSettings = await electron.getSettings();
        setSettingsState(prev => ({...prev, ...loadedSettings}));
      }
    };
    checkIsElectron();
  }, []); // 空の依存配列で、マウント時に一度だけ実行

  const startTutorial = () => {
    setIsTutorialOpen(true);
    setTutorialStep(1);
  };

  const nextTutorialStep = () => {
    setTutorialStep(prev => prev + 1);
  };

  const closeTutorial = () => {
    setIsTutorialOpen(false);
    setTutorialStep(0);
  };

  const setSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettingsState(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      if (isElectron) {
        window.electron.saveSettings(updatedSettings);
      }
      return updatedSettings;
    });
  }, [isElectron]);

  const setNotificationType = useCallback((type: string) => {
    setSettings({
      notification: {
        ...settings.notification,
        type: type as Settings['notification']['type'],
      },
    });
  }, [settings.notification, setSettings]);
  
  const setNotificationSound = useCallback((soundFile: string) => {
    setSettings({
      notification: {
        ...settings.notification,
        soundFile: soundFile,
      },
    });
  }, [settings.notification, setSettings]);


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
  const [isCameraViewVisible, setIsCameraViewVisible] = useState(true);

  const { slouchScore, isCalibrated, calibrate, stopCamera, resetState: resetPoseState } = usePoseDetection({
    videoRef,
    isPaused,
    isEnabled: isSlouchDetectionEnabled,
    onError: setError,
  });

  const setSlouchDetectionEnabledWithReset = useCallback((enabled: boolean) => {
    setIsSlouchDetectionEnabled(enabled);
    if (!enabled) {
      resetPoseState();
    }
  }, [resetPoseState]);

  useEffect(() => {
    if (isElectron) {
      const handleBeforeQuit = () => {
        try {
          setSlouchDetectionEnabledWithReset(false);
          stopCamera();
        } catch (e) {
          console.error('[Renderer] Error during cleanup:', e);
        }
        window.electron?.cleanupComplete();
      };
      window.electron.onBeforeQuit(handleBeforeQuit);
      return () => window.electron?.removeOnBeforeQuit();
    }
  }, [isElectron, stopCamera, resetPoseState, setSlouchDetectionEnabledWithReset]);

  useNotification({
    slouchScore,
    isPaused,
    settings,
    notificationType: settings.notification.type,
    notificationSound: settings.notification.soundFile,
    animationType,
    onNotificationBlocked,
  });

  useEffect(() => {
    if (!isSlouchDetectionEnabled || typeof navigator.permissions?.query !== 'function') {
      return;
    }

    let permissionStatus: PermissionStatus;

    const checkCameraPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermissionState(permissionStatus.state);
        
        if (permissionStatus.state !== 'granted') {
          setIsCameraPermissionModalOpen(true);
        } else {
          setIsCameraPermissionModalOpen(false);
        }
        
        permissionStatus.onchange = () => {
           setCameraPermissionState(permissionStatus.state);
           if (permissionStatus.state === 'granted') {
              setIsCameraPermissionModalOpen(false);
           } else {
              setIsCameraPermissionModalOpen(true);
           }
        };

      } catch (error) {
        console.error("Camera permission query failed:", error);
      }
    };

    checkCameraPermission();

    return () => {
      if (permissionStatus) {
        permissionStatus.onchange = null;
      }
    };
  }, [isSlouchDetectionEnabled, setIsCameraPermissionModalOpen]);
  
  const SOUND_OPTIONS = [
    { value: 'Syakiin01.mp3', label: 'シャキーン' },
    { value: 'knock01.mp3', label: 'ノック' },
    { value: 'monster-snore01.mp3', label: 'いびき' },
    { value: 'page06.mp3', label: 'ページをめくる音' },
  ];

  const handleCalibrate = async () => {
    if (cameraPermissionState !== 'granted') {
      setIsCameraPermissionModalOpen(true);
      return;
    }
    setIsCalibrating(true);
    await calibrate();
    setCalibrationTimestamp(new Date());
    setIsCalibrating(false);
  };

  const handleDownload = () => {
    if (window.confirm('macOS版インストーラーをダウンロードしますか？')) {
      window.location.href = 'https://github.com/TsubasaShioda/syakitto/releases/download/v0.2.5/syakitto-0.2.5-arm64.dmg';
    }
  };

  useEffect(() => {
    if (isElectron && animationType === 'dimmer') {
      window.electron.requestDimmerUpdate(slouchScore);
    }
  }, [slouchScore, animationType, isElectron]);

  useEffect(() => {
    if (!isElectron) return;
    if (animationType !== 'dimmer') {
      window.electron.requestDimmerUpdate(0);
    }
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
    setSlouchDetectionEnabled: setSlouchDetectionEnabledWithReset,
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
    isCalibrating,
    calibrationTimestamp,
    isCameraViewVisible,
    setIsCameraViewVisible,
    slouchScore,
    isCalibrated,
    calibrate: handleCalibrate,
    notificationType: settings.notification.type,
    setNotificationType,
    notificationSound: settings.notification.soundFile,
    setNotificationSound,
    SOUND_OPTIONS,
    handleDownload,
    animationType,
    setAnimationType,
    isTutorialOpen,
    tutorialStep,
    startTutorial,
    nextTutorialStep,
    closeTutorial,
    error,
    setError,
    cameraPermissionState,
  };
};