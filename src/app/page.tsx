"use client";

import SettingsModal from "@/app/SettingsModal";
import PostureReport from "@/app/components/PostureReport";
import InfoModal from "@/app/components/InfoModal";
import ScoreDisplay from "@/app/components/ScoreDisplay";
import CameraView from "@/app/components/CameraView";
import ControlButtons from "@/app/components/ControlButtons";
import ActionButtons from "@/app/components/ActionButtons";
import NotificationSelector from "@/app/components/NotificationSelector";
import { usePostureApp } from "@/app/usePostureApp";
import PomodoroTimer from "@/app/components/PomodoroTimer";

export default function Home() {
  const {
    videoRef,
    isPaused,
    setIsPaused,
    isDrowsinessDetectionEnabled,
    setIsDrowsinessDetectionEnabled,
    settings,
    setSettings,
    isSettingsOpen,
    setIsSettingsOpen,
    isElectron,
    isInfoOpen,
    setIsInfoOpen,
    isReportOpen,
    setIsReportOpen,
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
    borderColor,
    handleDownload,
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

  return (
    <main className="relative h-screen p-6 overflow-hidden flex flex-col">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold mb-2 text-[#5a8f7b]">
          syakitto
        </h1>
        <p className="text-gray-600 text-sm">リアルタイム姿勢チェッカー - あなたの健康をサポート</p>
      </header>
      
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden">
        {/* 左カラム: 通知設定 */}
        <div className="lg:col-span-3 space-y-6 overflow-y-auto">
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

        {/* 中央カラム: カメラとコントロール */}
        <div className="lg:col-span-6 flex flex-col justify-center space-y-6">
          <CameraView videoRef={videoRef} isPaused={isPaused} />

          <ControlButtons
            isPaused={isPaused}
            onTogglePause={() => setIsPaused(!isPaused)}
            isCalibrating={isCalibrating}
            isCalibrated={isCalibrated}
            onCalibrate={calibrate}
            calibrationTimestamp={calibrationTimestamp}
          />
        </div>

        {/* 右カラム: スコア表示 */}
        <div className="lg:col-span-3 overflow-y-auto">
          <ScoreDisplay
            slouchScore={slouchScore}
            borderColor={borderColor}
            isDrowsinessDetectionEnabled={isDrowsinessDetectionEnabled}
            ear={ear}
            isDrowsy={isDrowsy}
          />
        </div>
      </div>

      {isReportOpen && (
        <div className="fixed inset-0 bg-[#2d3436]/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-3xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 relative border border-[#c9b8a8]/40">
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

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        setSettings={setSettings}
        isDrowsinessDetectionEnabled={isDrowsinessDetectionEnabled}
        setIsDrowsinessDetectionEnabled={setIsDrowsinessDetectionEnabled}
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

      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />

      <ActionButtons
        onDownload={handleDownload}
        onInfoOpen={() => setIsInfoOpen(true)}
        onReportOpen={() => setIsReportOpen(true)}
        onSettingsOpen={() => setIsSettingsOpen(true)}
        isTimerVisible={isTimerVisible}
        onToggleTimer={() => setIsTimerVisible(!isTimerVisible)}
        isElectron={isElectron}
      />
    </main>
  );
}