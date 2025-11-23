"use client";

interface ScoreDisplayProps {
  slouchScore: number;
  borderColor: string;
  isDrowsinessDetectionEnabled: boolean;
  ear: number;
  isDrowsy: boolean;
}

const ScoreDisplay = ({ slouchScore, borderColor, isDrowsinessDetectionEnabled, ear }: ScoreDisplayProps) => {
  return (
    <div className="flex space-x-8">
      <div>
        <p className="text-xl mb-2 text-center">猫背スコア</p>
        <p className="text-5xl font-bold mb-6 text-center" style={{ color: borderColor }}>
          {Math.round(slouchScore)}%
        </p>
      </div>
      {isDrowsinessDetectionEnabled && (
        <div>
          <p className="text-xl mb-2 text-center">目の開き具合 (EAR)</p>
          <p className="text-5xl font-bold mb-6 text-center">
            {ear.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
};

export default ScoreDisplay;
