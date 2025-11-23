"use client";

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoModal = ({ isOpen, onClose }: InfoModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-gray-800 rounded-2xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600"
          aria-label="閉じる"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Syakittoの仕組みと設定</h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold">1．猫背検知</h3>
            <p>
              Syakittoは、肩と耳の位置、そして顔の大きさを検知することで猫背を判断します。
              耳が肩よりも画面に近づいていくと猫背スコアが上昇し、顔の大きさも考慮することで、カメラとの距離が変わっても正確に猫背を検知できるようになりました。
            </p>
            <p className="mt-2">
              設定では、「猫背と判断するスコア」と「この秒数続いたら通知」の2つの項目を調整できます。
              「猫背と判断するスコア」は、猫背とみなすスコアの閾値です。この数値を超えると猫背と判断されます。
              「この秒数続いたら通知」は、猫背スコアが閾値を超えた状態が指定した秒数継続した場合に通知を行うかの設定です。
              これらの数値を調整することで、ご自身の作業環境や姿勢に合わせて検知の厳しさを変更できます。
            </p>
          </div>
          <div>
            <h3 className="text-xl font-semibold">2．眠気検知</h3>
            <p>
              眠気はEAR（Eye Aspect Ratio：目の開き具合を数値で表したもの）を用いて検知されます。EARが一定の閾値を下回る時間が継続すると、「眠い」と判断されます。
            </p>
            <p className="mt-2">
              眠気検知は初期設定ではオフになっています。設定画面で「眠気検知を有効にする」をオンにすることで、眠気検知が開始され、目の開き具合（EAR）が表示されるようになります。
              眠気検知を有効にすると、「目の開き具合のしきい値」と「眠気と判断するまでの時間」を調整できるようになります。
              「目の開き具合のしきい値」は、目が閉じていると判断するEARの閾値です。
              「眠気と判断するまでの時間」は、目が閉じている状態が指定した秒数継続した場合に眠気と判断するかの設定です。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoModal;
