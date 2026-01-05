"use client";

import { useState } from 'react';
import InfoModal from "@/app/components/InfoModal";
import ScoreDisplay from "@/app/components/ScoreDisplay";
import CameraView from "@/app/components/CameraView";
import ControlButtons from "@/app/components/ControlButtons";
import ActionButtons from "@/app/components/ActionButtons";
import NotificationSelector from "@/app/components/NotificationSelector";
import WelcomePopup from "@/app/components/WelcomePopup";
import DownloadModal from "@/app/components/DownloadModal";
import NotificationSettingsPopup from "@/app/components/NotificationSettingsPopup";
import { usePostureApp } from "@/app/usePostureApp";
import PomodoroTimer from "@/app/components/PomodoroTimer";
import PostureSettings from "@/app/components/PostureSettings";
import InfoBanner from "@/app/components/InfoBanner";
import AdvancedNotificationSettings from "@/app/components/AdvancedNotificationSettings";

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

const NotificationHelpPreamble = () => (
    <div className="text-sm text-gray-700 bg-gray-100 p-4 rounded-xl mb-4 border border-gray-200">
        <p className="mb-2">デスクトップ通知は、<strong>① Webサイト（Syakitto）への許可</strong>と、<strong>② OS（お使いのPC）での許可</strong>の2段階で設定されている場合があります。</p>
        <p>通知が届かない場合は、両方の設定が許可されているかご確認ください。</p>
    </div>
);


export default function Home() {
  const [infoModalContent, setInfoModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isPostureSettingsOpen, setIsPostureSettingsOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isAdvancedNotificationModalOpen, setIsAdvancedNotificationModalOpen] = useState(false);
  const [isNotificationHelpOpen, setIsNotificationHelpOpen] = useState(false);

  const handleNotificationBlocked = () => {
    if (typeof Notification === 'undefined') return;
    const perm = Notification.permission;
    if (perm === 'denied') {
      setIsAdvancedNotificationModalOpen(true);
    } else if (perm === 'default') {
      setIsNotificationModalOpen(true);
    }
  };

  const {
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
  } = usePostureApp({ onNotificationBlocked: handleNotificationBlocked });

  const handleSlouchInfoOpen = () => {
    setInfoModalContent({
      title: "猫背検知について",
      content: <SlouchInfo />,
    });
  };

  const handleDownloadButtonClick = () => {
    setIsDownloadModalOpen(true);
  };

  const handleToggleSlouchDetection = () => {
    if (!isSlouchDetectionEnabled) {
      const perm = typeof Notification !== 'undefined' ? Notification.permission : 'default';
      if (perm !== 'granted') {
        handleNotificationBlocked();
      }
    }
    setIsSlouchDetectionEnabled(!isSlouchDetectionEnabled);
  };

  const handleRequestPermissionFromModal = () => {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        setIsSlouchDetectionEnabled(true);
      }
      setIsNotificationModalOpen(false);
    });
  };

  return (
    <main className="relative min-h-screen flex flex-col bg-[#f7f2ee]">
      <InfoBanner />
      <div className="flex-grow flex flex-col p-6">
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold mb-2 text-[#5a8f7b]">
            syakitto
          </h1>
          <p className="text-gray-600 text-sm">リアルタイム姿勢チェッカー - あなたの健康をサポート</p>
        </header>
        
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          {/* スコア表示 */}
          <div className="md:col-start-2 lg:col-span-3 lg:col-start-10 lg:row-start-1 overflow-y-auto space-y-6">
            {isCalibrated ? (
              <>
                <ScoreDisplay
                  slouchScore={slouchScore}
                  isSlouchDetectionEnabled={isSlouchDetectionEnabled}
                  onToggleSlouch={handleToggleSlouchDetection}
                  onInfoClick={handleSlouchInfoOpen}
                  settings={settings}
                  onSettingsClick={() => setIsPostureSettingsOpen(true)}
                />
              </>
            ) : (
              <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-[#f4d06f]/40 text-center">
                <h3 className="font-semibold text-lg text-gray-800 mb-2">姿勢判定を開始します</h3>
                <p className="text-sm text-gray-600">
                  まずはじめに、下の「良い姿勢を記録」ボタンを押して、あなたの正しい姿勢をカメラに記録してください。
                </p>
              </div>
            )}
            <PomodoroTimer />
          </div>

          {/* 通知設定 */}
          <div className="md:col-start-1 md:row-start-1 lg:col-span-3 lg:col-start-1 lg:row-start-1 space-y-6 overflow-y-auto">
            <NotificationSelector
              notificationType={notificationType}
              setNotificationType={setNotificationType}
              isElectron={isElectron}
              settings={settings}
              setSettings={setSettings}
              notificationSound={notificationSound}
              setNotificationSound={setNotificationSound}
              SOUND_OPTIONS={SOUND_OPTIONS}
              animationType={animationType}
              setAnimationType={setAnimationType}
              onHelpClick={() => setIsNotificationHelpOpen(true)}
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

          {/* カメラとコントロール */}
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
              isCalibrated={isCalibrated} // Add this line
              onCalibrate={calibrate}
              calibrationTimestamp={calibrationTimestamp}
            />
          </div>
        </div>
      </div>

      <WelcomePopup isOpen={isWelcomeOpen} onClose={handleWelcomePopupClose} />

      {/* 通知設定ポップアップ */}
      <NotificationSettingsPopup isOpen={isNotificationSettingsOpen} onClose={handleNotificationSettingsPopupClose} />

      {infoModalContent && (
        <InfoModal 
          isOpen={!!infoModalContent} 
          onClose={() => setInfoModalContent(null)}
          title={infoModalContent.title}
        >
          {infoModalContent.content}
        </InfoModal>
      )}

      <InfoModal
        isOpen={isPostureSettingsOpen}
        onClose={() => setIsPostureSettingsOpen(false)}
        title="猫背検知設定"
      >
        <PostureSettings settings={settings} setSettings={setSettings} />
      </InfoModal>
      
      <InfoModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        title="デスクトップ通知を許可しますか？"
      >
        <div>
          <p className="text-gray-700 leading-relaxed mb-6">Syakittoからの通知を受け取るには、ブラウザの許可が必要です。「許可する」をクリックすると、姿勢に関するアラートが届くようになります。</p>
          <div className="flex justify-end gap-4">
            <button onClick={() => setIsNotificationModalOpen(false)} className="text-gray-600 px-6 py-2 rounded-xl hover:bg-gray-200 transition-colors">後で</button>
            <button onClick={handleRequestPermissionFromModal} className="bg-[#5a8f7b] text-white px-6 py-2 rounded-xl hover:bg-[#4a7f6b] transition-colors">許可する</button>
          </div>
        </div>
      </InfoModal>
      
      <AdvancedNotificationSettings 
        isOpen={isAdvancedNotificationModalOpen}
        onClose={() => setIsAdvancedNotificationModalOpen(false)}
      />
      
      <AdvancedNotificationSettings 
        isOpen={isNotificationHelpOpen}
        onClose={() => setIsNotificationHelpOpen(false)}
        preamble={<NotificationHelpPreamble />}
      />

      {/* DownloadModalの追加 */}
      <DownloadModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onDownload={handleDownload}
      />

      <ActionButtons
        onDownload={handleDownloadButtonClick}
        isElectron={isElectron}
      />
    </main>
  );
}