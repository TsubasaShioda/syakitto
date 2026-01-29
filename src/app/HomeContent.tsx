/**
 * @file このファイルは、アプリケーションのメインUIを構成し、全体の動作を統括する中心的なReactコンポーネントです。
 * `usePostureApp` カスタムフックから主要なロジックと状態を受け取り、
 * 各種UIコンポーネント（カメラ映像、スコア表示、設定パネルなど）にそれらを渡してレンダリングします。
 *
 * 主な責務：
 * - `usePostureApp`フックと`useKeyboardShortcuts`フックの利用。
 * - アプリケーション全体のレイアウトの構築。
 * - すべてのモーダルウィンドウ（情報、ダウンロード、設定、チュートリアル等）の表示状態の管理。
 * - 各コンポーネントからのイベント（ボタンクリックなど）を処理するハンドラ関数の定義。
 * - 通知許可を取得し、テストするための複雑なフロー制御。
 * - 新規ユーザー向けのオンボーディング（ウェルカムポップアップやチュートリアル）の管理。
 */
import { useState, useEffect, useCallback } from 'react';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

import InfoModal from "@/app/components/InfoModal";
import { ScoreDisplay } from "@/app/components/ScoreDisplay";
import CameraView from "@/app/components/CameraView";
import ControlButtons from "@/app/components/ControlButtons";
import ActionButtons from "@/app/components/ActionButtons";
import NotificationSelector from "@/app/components/NotificationSelector";
import WelcomePopup from "@/app/components/WelcomePopup";
import DownloadModal from "@/app/components/DownloadModal";
import { usePostureApp } from "@/app/usePostureApp";
import PomodoroTimer from "@/app/components/PomodoroTimer";
import PostureSettings from "@/app/components/PostureSettings";
import InfoBanner from "@/app/components/InfoBanner";
import AdvancedNotificationSettings from "@/app/components/AdvancedNotificationSettings";
import { NotificationPermissionFlowModal } from "@/app/components/NotificationPermissionFlowModal";
import ShortcutHelp from "@/app/components/ShortcutHelp";
import ShortcutButton from "@/app/components/ShortcutButton";
import Tutorial from './components/Tutorial';
import './components/Tutorial.css';
import DownloadPrompt from './components/DownloadPrompt';
import ShortcutPrompt from './components/ShortcutPrompt';
import CameraPermissionModal from './components/CameraPermissionModal';
import ErrorBanner from './components/ErrorBanner';
import SlouchInfo from './components/SlouchInfo';
import Header from './components/Header';
import PrivacyInfo from './components/PrivacyInfo';

