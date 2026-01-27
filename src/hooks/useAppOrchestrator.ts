import { useRef, useState, useEffect, useCallback } from "react";
import { usePoseDetection } from "./usePoseDetection";
import { useNotification } from "./useNotification";
import { Settings } from "@/types/electron-api.d";

/**
 * @file useAppOrchestrator.ts
 * @description このアプリケーションのフロントエンドにおける「頭脳」の役割を担うカスタムフック。
 * アプリケーション全体のグローバルな状態管理、主要なビジネスロジックの統括、
 * `usePoseDetection`や`useNotification`といった専門的なフックの調整を行います。
 * "Orchestrator"（指揮者）という名前の通り、各機能が協調して動作するように全体を指揮します。
 */

// アプリケーションの初期設定値
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

// フックのPropsの型定義
interface UseAppOrchestratorProps {
  onNotificationBlocked?: () => void;
  setIsCameraPermissionModalOpen: (isOpen: boolean) => void;
}

/**
 * アプリケーション全体のロジックと状態を管理するカスタムフック。
 * @param {UseAppOrchestratorProps} props - フックの動作をカスタマイズするためのプロパティ。
 * @returns アプリケーションの状態と、それを操作するための関数のセット。
 */
export const useAppOrchestrator = ({ 
  onNotificationBlocked = () => {},
  setIsCameraPermissionModalOpen,
}: UseAppOrchestratorProps) => {
  // --- 状態管理 (useState) ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false); // アプリの一時停止状態
  const [isSlouchDetectionEnabled, setIsSlouchDetectionEnabled] = useState(true); // 猫背検出機能の有効/無効
  const [settings, setSettingsState] = useState<Settings>(initialSettings); // アプリ設定
  const [isElectron, setIsElectron] = useState(false); // Electron環境かどうかの判定
  const [animationType, setAnimationType] = useState('toggle'); // ビジュアル通知の種類
  
  // モーダルやポップアップの表示状態
  const [isWelcomeOpen, setIsWelcomeOpenState] = useState(false);
  const [isShortcutHelpOpen, setIsShortcutHelpOpen] = useState(false);
  const [isPostureSettingsOpen, setIsPostureSettingsOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationTimestamp, setCalibrationTimestamp] = useState<Date | null>(null);
  const [isCameraViewVisible, setIsCameraViewVisible] = useState(true);
  
  const [cameraPermissionState, setCameraPermissionState] = useState<PermissionState>('prompt'); // カメラ権限の状態
  const [error, setError] = useState<string | null>(null); // エラーメッセージ

  // --- 副作用 (useEffect) ---

  // 初回マウント時の処理
  useEffect(() => {
    // ウェルカムポップアップの表示判定
    if (!localStorage.getItem('hasSeenWelcomePopup')) {
      setIsWelcomeOpenState(true);
    }

    // Electron環境であるかを確認し、設定を読み込む
    const checkIsElectron = async () => {
      if (window.electron?.isElectron) {
        setIsElectron(true);
        const loadedSettings = await window.electron.getSettings();
        setSettingsState(prev => ({...prev, ...loadedSettings}));
      }
    };
    checkIsElectron();
  }, []);

  // --- 専門フックの呼び出し ---

  // 姿勢検出ロジックをカプセル化したフック
  const { slouchScore, isCalibrated, calibrate, stopCamera, resetState: resetPoseState } = usePoseDetection({
    videoRef,
    isPaused,
    isEnabled: isSlouchDetectionEnabled,
    onError: setError,
  });

  // 通知ロジックをカプセル化したフック
  useNotification({
    slouchScore,
    isPaused,
    settings,
    notificationType: settings.notification.type,
    notificationSound: settings.notification.soundFile,
    animationType,
    onNotificationBlocked,
  });

  // --- コールバック関数 (useCallback & 通常関数) ---

  // チュートリアルを開始する
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
  // ... 他のチュートリアル関連関数

  /**
   * 設定を更新し、Electron環境であればメインプロセスに保存を依頼する。
   * @param {Partial<Settings>} newSettings - 更新する設定項目。
   */
  const setSettings = useCallback((newSettings: Partial<Settings>) => {
    setSettingsState(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      if (isElectron) {
        window.electron.saveSettings(updatedSettings);
      }
      return updatedSettings;
    });
  }, [isElectron]);

  // 通知タイプを更新する
  const setNotificationType = useCallback((type: string) => {
    setSettings({
      notification: {
        ...settings.notification,
        type: type as Settings['notification']['type'],
      },
    });
  }, [settings.notification, setSettings]);
  
  // 通知音を更新する
  const setNotificationSound = useCallback((soundFile: string) => {
    setSettings({
      notification: {
        ...settings.notification,
        soundFile: soundFile,
      },
    });
  }, [settings.notification, setSettings]);

  // ウェルカムポップアップを閉じたときの処理
  const handleWelcomePopupClose = () => {
    setIsWelcomeOpenState(false);
    localStorage.setItem('hasSeenWelcomePopup', 'true');
  };
  
  // 姿勢検出機能を無効にする際に、関連する状態もリセットする
  const setSlouchDetectionEnabledWithReset = useCallback((enabled: boolean) => {
    setIsSlouchDetectionEnabled(enabled);
    if (!enabled) resetPoseState();
  }, [resetPoseState]);

  // Electron環境で、アプリ終了前にカメラを停止するなどのクリーンアップ処理を登録
  useEffect(() => {
    if (isElectron) {
      const handleBeforeQuit = () => {
        try {
          setSlouchDetectionEnabledWithReset(false);
          stopCamera();
        } catch (e) { console.error('[Renderer] Error during cleanup:', e); }
        window.electron?.cleanupComplete();
      };
      window.electron.onBeforeQuit(handleBeforeQuit);
      return () => window.electron?.removeOnBeforeQuit();
    }
  }, [isElectron, stopCamera, setSlouchDetectionEnabledWithReset]);

  // カメラ権限の状態を監視し、必要に応じて権限要求モーダルを表示
  useEffect(() => {
    if (!isSlouchDetectionEnabled || typeof navigator.permissions?.query !== 'function') return;

    let permissionStatus: PermissionStatus;
    const checkCameraPermission = async () => {
      try {
        permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermissionState(permissionStatus.state);
        
        if (permissionStatus.state !== 'granted') setIsCameraPermissionModalOpen(true);
        else setIsCameraPermissionModalOpen(false);
        
        permissionStatus.onchange = () => {
           setCameraPermissionState(permissionStatus.state);
           if (permissionStatus.state === 'granted') setIsCameraPermissionModalOpen(false);
           else setIsCameraPermissionModalOpen(true);
        };
      } catch (error) { console.error("Camera permission query failed:", error); }
    };
    checkCameraPermission();
    return () => { if (permissionStatus) permissionStatus.onchange = null; };
  }, [isSlouchDetectionEnabled, setIsCameraPermissionModalOpen]);
  
  // サウンド選択肢の定義
  const SOUND_OPTIONS = [
    { value: 'Syakiin01.mp3', label: 'シャキーン' },
    { value: 'knock01.mp3', label: 'ノック' },
    { value: 'monster-snore01.mp3', label: 'いびき' },
    { value: 'page06.mp3', label: 'ページをめくる音' },
    { value: 'cat_sweet_voice1.mp3', label: '猫の鳴き声' },
  ];

  // キャリブレーションを実行する
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
      window.location.href = 'https://github.com/TsubasaShioda/syakitto/releases/download/v0.3.0/syakitto-0.3.0-arm64.dmg';
    }
  };

  // ElectronのDimmer（画面を暗くする）機能と連携
  useEffect(() => {
    if (isElectron && animationType === 'dimmer') {
      window.electron.requestDimmerUpdate(slouchScore);
    }
  }, [slouchScore, animationType, isElectron]);
  
  // Dimmerが不要になったらリセットする
  useEffect(() => {
    if (!isElectron || animationType !== 'dimmer') {
      window.electron?.requestDimmerUpdate(0);
    }
    return () => { window.electron?.requestDimmerUpdate(0); };
  }, [animationType, isElectron]);

  // --- 返り値 ---
  // コンポーネント（View）が必要とする状態と関数を返す
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