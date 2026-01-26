// src/app/components/PrivacyInfo.tsx
"use client";

const PrivacyInfo = () => (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-gray-800 mb-2">データはどこで処理されるの？</h4>
        <p className="text-gray-700 leading-relaxed">
          カメラで撮影された映像は、すべてお使いのコンピュータの内部（ブラウザ上）でリアルタイムに処理されます。姿勢分析のための計算は、あなたのデバイス上でのみ完結します。
        </p>
      </div>
      <div>
        <h4 className="font-semibold text-gray-800 mb-2">映像はどこにも送信されないの？</h4>
        <p className="text-gray-700 leading-relaxed">
          はい。撮影された映像や、そこから生成された姿勢データなどが、開発者を含め、外部のサーバーに送信されることは一切ありません。あなたのデータは、あなたのものです。
        </p>
      </div>
      <div>
        <h4 className="font-semibold text-gray-800 mb-2">何を保存しているの？</h4>
        <p className="text-gray-700 leading-relaxed">
          Syakittoが保存するのは、アプリの動作に必要な設定情報（通知の種類や音量など）のみです。映像そのものや、個人を特定できるような姿勢データは一切保存していません。
        </p>
      </div>
      <p className="text-center pt-4 text-sm text-gray-600">安心してご利用ください。</p>
    </div>
  );

export default PrivacyInfo;
