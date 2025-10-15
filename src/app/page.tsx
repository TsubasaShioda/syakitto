"use client";

import { useEffect, useRef, useState } from "react";
import * as poseDetection from "@tensorflow-models/pose-detection";
import * as tf from "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [slouchScore, setSlouchScore] = useState(0);
  const scoreHistory = useRef<number[]>([]);

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
    let intervalId: NodeJS.Timeout;

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

    intervalId = setInterval(analyze, 500); // 2FPS (0.5秒ごと)
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
    </main>
  );
}
