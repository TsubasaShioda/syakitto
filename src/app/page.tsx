"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";

const DEFAULT_SETTINGS = {
  threshold: 40, // %
  delay: 5, // seconds
  reNotificationMode: 'cooldown', // 'cooldown' or 'continuous'
  cooldownTime: 60, // seconds
  continuousInterval: 10, // seconds
};

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [slouchScore, setSlouchScore] = useState(0);
  const scoreHistory = useRef<number[]>([]);
  const notificationTimer = useRef<NodeJS.Timeout | null>(null);
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const [notificationType, setNotificationType] = useState("voice");
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isContinuouslyNotifying, setIsContinuouslyNotifying] = useState(false);



  // --- 初期化 ---
  useEffect(() => {
    const init = async () => {
      await tf.ready();
      await tf.setBackend("webgl");
      const model = poseDetection.SupportedModels.MoveNet;
      const detectorConfig = {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      };
      const poseDetector = await poseDetection.createDetector(model, detectorConfig);
      setDetector(poseDetector);
    };
    init();
  }, []);

  // --- カメラセットアップ ---
  useEffect(() => {
    const setupCamera = async () => {
      if (!detector || !videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360 },
          audio: false,
        });
        const video = videoRef.current;
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
        video.onplaying = () => setIsCameraReady(true);
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };
    setupCamera();
  }, [detector]);

  // --- 軽量ループ（2FPS） ---
  useEffect(() => {
    if (!detector || !isCameraReady || !videoRef.current) return;

    const analyze = async () => {
      try {
        const poses = await detector.estimatePoses(videoRef.current!);
        if (poses.length > 0) {
          const score = calculateSlouchScore(poses[0].keypoints);
          if (score !== null) smoothAndSetScore(score);
        }
      } catch (e) {
        console.warn(e);
      }
    };

    const intervalId = setInterval(analyze, 500); // 2FPS (0.5秒ごと)
    return () => clearInterval(intervalId);
  }, [detector, isCameraReady]);

  // --- 猫背スコア計算 ---
  const calculateSlouchScore = (keypoints: poseDetection.Keypoint[]): number | null => {
    const get = (name: string) => keypoints.find((k) => k.name === name);
    const leftEar = get("left_ear");
    const rightEar = get("right_ear");
    const leftEye = get("left_eye");
    const rightEye = get("right_eye");
    const leftShoulder = get("left_shoulder");
    const rightShoulder = get("right_shoulder");

    // 必要最低限の部位（耳 or 目）は必須
    if (![leftEar, rightEar, leftEye, rightEye].every(kp => kp && kp.score! > 0.4)) return null;

    const earY = (leftEar!.y + rightEar!.y) / 2;
    const eyeY = (leftEye!.y + rightEye!.y) / 2;
    const shoulderY = (leftShoulder && rightShoulder) 
      ? (leftShoulder.y + rightShoulder.y) / 2
      : eyeY + (eyeY - earY) * 2.2; // 肩が見えない場合の推定位置

    const bodyHeight = Math.abs(shoulderY - eyeY);
    if (bodyHeight < 40) return null;

    const postureRatio = (shoulderY - earY) / bodyHeight; // 正常: ~0.8, 猫背: ~1.1
    // console.log("postureRatio:", postureRatio.toFixed(3));

    // 正常0.8以下, 猫背1.1以上
    const normalized = Math.min(1, Math.max(0, (postureRatio - 0.8) / 0.3));
    return normalized * 100;
  };

  // --- スムージング ---
  const smoothAndSetScore = (score: number) => {
    const history = scoreHistory.current;
    history.push(score);
    if (history.length > 10) history.shift();
    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    setSlouchScore(avg);
  };

  const triggerNotification = useCallback(() => {
    if (notificationType === 'voice') {
      const utterance = new SpeechSynthesisUtterance("猫背になっています。姿勢を直してください。");
      utterance.lang = "ja-JP";
      speechSynthesis.speak(utterance);
    } else if (notificationType === 'desktop' && Notification.permission === 'granted') {
      new Notification("syakitto", {
        body: "猫背になっています！姿勢を正しましょう。",
        silent: true,
      });
    }
  }, [notificationType]);

  // --- デスクトップ通知の許可 ---
  useEffect(() => {
    if (notificationType === 'desktop') {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, [notificationType]);

  // --- 通知トリガー ---
  useEffect(() => {
    const { threshold, delay, reNotificationMode, cooldownTime } = settings;
    const now = Date.now();

    if (slouchScore > threshold) {
      if (reNotificationMode === 'cooldown' && !notificationTimer.current && now - lastNotificationTime > cooldownTime * 1000) {
        notificationTimer.current = setTimeout(() => {
          triggerNotification();
          setLastNotificationTime(Date.now());
          notificationTimer.current = null;
        }, delay * 1000);
      } else if (reNotificationMode === 'continuous' && !isContinuouslyNotifying) {
        notificationTimer.current = setTimeout(() => {
          if (!isContinuouslyNotifying) { // タイマー発火時にもう一度チェック
            setIsContinuouslyNotifying(true);
          }
        }, delay * 1000);
      }
    } else {
      if (notificationTimer.current) {
        clearTimeout(notificationTimer.current);
        notificationTimer.current = null;
      }
      if (isContinuouslyNotifying) {
        setIsContinuouslyNotifying(false);
      }
    }
  }, [slouchScore, lastNotificationTime, settings, isContinuouslyNotifying, triggerNotification]);

  // --- 連続通知の実行 ---
  useEffect(() => {
    if (!isContinuouslyNotifying) return;

    // 最初の通知を実行
    triggerNotification();
    setLastNotificationTime(Date.now());

    const interval = setInterval(() => {
      triggerNotification();
      setLastNotificationTime(Date.now());
    }, settings.continuousInterval * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isContinuouslyNotifying, settings.continuousInterval, triggerNotification]);

  const borderColor = `hsl(${120 * (1 - slouchScore / 100)}, 100%, 50%)`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-4">syakitto</h1>
      <p className="text-xl mb-2">猫背スコア</p>
      <p className="text-5xl font-bold mb-6" style={{ color: borderColor }}>
        {Math.round(slouchScore)}%
      </p>

      <video
        ref={videoRef}
        width={480}
        height={360}
        className="rounded-lg border border-gray-700"
        style={{ transform: "scaleX(-1)" }}
      />

      <p className="mt-4 text-sm text-gray-400">
        ※ カメラ映像はローカル処理のみ。肩が見えなくてもOK。
      </p>

      <div className="w-full max-w-lg mt-8 p-6 bg-gray-800 border border-gray-700 rounded-lg">
        <h2 className="text-xl font-bold text-white mb-4">通知設定</h2>

        {/* 通知タイプ */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">通知タイプ</label>
          <div className="flex items-center space-x-4">
            {['none', 'voice', 'desktop'].map(type => (
              <label key={type} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="notificationType"
                  value={type}
                  checked={notificationType === type}
                  onChange={(e) => setNotificationType(e.target.value)}
                />
                <span className="text-gray-400 capitalize">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* トリガー条件 */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label htmlFor="threshold" className="block text-sm font-medium text-gray-300">スコアしきい値 (%)</label>
            <input
              type="number"
              id="threshold"
              value={settings.threshold}
              onChange={(e) => setSettings(s => ({ ...s, threshold: Number(e.target.value) }))}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white p-2"
            />
          </div>
          <div>
            <label htmlFor="delay" className="block text-sm font-medium text-gray-300">継続時間 (秒)</label>
            <input
              type="number"
              id="delay"
              value={settings.delay}
              onChange={(e) => setSettings(s => ({ ...s, delay: Number(e.target.value) }))}
              className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white p-2"
            />
          </div>
        </div>

        {/* 再通知ルール */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">再通知ルール</label>
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="reNotificationMode"
                value="cooldown"
                checked={settings.reNotificationMode === 'cooldown'}
                onChange={(e) => setSettings(s => ({ ...s, reNotificationMode: e.target.value }))}
              />
              <span className="text-gray-400">クールダウン</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="reNotificationMode"
                value="continuous"
                checked={settings.reNotificationMode === 'continuous'}
                onChange={(e) => setSettings(s => ({ ...s, reNotificationMode: e.target.value }))}
              />
              <span className="text-gray-400">連続通知</span>
            </label>
          </div>
        </div>

        {/* 再通知時間 */}
        <div className="mb-6">
        {settings.reNotificationMode === 'cooldown' ? (
            <div>
              <label htmlFor="cooldownTime" className="block text-sm font-medium text-gray-300">クールダウン時間 (秒)</label>
              <input
                type="number"
                id="cooldownTime"
                value={settings.cooldownTime}
                onChange={(e) => setSettings(s => ({ ...s, cooldownTime: Number(e.target.value) }))}
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white p-2"
              />
            </div>
          ) : (
            <div>
              <label htmlFor="continuousInterval" className="block text-sm font-medium text-gray-300">連続通知の間隔 (秒)</label>
              <input
                type="number"
                id="continuousInterval"
                value={settings.continuousInterval}
                onChange={(e) => setSettings(s => ({ ...s, continuousInterval: Number(e.target.value) }))}
                className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white p-2"
              />
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="mt-6 border-t border-gray-700 pt-6 flex items-center justify-between">
          <button
            onClick={() => setSettings(DEFAULT_SETTINGS)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500"
          >
            設定をリセット
          </button>
          <button
            onClick={() => setLastNotificationTime(0)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500"
          >
            クールダウンをリセット
          </button>
        </div>
      </div>
    </main>
  );
}