export default function HomeContent() {
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [showDownloadPrompt, setShowDownloadPrompt] = useState(false);
  const [showShortcutPrompt, setShowShortcutPrompt] = useState(false);
  const [isCameraPermissionModalOpen, setIsCameraPermissionModalOpen] = useState(false);
  const [notificationFlowStep, setNotificationFlowStep] = useState<'inactive' | 'test_notification' | 'confirm_delivery'>('inactive');
  const [isAdvancedNotificationModalOpen, setIsAdvancedNotificationModalOpen] = useState(false);
  const [isRecheckingPermission, setIsRecheckingPermission] = useState(false);
  const [showOsInstructionsInTestFlow, setOsInstructionsInTestFlow] = useState(false);
  const [previousNotificationType, setPreviousNotificationType] = useState<string>('');

  const handleNotificationBlocked = () => {
    setPreviousNotificationType(''); // On cancel, don't restore the notification type
    setIsRecheckingPermission(false);
    setIsAdvancedNotificationModalOpen(true);
  };

  const {
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
    isShortcutHelpOpen,
    setIsShortcutHelpOpen,
    isPostureSettingsOpen,
    setIsPostureSettingsOpen,
    isCalibrating,
    calibrationTimestamp,
    slouchScore,
    isCalibrated,
    calibrate,
    notificationType,
    setNotificationType,
    notificationSound,
    setNotificationSound,
    SOUND_OPTIONS,
    handleDownload,
    isCameraViewVisible,
    setIsCameraViewVisible,
    animationType,
    setAnimationType,
    isTutorialOpen,
    tutorialStep,
    startTutorial,
    nextTutorialStep,
    closeTutorial,
    error,      // エラー状態
    setError,   // エラーリセット用
    cameraPermissionState,
  } = usePostureApp({
    onNotificationBlocked: handleNotificationBlocked,
    setIsCameraPermissionModalOpen,
  });

  useEffect(() => {
    if (isShortcutHelpOpen) {
      localStorage.setItem('hasSeenShortcutHelp', 'true');
    }
  }, [isShortcutHelpOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage) {
      const LAUNCH_COUNT_KEY = 'appLaunchCount';
      let launchCount = parseInt(localStorage.getItem(LAUNCH_COUNT_KEY) || '0', 10);
      launchCount += 1;
      localStorage.setItem(LAUNCH_COUNT_KEY, launchCount.toString());

      // --- ダウンロード案内のロジック ---
      if (!isElectron) {
        const isPowerOfTwo = (n: number) => n > 0 && (n & (n - 1)) === 0;
        if (isPowerOfTwo(launchCount) && launchCount > 1) {
          setShowDownloadPrompt(true);
        }
      }

      // --- ショートカット案内のロジック ---
      const isPowerOfThree = (n: number): boolean => {
        if (n <= 0) return false;
        while (n % 3 === 0) {
          n /= 3;
        }
        return n === 1;
      };
      if (isPowerOfThree(launchCount) && launchCount > 1 && !localStorage.getItem('hasSeenShortcutHelp')) {
        setShowShortcutPrompt(true);
      }
    }
  }, [isElectron, setShowDownloadPrompt, setShowShortcutPrompt]);

  const handleCloseWelcomeAndStartTutorial = () => {
    handleWelcomePopupClose();
    startTutorial();
  };

  // ショートカットキーハンドラー
  const handleShortcut = useCallback((action: string) => {
    switch (action) {
      case 'SHOW_SHORTCUTS':
        setIsShortcutHelpOpen(true);
        break;
      case 'CLOSE_MODAL':
        // 開いているモーダルを閉じる（優先順位順）
        if (isShortcutHelpOpen) {
          setIsShortcutHelpOpen(false);
        } else if (isPostureSettingsOpen) {
          setIsPostureSettingsOpen(false);
        } else if (infoModalContent) {
          setInfoModalContent(null);
        } else if (isDownloadModalOpen) {
          setIsDownloadModalOpen(false);
        } else if (isAdvancedNotificationModalOpen) {
          setIsAdvancedNotificationModalOpen(false);
        } else if (notificationFlowStep !== 'inactive') {
          setNotificationFlowStep('inactive');
        }
        break;
      case 'TOGGLE_SLOUCH_DETECTION':
        setSlouchDetectionEnabled(!isSlouchDetectionEnabled);
        break;
      case 'TOGGLE_CAMERA':
        setIsCameraViewVisible(!isCameraViewVisible);
        break;
      case 'CALIBRATE':
        if (!isCalibrating) {
          calibrate();
        }
        break;
      case 'TOGGLE_PAUSE':
        setIsPaused(!isPaused);
        break;
      case 'OPEN_SETTINGS':
        setIsPostureSettingsOpen(true);
        break;
      // タイマー関連のショートカットは PomodoroTimer.tsx で処理済み
      default:
        break;
    }
  }, [
    isShortcutHelpOpen,
    setIsShortcutHelpOpen,
    isPostureSettingsOpen,
    setIsPostureSettingsOpen,
    infoModalContent,
    isDownloadModalOpen,
    isAdvancedNotificationModalOpen,
    notificationFlowStep,
    isSlouchDetectionEnabled,
    setSlouchDetectionEnabled,
    isCameraViewVisible,
    setIsCameraViewVisible,
    isCalibrating,
    calibrate,
    isPaused,
    setIsPaused,
  ]);

  // ショートカットキーを有効化
  useKeyboardShortcuts(handleShortcut);

  const handleSlouchInfoOpen = () => {
    setInfoModalContent({ title: "猫背検知について", content: <SlouchInfo /> });
  };

  const handleDownloadButtonClick = () => {
    setIsDownloadModalOpen(true);
  };

  const handleCancelNotificationFlow = () => {
    if (previousNotificationType) {
      setNotificationType(previousNotificationType);
    }
    setNotificationFlowStep('inactive');
    setIsAdvancedNotificationModalOpen(false);
    setOsInstructionsInTestFlow(false);
    setIsRecheckingPermission(false);
  };

  const handleSetNotificationType = (type: string) => {
    if (type === 'desktop' && typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
      setPreviousNotificationType(notificationType);
      setIsRecheckingPermission(false);
      setIsAdvancedNotificationModalOpen(true);
    } else {
      setNotificationType(type);
    }
  };

  const startNotificationFlowFromSettings = () => {
    if (typeof Notification !== 'undefined') {
      setPreviousNotificationType(notificationType);
      setIsRecheckingPermission(false);
      setIsAdvancedNotificationModalOpen(true);
    }
  };

  const handleSettingsCompletionClick = () => {
    setIsAdvancedNotificationModalOpen(false);
    setTimeout(() => {
      if (typeof Notification !== 'undefined') {
        const perm = Notification.permission;
        if (perm === 'granted') {
          setNotificationType('desktop');
          setNotificationFlowStep('test_notification');
          setOsInstructionsInTestFlow(false);
        } else {
          setIsRecheckingPermission(true);
          setIsAdvancedNotificationModalOpen(true);
        }
      }
    }, 500);
  };

  const handleSendTestNotification = () => {
    new Notification("syakitto", { body: "これはテスト通知です。", silent: true });
    setNotificationFlowStep('confirm_delivery');
  };

  const handleConfirmNotificationYes = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('notificationTestCompleted', 'true');
    }
    setNotificationFlowStep('inactive');
    setOsInstructionsInTestFlow(false);
  };

  const handleConfirmNotificationNo = () => {
    setNotificationFlowStep('test_notification');
    setOsInstructionsInTestFlow(true);
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-[#f7f2ee]">
      {/* ▼▼▼ エラーバナーの表示処理を追加 ▼▼▼ */}
      {error && <ErrorBanner message={error} onClose={() => setError(null)} />}

      <InfoBanner />
      <div className="flex-grow flex flex-col p-6">
        <Header />

        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          <div className="md:col-start-2 lg:col-span-3 lg:col-start-10 lg:row-start-1 overflow-y-auto space-y-6">
            {isCalibrated ? (
              <ScoreDisplay
                slouchScore={slouchScore}
                isSlouchDetectionEnabled={isSlouchDetectionEnabled}
                onToggleSlouch={() => setSlouchDetectionEnabled(!isSlouchDetectionEnabled)}
                onInfoClick={handleSlouchInfoOpen}
                onSettingsClick={() => setIsPostureSettingsOpen(true)}
              />
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-[#f4d06f]/40 text-center">
                <h3 className="font-semibold text-lg text-gray-800 mb-2">姿勢判定を開始します</h3>
                <p className="text-sm text-gray-600">
                  まずはあなたの正しい姿勢をカメラに記録してください。
                </p>
              </div>
            )}
            <PomodoroTimer settings={settings} />
          </div>

          <div className="md:col-start-1 md:row-start-1 lg:col-span-3 lg:col-start-1 lg:row-start-1 space-y-6 overflow-y-auto">
            <NotificationSelector
              notificationType={notificationType}
              setNotificationType={handleSetNotificationType}
              isElectron={isElectron}
              settings={settings}
              setSettings={setSettings}
              notificationSound={notificationSound}
              setNotificationSound={setNotificationSound}
              SOUND_OPTIONS={SOUND_OPTIONS}
              animationType={animationType}
              setAnimationType={setAnimationType}
              onOpenAdvancedSettings={startNotificationFlowFromSettings}
            />
          </div>

          <div className="md:col-span-2 lg:col-span-6 lg:col-start-4 lg:row-start-1 flex flex-col space-y-6">
            <CameraView
              videoRef={videoRef}
              isPaused={isPaused}
              isCameraViewVisible={isCameraViewVisible && cameraPermissionState === 'granted'}
              onToggleCameraView={() => setIsCameraViewVisible(!isCameraViewVisible)}
            />
            <ControlButtons
              isPaused={isPaused}
              onTogglePause={() => setIsPaused(!isPaused)}
              isCalibrating={isCalibrating}
              isCalibrated={isCalibrated}
              onCalibrate={calibrate}
              calibrationTimestamp={calibrationTimestamp}
              onPrivacyInfoClick={() => setInfoModalContent({ title: "映像の利用について", content: <PrivacyInfo /> })}
            />
          </div>
        </div>
      </div>

      <WelcomePopup isOpen={isWelcomeOpen} onClose={handleCloseWelcomeAndStartTutorial} />
      {isTutorialOpen && <Tutorial step={tutorialStep} onNext={nextTutorialStep} onClose={closeTutorial} />}

      {infoModalContent && (
        <InfoModal isOpen={!!infoModalContent} onClose={() => setInfoModalContent(null)} title={infoModalContent.title}>
          {infoModalContent.content}
        </InfoModal>
      )}

      <InfoModal isOpen={isPostureSettingsOpen} onClose={() => setIsPostureSettingsOpen(false)} title="猫背検知設定">
        <PostureSettings settings={settings} setSettings={setSettings} />
      </InfoModal>

      <NotificationPermissionFlowModal
        isOpen={notificationFlowStep !== 'inactive'}
        step={notificationFlowStep === 'inactive' ? 'test_notification' : notificationFlowStep}
        onClose={handleCancelNotificationFlow}
        showOsInstructions={showOsInstructionsInTestFlow}
        onTest={handleSendTestNotification}
        onConfirmYes={handleConfirmNotificationYes}
        onConfirmNo={handleConfirmNotificationNo}
      />

      <AdvancedNotificationSettings
        isOpen={isAdvancedNotificationModalOpen}
        onClose={handleCancelNotificationFlow}
        showCompletionButton={true}
        onCompletionClick={handleSettingsCompletionClick}
        showBrowserInstructions={!isElectron}
        showOsInstructions={isElectron}
        additionalMessage={isRecheckingPermission ? "通知がまだ許可されていません。ブラウザの設定を再度確認してください。" : undefined}
        title={isElectron ? "syakittoの通知設定を確認してください" : "ブラウザの通知設定を確認してください"}
        isElectron={isElectron}
      />

      <DownloadModal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} onDownload={handleDownload} />

      {/* ショートカット機能 */}
      <ShortcutHelp
        isOpen={isShortcutHelpOpen}
        onClose={() => setIsShortcutHelpOpen(false)}
      />
      <ShortcutButton onClick={() => setIsShortcutHelpOpen(true)}>
        {showShortcutPrompt && (
          <ShortcutPrompt onClose={() => setShowShortcutPrompt(false)} />
        )}
      </ShortcutButton>

      <ActionButtons onDownload={handleDownloadButtonClick} isElectron={isElectron}>
        {showDownloadPrompt && (
          <DownloadPrompt
            onClose={() => setShowDownloadPrompt(false)}
          />
        )}
      </ActionButtons>

      <CameraPermissionModal
        isOpen={isCameraPermissionModalOpen}
        onClose={() => {
          setIsCameraPermissionModalOpen(false);
          setSlouchDetectionEnabled(false);
        }}
      />
    </main>
  );
}
