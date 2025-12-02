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
    <div className="absolute inset-0 bg-[#2d3436]/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 relative border border-[#c9b8a8]/40 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 bg-[#c9b8a8]/30 hover:bg-[#c9b8a8]/50 text-gray-700 rounded-2xl flex items-center justify-center transition-all duration-200 hover:scale-110"
          aria-label="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
        <h2 className="text-3xl font-bold text-[#5a8f7b] mb-8 flex items-center gap-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          Syakittoの仕組みと設定
        </h2>
        <div className="space-y-6">
          <div className="bg-[#a8d5ba]/10 rounded-3xl p-6 border border-[#a8d5ba]/30">
            <h3 className="text-xl font-semibold text-[#5a8f7b] mb-4 flex items-center gap-2">
              <span className="bg-[#a8d5ba] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">1</span>
              猫背検知
            </h3>
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
          <div className="bg-[#b8c9b8]/10 rounded-3xl p-6 border border-[#b8c9b8]/30">
            <h3 className="text-xl font-semibold text-[#5a8f7b] mb-4 flex items-center gap-2">
              <span className="bg-[#b8c9b8] text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">2</span>
              眠気検知
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              眠気はEAR（Eye Aspect Ratio：目の開き具合を数値で表したもの）を用いて検知されます。EARが一定の閾値を下回る時間が継続すると、「眠い」と判断されます。
            </p>
            <p className="text-gray-700 leading-relaxed">
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
