"use client";

interface ControlButtonsProps {
  isPaused: boolean;
  onTogglePause: () => void;
  isCalibrating: boolean;
  isCalibrated: boolean;
  onCalibrate: () => Promise<void>;
  calibrationTimestamp: Date | null;
}

const ControlButtons = ({
  isPaused,
  onTogglePause,
  isCalibrating,
  isCalibrated,
  onCalibrate,
  calibrationTimestamp,
}: ControlButtonsProps) => {
  return (
    <>
      <div className="flex space-x-4 mb-4">
        <button
          onClick={onTogglePause}
          className="w-48 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
        >
          {isPaused ? '▶ 再開' : '❚❚ 一時停止'}
        </button>
        <button
          onClick={onCalibrate}
          className="w-48 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isCalibrating}
        >
          {isCalibrating ? '記録中...' : (isCalibrated ? '良い姿勢を再記録' : '良い姿勢を記録')}
        </button>
      </div>
      <p className="text-sm text-gray-400 mb-4">
        {isCalibrated && calibrationTimestamp ? `良い姿勢を記録済み (${calibrationTimestamp.toLocaleTimeString()})` : "良い姿勢が記録されていません"}
      </p>
    </>
  );
};

export default ControlButtons;
