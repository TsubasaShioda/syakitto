// src/app/components/PrivacyInfo.tsx
"use client";

const PrivacyInfo = () => (
    <div className="space-y-6">
      <h3 className="font-bold text-xl text-gray-800 mb-4">映像の利用に関するプライバシーポリシー</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-lg text-gray-800 mb-2">1. 映像データの処理について</h4>
          <p className="text-gray-700 leading-relaxed">
            Syakittoは、ユーザーのプライバシーを最優先に考えて設計されています。カメラで撮影されたあなたの映像は、すべてお使いのコンピュータの内部（ブラウザ上）でリアルタイムに処理されます。姿勢を分析するためのすべての計算は、あなたのデバイス上でのみ実行され、完結します。
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-lg text-gray-800 mb-2">2. 映像データの外部送信・保存について</h4>
          <p className="text-gray-700 leading-relaxed">
            撮影された映像そのものや、分析によって得られた姿勢データ（顔や体の位置情報など）が、開発者を含む外部のサーバーへ送信されたり、どこかに保存されたりすることは一切ありません。あなたのデータは、あなたのものです。
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-lg text-gray-800 mb-2">3. アプリケーションが保存する情報</h4>
          <p className="text-gray-700 leading-relaxed">
            アプリケーションがお使いのデバイスに保存するのは、通知の種類や音量、キャリブレーションデータといった、アプリの動作に必要な設定情報のみです。これらの情報も、外部へ送信されることはありません。
          </p>
        </div>
      </div>
      
      <p className="text-center pt-4 text-sm text-gray-600">
        どうぞ、安心してSyakittoをご利用ください。
      </p>
    </div>
  );

export default PrivacyInfo;
