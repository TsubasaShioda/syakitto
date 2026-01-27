import { useState, useEffect, useCallback } from 'react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

import InfoModal from "@/app/components/ui/modals/InfoModal";
import { ScoreDisplay } from "@/app/components/features/ScoreDisplay";
import CameraView from "@/app/components/features/CameraView";
import ControlButtons from "@/app/components/ui/buttons/ControlButtons";
import ActionButtons from "@/app/components/ui/buttons/ActionButtons";
import NotificationSelector from "@/app/components/features/NotificationSelector";
import WelcomePopup from "@/app/components/ui/modals/WelcomePopup";
import DownloadModal from "@/app/components/ui/modals/DownloadModal";
import { useAppOrchestrator } from '@/hooks/useAppOrchestrator';
import PomodoroTimer from "@/app/components/features/PomodoroTimer";
import PostureSettings from "@/app/components/features/PostureSettings";
import InfoBanner from "@/app/components/ui/banners/InfoBanner";
import AdvancedNotificationSettings from "@/app/components/features/AdvancedNotificationSettings";
import { NotificationPermissionFlowModal } from "@/app/components/ui/modals/NotificationPermissionFlowModal";
import ShortcutHelp from "@/app/components/ui/modals/ShortcutHelp";
import ShortcutButton from "@/app/components/ui/buttons/ShortcutButton";
import Tutorial from '@/app/components/features/Tutorial';
import '@/app/components/features/Tutorial.css';
import DownloadPrompt from '@/app/components/ui/prompts/DownloadPrompt';
import ShortcutPrompt from '@/app/components/ui/prompts/ShortcutPrompt';
import CameraPermissionModal from '@/app/components/ui/modals/CameraPermissionModal';
import ErrorBanner from '@/app/components/ui/banners/ErrorBanner';
import SlouchInfo from '@/app/components/features/SlouchInfo';
import Header from '@/app/components/ui/Header';
import PrivacyInfo from '@/app/components/features/PrivacyInfo';

export default function AppView() {
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
  } = useAppOrchestrator({
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
