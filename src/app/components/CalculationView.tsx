"use client";

interface CalculationViewProps {
  debugValues: Record<string, number | string>;
  isCalibrated: boolean;
}

const CalculationView = ({ debugValues, isCalibrated }: CalculationViewProps) => {
  const renderValue = (value: number | string | undefined) => {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value || '---';
  };

  return (
    <div className="w-full bg-gray-800 rounded-lg p-4 text-sm text-gray-300">
      <h3 className="text-lg font-bold text-white mb-2 border-b border-gray-700 pb-1">
        猫背スコアの仕組み
      </h3>
      
      <div className="space-y-3">
        <div>
          <p className="font-bold text-cyan-400">Step 1: 「背筋の伸び具合」を計算</p>
          <p className="text-xs text-gray-400">背筋の伸び具合 = (A) 耳と肩の距離 ÷ (B) 体の高さ</p>
          <div className="pl-2 mt-1">
            <p>A: {renderValue(typeof debugValues.shoulderY === 'number' && typeof debugValues.earY === 'number' ? debugValues.shoulderY - debugValues.earY : undefined)}</p>
            <p>B: {renderValue(debugValues.bodyHeight)}</p>
            <p>結果: <span className="font-bold">{renderValue(debugValues.defaultPostureRatio)}</span> <span className="text-xs">(基準より低いと猫背)</span></p>
          </div>
        </div>

        {isCalibrated && (
          <>
            <div>
              <p className="font-bold text-purple-400">Step 2: カメラとの距離を補正</p>
              <p className="text-xs text-gray-400">顔サイズ比率 = 現在の顔サイズ ÷ 基準の顔サイズ</p>
              <div className="pl-2 mt-1">
                <p>結果: <span className="font-bold">{renderValue(debugValues.faceSizeRatio)}</span> <span className="text-xs">(1より大きいと前のめり)</span></p>
              </div>
            </div>

            <div>
              <p className="font-bold text-red-400">Step 3: 最終スコアを算出</p>
              <p className="text-xs text-gray-400">スコアは「基準の姿勢」と「距離で補正した今の姿勢」の差から計算します。</p>
              <div className="pl-2 mt-1">
                <p>差分: <span className="font-bold">{renderValue(debugValues.deviation)}</span> <span className="text-xs">(この差が大きいほど猫背)</span></p>
              </div>
            </div>
          </>
        )}

        {!isCalibrated && (
          <div className="mt-4 p-2 bg-gray-700 rounded-md text-center">
            <p className="text-white">「良い姿勢を記録」で、より正確な判定ができます！</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculationView;
