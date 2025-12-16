import { useState, useEffect, useRef, useCallback } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
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
  isRecordingEnabled: boolean;
  isEnabled: boolean;
}

// このフックが返す値の型定義
interface UsePoseDetectionReturn {
  slouchScore: number;
  isCameraReady: boolean;
  isCalibrated: boolean;
  calibrate: () => void;
  scoreHistory: ScoreHistory[];
  stopCamera: () => void; // カメラを手動で停止する関数
}

// 距離を計算するヘルパー関数
const euclideanDist = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

export const usePoseDetection = ({ videoRef, isPaused, isRecordingEnabled, isEnabled }: UsePoseDetectionProps): UsePoseDetectionReturn => {
  const [poseDetector, setPoseDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [faceDetector, setFaceDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [slouchScore, setSlouchScore] = useState(0);
  const [calibratedPose, setCalibratedPose] = useState<poseDetection.Keypoint[] | null>(null);
  const [calibratedFaceSize, setCalibratedFaceSize] = useState<number | null>(null);
  const smoothingHistory = useRef<number[]>([]);
  const [scoreHistory, setScoreHistory] = useState<ScoreHistory[]>([]);
  const streamRef = useRef<MediaStream | null>(null); // ビデオストリームの参照を保持

  const isCalibrated = calibratedPose !== null;

  // --- 初期化 ---
  useEffect(() => {
    const init = async () => {
      try {
        await tf.ready();
        await tf.setBackend("webgl");
        
        // Pose Detector
        const poseModel = poseDetection.SupportedModels.MoveNet;
        const poseDetectorConfig = {
          modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
        };
        const _poseDetector = await poseDetection.createDetector(poseModel, poseDetectorConfig);
        setPoseDetector(_poseDetector);

        // Face Detector
        const faceModel = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        const faceDetectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
          runtime: 'tfjs',
          refineLandmarks: true,
        };
        const _faceDetector = await faceLandmarksDetection.createDetector(faceModel, faceDetectorConfig);
        setFaceDetector(_faceDetector);
      } catch (error) {
        console.error("Error during model initialization:", error);
      }
    };
    init();
  }, []);

  // カメラ停止関数
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  }, [videoRef]);

  // --- カメラセットアップ ---
  useEffect(() => {
    const setupCamera = async () => {
      if (!poseDetector || !faceDetector || !videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360 },
          audio: false,
        });
        streamRef.current = stream; // ストリームの参照を保存
        const video = videoRef.current;
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
        video.onplaying = () => setIsCameraReady(true);
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    };
    setupCamera();

    // クリーンアップ: コンポーネントがアンマウントされたらカメラを停止
    return () => {
      stopCamera();
    };
  }, [poseDetector, faceDetector, videoRef, stopCamera]);

  // --- キャリブレーション ---
  const calibrate = async () => {
    if (!poseDetector || !faceDetector || !videoRef.current) return;
    try {
      const [poses, faces] = await Promise.all([
        poseDetector.estimatePoses(videoRef.current),
        faceDetector.estimateFaces(videoRef.current, { flipHorizontal: false }),
      ]);

      if (poses.length > 0) {
        setCalibratedPose(poses[0].keypoints);
      }
      if (faces.length > 0) {
        const leftEye = faces[0].keypoints.find(k => k.name === 'leftEye');
        const rightEye = faces[0].keypoints.find(k => k.name === 'rightEye');
        if (leftEye && rightEye) {
          const faceSize = euclideanDist(leftEye, rightEye);
          setCalibratedFaceSize(faceSize);
        }
      }
    } catch (e) {
      console.warn("Calibration failed:", e);
    }
  };

  // --- 猫背スコア計算 ---
  const calculateSlouchScore = useCallback((poseKeypoints: poseDetection.Keypoint[], faceKeypoints: faceLandmarksDetection.Keypoint[]): number | null => {
    const get = (name: string) => poseKeypoints.find((k) => k.name === name);
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
    if (calibratedPose && calibratedFaceSize) {
      const calibLeftEar = getCalibrated("left_ear");
      const calibRightEar = getCalibrated("right_ear");
      const calibLeftShoulder = getCalibrated("left_shoulder");
      const calibRightShoulder = getCalibrated("right_shoulder");

      if (!calibLeftEar || !calibRightEar || !calibLeftShoulder || !calibRightShoulder) return null;

      // 現在の顔サイズを計算
      const currentLeftEye = faceKeypoints.find(k => k.name === 'leftEye');
      const currentRightEye = faceKeypoints.find(k => k.name === 'rightEye');
      if (!currentLeftEye || !currentRightEye) return null;
      const currentFaceSize = euclideanDist(currentLeftEye, currentRightEye);
      const faceSizeRatio = currentFaceSize / calibratedFaceSize;

      const calibEarY = (calibLeftEar.y + calibRightEar.y) / 2;
      const calibShoulderY = (calibLeftShoulder.y + calibRightShoulder.y) / 2;
      const calibBodyHeight = Math.abs(calibShoulderY - eyeY); // 現在の目の高さを使う
      const calibPostureRatio = (calibShoulderY - calibEarY) / calibBodyHeight;

      const currentPostureRatio = (shoulderY - earY) / bodyHeight;

      // 顔の大きさで正規化した差分を計算
      const deviation = calibPostureRatio - (currentPostureRatio / faceSizeRatio);
      const calibratedScore = Math.min(1, Math.max(0, deviation / 0.35)) * 100;

      // 50/50で混ぜる
      return (uncalibratedScore * 0.5) + (calibratedScore * 0.5);
    }

    // キャリブレーションされていない場合は、デフォルトスコアを返す
    return uncalibratedScore;
  }, [calibratedPose, calibratedFaceSize]);

  // --- 軽量ループ（2FPS） ---
  useEffect(() => {
    if (!isEnabled) {
      setSlouchScore(0);
      smoothingHistory.current = [];
      return;
    }

    if (isPaused || !poseDetector || !faceDetector || !isCameraReady || !videoRef.current) {
      return;
    }

    const analyze = async () => {
      try {
        const [poses, faces] = await Promise.all([
          poseDetector.estimatePoses(videoRef.current!),
          faceDetector.estimateFaces(videoRef.current!, { flipHorizontal: false }),
        ]);
        
        if (poses.length > 0 && faces.length > 0) {
          const score = calculateSlouchScore(poses[0].keypoints, faces[0].keypoints);
          if (score !== null) {
            // スムージング
            const history = smoothingHistory.current;
            history.push(score);
            if (history.length > 3) history.shift();
            const avgScore = history.reduce((a, b) => a + b, 0) / history.length;
            setSlouchScore(avgScore);

            // スコアを履歴に追加
            if (isRecordingEnabled) {
              setScoreHistory(prevHistory => [...prevHistory, { time: Date.now(), score: avgScore }]);
            }
          }
        }
      } catch (e) {
        console.warn(e);
      }
    };

    const intervalId = setInterval(analyze, 2000); // 2秒ごとに記録
    return () => clearInterval(intervalId);
  }, [isEnabled, isPaused, poseDetector, faceDetector, isCameraReady, videoRef, calculateSlouchScore, isRecordingEnabled]);

  return { slouchScore, isCameraReady, isCalibrated, calibrate, scoreHistory, stopCamera };
};