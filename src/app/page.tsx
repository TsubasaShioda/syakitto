"use client";

import SettingsModal from "@/app/SettingsModal";
import PostureReport from "@/app/components/PostureReport";
import InfoModal from "@/app/components/InfoModal";
import ScoreDisplay from "@/app/components/ScoreDisplay";
import CameraView from "@/app/components/CameraView";
import ControlButtons from "@/app/components/ControlButtons";
import ActionButtons from "@/app/components/ActionButtons";
import { usePostureApp } from "@/app/usePostureApp";

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
  } = usePostureApp();

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">syakitto</h1>
      
      <ScoreDisplay
        slouchScore={slouchScore}
        borderColor={borderColor}
        isDrowsinessDetectionEnabled={isDrowsinessDetectionEnabled}
        ear={ear}
        isDrowsy={isDrowsy}
      />

      <CameraView videoRef={videoRef} isPaused={isPaused} />

      <ControlButtons
        isPaused={isPaused}
        onTogglePause={() => setIsPaused(!isPaused)}
        isCalibrating={isCalibrating}
        isCalibrated={isCalibrated}
        onCalibrate={calibrate}
        calibrationTimestamp={calibrationTimestamp}
      />

      {isReportOpen && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-gray-800 rounded-2xl shadow-xl p-6 relative">
            <button
              onClick={() => setIsReportOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600"
              aria-label="レポートを閉じる"
            >
              ×
            </button>
            <PostureReport scoreHistory={scoreHistory} isRecordingEnabled={isRecordingEnabled} setIsRecordingEnabled={setIsRecordingEnabled} />
          </div>
        </div>
      )}

      <div className="mt-6 text-center">
        <div className="flex justify-center items-center space-x-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="notificationType"
              value="none"
              checked={notificationType === 'none'}
              onChange={(e) => setNotificationType(e.target.value)}
              className="form-radio h-4 w-4 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-400">なし</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="notificationType"
              value="voice"
              checked={notificationType === 'voice'}
              onChange={(e) => setNotificationType(e.target.value)}
              className="form-radio h-4 w-4 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-400">音声</span>
          </label>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="radio"
              name="notificationType"
              value="desktop"
              checked={notificationType === 'desktop'}
              onChange={(e) => setNotificationType(e.target.value)}
              className="form-radio h-4 w-4 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-gray-400">デスクトップ</span>
          </label>
          {isElectron && (
            <>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="notificationType"
                  value="flash"
                  checked={notificationType === 'flash'}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="form-radio h-4 w-4 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-400">フラッシュ</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="notificationType"
                  value="animation"
                  checked={notificationType === 'animation'}
                  onChange={(e) => setNotificationType(e.target.value)}
                  className="form-radio h-4 w-4 bg-gray-900 border-gray-600 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-gray-400">アニメーション</span>
              </label>
            </>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-400">
        ※ カメラ映像はローカル処理のみ。肩が見えなくてもOK。
      </p>

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
      />

      <InfoModal isOpen={isInfoOpen} onClose={() => setIsInfoOpen(false)} />

      <ActionButtons
        onDownload={handleDownload}
        onInfoOpen={() => setIsInfoOpen(true)}
        onReportOpen={() => setIsReportOpen(true)}
        onSettingsOpen={() => setIsSettingsOpen(true)}
      />
    </main>
  );
}