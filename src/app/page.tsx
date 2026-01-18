"use client";

import { useState } from 'react';
import Image from 'next/image';
import { Righteous } from 'next/font/google';

const righteous = Righteous({
  weight: '400',
  subsets: ['latin'],
});
import InfoModal from "@/app/components/InfoModal";
import ScoreDisplay from "@/app/components/ScoreDisplay";
import CameraView from "@/app/components/CameraView";
import ControlButtons from "@/app/components/ControlButtons";
import ActionButtons from "@/app/components/ActionButtons";
import NotificationSelector from "@/app/components/NotificationSelector";
import WelcomePopup from "@/app/components/WelcomePopup";
import DownloadModal from "@/app/components/DownloadModal";
import { usePostureApp } from "@/app/usePostureApp"; // usePostureAppからerrorを受け取る
import PomodoroTimer from "@/app/components/PomodoroTimer";
import PostureSettings from "@/app/components/PostureSettings";
import InfoBanner from "@/app/components/InfoBanner";
import AdvancedNotificationSettings from "@/app/components/AdvancedNotificationSettings";
import { NotificationPermissionFlowModal } from "@/app/components/NotificationPermissionFlowModal";
import ShortcutHelp from "@/app/components/ShortcutHelp";
import ShortcutButton from "@/app/components/ShortcutButton";
import Tutorial from './components/Tutorial';
import './components/Tutorial.css';

const SlouchInfo = () => (
  <div className="bg-[#a8d5ba]/10 rounded-3xl p-6 border border-[#a8d5ba]/30">
    <p className="text-gray-700 leading-relaxed mb-3">
      Syakittoは、肩と耳の位置、そして顔の大きさを検知することで猫背を判断します。
      耳が肩よりも画面に近づいていくと猫背スコアが上昇し、顔の大きさも考慮することで、カメラとの距離が変わっても正確に猫背を検知できるようになりました。
    </p>
    <p className="text-gray-700 leading-relaxed">
      設定では、「猫背と判断するスコア」と「この秒数続いたら通知」の2つの項目を調整できます。
      「猫背と判断するスコア」は、猫背とみなすスコアの閾値です。この数値を超えると猫背と判断されます。
      「この秒数続いたら通知」は、猫背スコアが閾値を超えた状態が指定した秒数継続した場合に通知を行うかの設定です。
      これらの数値を調整することで、ご自身の作業環境や姿勢に合わせて検知の厳しさを変更できます。
    </p>
  </div>
);

// エラー表示用のバナーコンポーネントを追加
const ErrorBanner = ({ message, onClose }: { message: string; onClose: () => void }) => (
  <div className="fixed top-0 left-0 right-0 z-[100] bg-red-500/90 backdrop-blur-sm text-white px-6 py-3 shadow-lg flex justify-between items-center animate-slide-down">
    <div className="flex items-center gap-3">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
      <span className="font-medium">{message}</span>
    </div>
    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
);

export default function Home() {
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [notificationFlowStep, setNotificationFlowStep] = useState<'inactive' | 'test_notification' | 'confirm_delivery'>('inactive');
  const [isAdvancedNotificationModalOpen, setIsAdvancedNotificationModalOpen] = useState(false);
  const [isRecheckingPermission, setIsRecheckingPermission] = useState(false);
  const [showOsInstructionsInTestFlow, setOsInstructionsInTestFlow] = useState(false);
  const [previousNotificationType, setPreviousNotificationType] = useState<string>('');

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
    isNotificationSettingsOpen,
    handleNotificationSettingsPopupClose,
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
  } = usePostureApp();

  const handleCloseWelcomeAndStartTutorial = () => {
    handleWelcomePopupClose();
    startTutorial();
  };

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
        <header className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Image
              src="/images/syakitto_logo.png"
              alt="syakitto logo"
              width={48}
              height={48}
              className="rounded-lg"
            />
            <h1 className={`text-4xl font-bold bg-gradient-to-r from-[#3b82f6] to-[#10b981] bg-clip-text text-transparent ${righteous.className}`}>
              syakitto
            </h1>
          </div>
          <p className="text-gray-600 text-sm">リアルタイム姿勢チェッカー - あなたの健康をサポート</p>
        </header>
        
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
            <PomodoroTimer />
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
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-4 shadow-sm border border-[#c9b8a8]/30">
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-[#a8d5ba]">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                カメラ映像はローカル処理のみ。肩が見えなくてもOK。
              </p>
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-6 lg:col-start-4 lg:row-start-1 flex flex-col space-y-6">
            <CameraView
              videoRef={videoRef}
              isPaused={isPaused}
              isCameraViewVisible={isCameraViewVisible}
              onToggleCameraView={() => setIsCameraViewVisible(!isCameraViewVisible)}
            />
            <ControlButtons
              isPaused={isPaused}
              onTogglePause={() => setIsPaused(!isPaused)}
              isCalibrating={isCalibrating}
              isCalibrated={isCalibrated}
              onCalibrate={calibrate}
              calibrationTimestamp={calibrationTimestamp}
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
        showBrowserInstructions={true}
        showOsInstructions={false}
        additionalMessage={isRecheckingPermission ? "通知がまだ許可されていません。ブラウザの設定を再度確認してください。" : undefined}
        title="ブラウザの通知設定を確認してください"
      />
      
      <DownloadModal isOpen={isDownloadModalOpen} onClose={() => setIsDownloadModalOpen(false)} onDownload={handleDownload} />

      {/* ショートカット機能 */}
      <ShortcutHelp
        isOpen={isShortcutHelpOpen}
        onClose={() => setIsShortcutHelpOpen(false)}
      />
      <ShortcutButton onClick={() => setIsShortcutHelpOpen(true)} />

      <ActionButtons onDownload={handleDownloadButtonClick} isElectron={isElectron} />
    </main>
  );
}