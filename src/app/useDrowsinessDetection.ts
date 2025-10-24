import { useState, useEffect, useRef } from 'react';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';

// EAR計算のためのランドマークインデックス
const LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380];

// 距離を計算するヘルパー関数
const euclideanDist = (p1: faceLandmarksDetection.Keypoint, p2: faceLandmarksDetection.Keypoint) => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2 + ((p1.z || 0) - (p2.z || 0)) ** 2);
};

// EARを計算する関数
const getEAR = (landmarks: faceLandmarksDetection.Keypoint[], eyeIndices: number[]) => {
  const eyeLandmarks = eyeIndices.map(i => landmarks[i]);
  const p1 = eyeLandmarks[0];
  const p2 = eyeLandmarks[1];
  const p3 = eyeLandmarks[2];
  const p4 = eyeLandmarks[3];
  const p5 = eyeLandmarks[4];
  const p6 = eyeLandmarks[5];

  const verticalDist = euclideanDist(p2, p6) + euclideanDist(p3, p5);
  const horizontalDist = euclideanDist(p1, p4);

  return verticalDist / (2 * horizontalDist);
};


interface UseDrowsinessDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isEnabled: boolean;
  isPaused: boolean;
  settings: {
    drowsinessEarThreshold: number;
    drowsinessTimeThreshold: number;
  };
}

interface UseDrowsinessDetectionReturn {
  isDrowsy: boolean;
  ear: number; // デバッグ用にEARの値を返す
}

export const useDrowsinessDetection = ({ videoRef, isEnabled, isPaused, settings }: UseDrowsinessDetectionProps): UseDrowsinessDetectionReturn => {
  const [detector, setDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [isDrowsy, setIsDrowsy] = useState(false);
  const [ear, setEar] = useState(0);
  const eyeClosedStartTime = useRef<number | null>(null);

  // --- モデルの初期化 ---
  useEffect(() => {
    const init = async () => {
      const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
      const detectorConfig: faceLandmarksDetection.MediaPipeFaceMeshTfjsModelConfig = {
        runtime: 'tfjs',
        refineLandmarks: true,
      };
      const faceDetector = await faceLandmarksDetection.createDetector(model, detectorConfig);
      setDetector(faceDetector);
    };
    init();
  }, []);

  // --- 眠気検出ループ (1FPS) ---
  useEffect(() => {
    if (!isEnabled || isPaused || !detector || !videoRef.current) {
      // リセット処理
      eyeClosedStartTime.current = null;
      setIsDrowsy(false);
      return;
    }

    const analyze = async () => {
      try {
        const faces = await detector.estimateFaces(videoRef.current!, { flipHorizontal: false });
        if (faces.length > 0) {
          const landmarks = faces[0].keypoints;
          const leftEAR = getEAR(landmarks, LEFT_EYE_INDICES);
          const rightEAR = getEAR(landmarks, RIGHT_EYE_INDICES);
          const avgEAR = (leftEAR + rightEAR) / 2;
          setEar(avgEAR); // デバッグ用にstateを更新

          if (avgEAR < settings.drowsinessEarThreshold) {
            if (eyeClosedStartTime.current === null) {
              eyeClosedStartTime.current = Date.now();
            } else {
              const elapsedTime = Date.now() - eyeClosedStartTime.current;
              if (elapsedTime > settings.drowsinessTimeThreshold * 1000) {
                setIsDrowsy(true);
              }
            }
          } else {
            eyeClosedStartTime.current = null;
            setIsDrowsy(false);
          }
        }
      } catch (e) {
        console.warn(e);
      }
    };

    const intervalId = setInterval(analyze, 1000); // 1秒ごとに実行
    return () => clearInterval(intervalId);

  }, [isEnabled, isPaused, detector, videoRef, settings]);

  return { isDrowsy, ear };
};