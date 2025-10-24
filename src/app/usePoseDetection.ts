import { useState, useEffect, useRef } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// このフックが受け取る引数の型定義
interface UsePoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPaused: boolean;
}

// このフックが返す値の型定義
interface UsePoseDetectionReturn {
  slouchScore: number;
  isCameraReady: boolean;
}

export const usePoseDetection = ({ videoRef, isPaused }: UsePoseDetectionProps): UsePoseDetectionReturn => {
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
  }, [detector, videoRef]);

  // --- 猫背スコア計算 ---
  const calculateSlouchScore = (keypoints: poseDetection.Keypoint[]): number | null => {
    const get = (name: string) => keypoints.find((k) => k.name === name);
    const leftEar = get("left_ear");
    const rightEar = get("right_ear");
    const leftEye = get("left_eye");
    const rightEye = get("right_eye");
    const leftShoulder = get("left_shoulder");
    const rightShoulder = get("right_shoulder");

    if (![leftEar, rightEar, leftEye, rightEye].every(kp => kp && kp.score! > 0.4)) return null;

    const earY = (leftEar!.y + rightEar!.y) / 2;
    const eyeY = (leftEye!.y + rightEye!.y) / 2;
    const shoulderY = (leftShoulder && rightShoulder)
      ? (leftShoulder.y + rightShoulder.y) / 2
      : eyeY + (eyeY - earY) * 2.2;

    const bodyHeight = Math.abs(shoulderY - eyeY);
    if (bodyHeight < 40) return null;

    const postureRatio = (shoulderY - earY) / bodyHeight;
    const normalized = Math.min(1, Math.max(0, (postureRatio - 0.8) / 0.3));
    return normalized * 100;
  };

  // --- スムージング ---
  const smoothAndSetScore = (score: number) => {
    const history = scoreHistory.current;
    history.push(score);
    if (history.length > 3) history.shift();
    const avg = history.reduce((a, b) => a + b, 0) / history.length;
    setSlouchScore(avg);
  };

  // --- 軽量ループ（2FPS） ---
  useEffect(() => {
    if (isPaused || !detector || !isCameraReady || !videoRef.current) return;

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

    const intervalId = setInterval(analyze, 500);
    return () => clearInterval(intervalId);
  }, [isPaused, detector, isCameraReady, videoRef]);

  return { slouchScore, isCameraReady };
};