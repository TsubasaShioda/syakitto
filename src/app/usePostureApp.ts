import { useRef, useState, useEffect, useCallback } from "react";
import { usePoseDetection } from "./usePoseDetection";
import { useNotification } from "./useNotification";
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
    type: 'desktop',
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

export const usePostureApp = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSlouchDetectionEnabled, setIsSlouchDetectionEnabled] = useState(true);
  const [settings, setSettingsState] = useState<Settings>(initialSettings);
  const [isElectron, setIsElectron] = useState(false);
  const [animationType, setAnimationType] = useState('toggle');
  
  const [isWelcomeOpen, setIsWelcomeOpenState] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem('hasSeenWelcomePopup');
  });
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpenState] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [isPostureSettingsOpen, setIsPostureSettingsOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('hasSeenWelcomePopup')) {
      setIsWelcomeOpenState(true);
    }
  }, []);

  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

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
    const checkIsElectron = async () => {
      const electron = window.electron;
      if (electron?.isElectron) {
        setIsElectron(true);
        const loadedSettings = await electron.getSettings();
        setSettingsState(prev => ({...prev, ...loadedSettings}));
      }
    };
    checkIsElectron();
  }, []);

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
  });
  
  const SOUND_OPTIONS = [
    { value: 'Syakiin01.mp3', label: 'シャキーン' },
    { value: 'knock01.mp3', label: 'ノック' },
    { value: 'monster-snore01.mp3', label: 'いびき' },
    { value: 'page06.mp3', label: 'ページをめくる音' },
  ];

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
  };
};