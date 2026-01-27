"use client";

const SlouchInfo = () => (
    <div className="bg-[#a8d5ba]/10 rounded-3xl p-6 border border-[#a8d5ba]/30 space-y-4">
      <p className="text-gray-700 leading-relaxed">
        Syakittoは、カメラに映るあなたの目、耳、肩の位置関係をAIが分析し、基準となる「良い姿勢」からどれだけ離れているかを「猫背スコア」としてリアルタイムに算出します。これに加えて、両目の間隔から顔の大きさの変化を読み取り、カメラとあなたの距離が変わってもスコアの精度が落ちないように補正しています。
      </p>
      <div>
        <h4 className="font-semibold text-gray-800 mb-2">設定項目について</h4>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>
            <span className="font-medium">猫背と判断するスコア:</span> この数値を高くするほど、より大きな姿勢の崩れを「猫背」と判断するようになります。低くすると、わずかな崩れでも検知されやすくなります。まずはデフォルト値で試し、通知が多いと感じたら数値を上げてみてください。
          </li>
          <li>
            <span className="font-medium">この秒数続いたら通知:</span> ここで設定した秒数だけ「猫背」の状態が続くと、通知が送られます。短い時間に設定すると、一時的な姿勢の崩れにも素早く気づけますが、通知が頻繁になることもあります。
          </li>
        </ul>
      </div>
      <p className="text-gray-700 leading-relaxed pt-2">
        これらの設定を調整して、あなたの作業スタイルに最適な「syakitto」体験を見つけてください。
      </p>
    </div>
  );

export default SlouchInfo;
