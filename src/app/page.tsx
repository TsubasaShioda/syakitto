"use client";

import { useState } from 'react';
import SettingsModal from "@/app/SettingsModal";
import PostureReport from "@/app/components/PostureReport";
import InfoModal from "@/app/components/InfoModal";
import ScoreDisplay from "@/app/components/ScoreDisplay";
import DrowsinessDisplay from "@/app/components/DrowsinessDisplay";
import CameraView from "@/app/components/CameraView";
import ControlButtons from "@/app/components/ControlButtons";
import ActionButtons from "@/app/components/ActionButtons";
import NotificationSelector from "@/app/components/NotificationSelector";
import WelcomePopup from "@/app/components/WelcomePopup";
import { usePostureApp } from "@/app/usePostureApp";
import PomodoroTimer from "@/app/components/PomodoroTimer";

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

const DrowsinessInfo = () => (
  <div className="bg-[#b8c9b8]/10 rounded-3xl p-6 border border-[#b8c9b8]/30">
    <p className="text-gray-700 leading-relaxed mb-3">
      眠気はEAR（Eye Aspect Ratio：目の開き具合を数値で表したもの）を用いて検知されます。EARが一定の閾値を下回る時間が継続すると、「眠い」と判断されます。
    </p>
    <p className="text-gray-700 leading-relaxed">
      眠気検知は初期設定ではオフになっています。トグルをオンにすることで、眠気検知が開始され、目の開き具合（EAR）が表示されるようになります。
      眠気に関する設定は設定画面から調整できます。
    </p>
  </div>
);


export default function Home() {
  const {
    videoRef,
    isPaused,
    setIsPaused,
    isDrowsinessDetectionEnabled,
    setIsDrowsinessDetectionEnabled,
    isSlouchDetectionEnabled,
    setIsSlouchDetectionEnabled,
    settings,
    setSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    isElectron,
    isReportOpen,
    setIsReportOpen,
    isWelcomeOpen,
    setIsWelcomeOpen,
    isCalibrating,
    calibrationTimestamp,
    isRecordingEnabled,
    setIsRecordingEnabled,
    isTimerVisible,
    setIsTimerVisible,
    slouchScore,
    isCalibrated,
    calibrate,
    scoreHistory,
    isDrowsy,
    ear,
    notificationType,
    setNotificationType,
    notificationSound,
    setNotificationSound,
    SOUND_OPTIONS,
    handleDownload,
    isCameraViewVisible,
    setIsCameraViewVisible,
    // BGM related states and functions
    currentBGM,
    isBGMPlaying,
    bgmVolume,
    playBGM,
pauseBGM,
    selectBGM,
    setBGMVolume,
    BGM_OPTIONS,
  } = usePostureApp();

  const [infoModalContent, setInfoModalContent] = useState<{ title: string; content: React.ReactNode } | null>(null);

  const handleSlouchInfoOpen = () => {
    setInfoModalContent({
      title: "猫背検知について",
      content: <SlouchInfo />,
    });
  };

  const handleDrowsinessInfoOpen = () => {
    setInfoModalContent({
      title: "眠気検知について",
      content: <DrowsinessInfo />,
    });
  };

  return (
    <main className="relative min-h-screen p-6 flex flex-col">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold mb-2 text-[#5a8f7b]">
          syakitto
        </h1>
        <p className="text-gray-600 text-sm">リアルタイム姿勢チェッカー - あなたの健康をサポート</p>
      </header>
      
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {/* スコア表示 */}
        <div className="md:col-start-2 lg:col-span-3 lg:col-start-10 lg:row-start-1 overflow-y-auto space-y-6">
          <ScoreDisplay
            slouchScore={slouchScore}
            isSlouchDetectionEnabled={isSlouchDetectionEnabled}
            onToggleSlouch={() => setIsSlouchDetectionEnabled(!isSlouchDetectionEnabled)}
            onInfoClick={handleSlouchInfoOpen}
          />
          <DrowsinessDisplay
            isDrowsinessDetectionEnabled={isDrowsinessDetectionEnabled}
            onToggleDrowsiness={() => setIsDrowsinessDetectionEnabled(!isDrowsinessDetectionEnabled)}
            ear={ear}
            isDrowsy={isDrowsy}
            onInfoClick={handleDrowsinessInfoOpen}
          />
        </div>

        {/* 通知設定 */}
        <div className="md:col-start-1 md:row-start-1 lg:col-span-3 lg:col-start-1 lg:row-start-1 space-y-6 overflow-y-auto">
          {isTimerVisible && <PomodoroTimer />}
          <NotificationSelector
            notificationType={notificationType}
            setNotificationType={setNotificationType}
            isElectron={isElectron}
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
        <div className="md:col-span-2 md:row-start-2 lg:col-span-6 lg:col-start-4 lg:row-start-1 flex flex-col justify-center space-y-6">
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

      {isReportOpen && (
        <div className="fixed inset-0 bg-[#2d3436]/60 backdrop-blur-md flex items-center justify-center p-4 z-50" onClick={() => setIsReportOpen(false)}>
          <div className="w-full max-w-3xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 relative border border-[#c9b8a8]/40" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsReportOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 bg-[#c9b8a8]/30 hover:bg-[#c9b8a8]/50 text-gray-700 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110"
              aria-label="レポートを閉じる"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            <PostureReport scoreHistory={scoreHistory} isRecordingEnabled={isRecordingEnabled} setIsRecordingEnabled={setIsRecordingEnabled} />
          </div>
        </div>
      )}

      <WelcomePopup isOpen={isWelcomeOpen} onClose={() => setIsWelcomeOpen(false)} />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
        notificationType={notificationType}
        notificationSound={notificationSound}
        setNotificationSound={setNotificationSound}
        SOUND_OPTIONS={SOUND_OPTIONS}
        currentBGM={currentBGM}
        isBGMPlaying={isBGMPlaying}
        bgmVolume={bgmVolume}
        playBGM={playBGM}
        pauseBGM={pauseBGM}
        selectBGM={selectBGM}
        setBGMVolume={setBGMVolume}
        BGM_OPTIONS={BGM_OPTIONS}
      />

      {infoModalContent && (
        <InfoModal 
          isOpen={!!infoModalContent} 
          onClose={() => setInfoModalContent(null)}
          title={infoModalContent.title}
        >
          {infoModalContent.content}
        </InfoModal>
      )}


      <ActionButtons
        onDownload={handleDownload}
        onReportOpen={() => setIsReportOpen(true)}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        isTimerVisible={isTimerVisible}
        onToggleTimer={() => setIsTimerVisible(!isTimerVisible)}
        isElectron={isElectron}
      />
    </main>
  );
}