import { useState, useEffect, useRef, useCallback } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// スコア履歴の型定義
export interface ScoreHistory {
  time: number;
  score: number;
}

// このフックが受け取る引数の型定義
interface UsePoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPaused: boolean;
}

// このフックが返す値の型定義
interface UsePoseDetectionReturn {
  slouchScore: number;
  isCameraReady: boolean;
  isCalibrated: boolean;
  calibrate: () => void;
  scoreHistory: ScoreHistory[];
}

export const usePoseDetection = ({ videoRef, isPaused }: UsePoseDetectionProps): UsePoseDetectionReturn => {
  const [detector, setDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [slouchScore, setSlouchScore] = useState(0);
  const [calibratedPose, setCalibratedPose] = useState<poseDetection.Keypoint[] | null>(null);
  const smoothingHistory = useRef<number[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);

  const isCalibrated = calibratedPose !== null;

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

  // --- キャリブレーション ---
  const calibrate = async () => {
    if (!detector || !videoRef.current) return;
    try {
      const poses = await detector.estimatePoses(videoRef.current);
      if (poses.length > 0) {
        setCalibratedPose(poses[0].keypoints);
        console.log("Calibrated pose:", poses[0].keypoints);
      }
    } catch (e) {
      console.warn("Calibration failed:", e);
    }
  };

  // --- 猫背スコア計算 ---
  const calculateSlouchScore = useCallback((keypoints: poseDetection.Keypoint[]): number | null => {
    const get = (name: string) => keypoints.find((k) => k.name === name);
    const getCalibrated = (name: string) => calibratedPose?.find((k) => k.name === name);

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
      : eyeY + (eyeY - earY) * 2.2; // 肩が見えない場合の代替

    const bodyHeight = Math.abs(shoulderY - eyeY);
    if (bodyHeight < 40) return null; // 体の高さが小さすぎる場合は無視

    // デフォルトのロジックでスコアを計算
    const defaultPostureRatio = (shoulderY - earY) / bodyHeight;
    const uncalibratedScore = Math.min(1, Math.max(0, (defaultPostureRatio - 0.8) / 0.3)) * 100;

    // キャリブレーション済みの場合、キャリブレーションスコアを計算し、デフォルトスコアと混ぜる
    if (calibratedPose) {
      const calibLeftEar = getCalibrated("left_ear");
      const calibRightEar = getCalibrated("right_ear");
      const calibLeftShoulder = getCalibrated("left_shoulder");
      const calibRightShoulder = getCalibrated("right_shoulder");

      if (!calibLeftEar || !calibRightEar || !calibLeftShoulder || !calibRightShoulder) return null;

      const calibEarY = (calibLeftEar.y + calibRightEar.y) / 2;
      const calibShoulderY = (calibLeftShoulder.y + calibRightShoulder.y) / 2;
      const calibBodyHeight = Math.abs(calibShoulderY - eyeY); // 現在の目の高さを使う
      const calibPostureRatio = (calibShoulderY - calibEarY) / calibBodyHeight;

      const currentPostureRatio = (shoulderY - earY) / bodyHeight;

      const deviation = calibPostureRatio - currentPostureRatio;
      const calibratedScore = Math.min(1, Math.max(0, deviation / 0.35)) * 100; // 0.35は感度調整

      // 50/50で混ぜる
      return (uncalibratedScore * 0.5) + (calibratedScore * 0.5);
    }

    // キャリブレーションされていない場合は、デフォルトスコアを返す
    return uncalibratedScore;
  }, [calibratedPose]);

  // --- 軽量ループ（2FPS） ---
  useEffect(() => {
    if (isPaused || !detector || !isCameraReady || !videoRef.current) {
      return;
    }

    const analyze = async () => {
      try {
        const poses = await detector.estimatePoses(videoRef.current!);
        if (poses.length > 0) {
          const score = calculateSlouchScore(poses[0].keypoints);
          if (score !== null) {
            // スムージング
            const history = smoothingHistory.current;
            history.push(score);
            if (history.length > 3) history.shift();
            const avgScore = history.reduce((a, b) => a + b, 0) / history.length;
            setSlouchScore(avgScore);

            // スコアを履歴に追加
            setScoreHistory(prevHistory => [...prevHistory, { time: Date.now(), score: avgScore }]);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    };

    const intervalId = setInterval(analyze, 2000); // 2秒ごとに記録
    return () => clearInterval(intervalId);
  }, [isPaused, detector, isCameraReady, videoRef, calculateSlouchScore]);

  return { slouchScore, isCameraReady, isCalibrated, calibrate, scoreHistory };
};