/**
 * @file このファイルは、TensorFlow.jsを利用してリアルタイムの姿勢検出を行うためのカスタムReactフック `usePoseDetection` を定義します。
 * 機械学習モデルの読み込み、カメラのセットアップ、姿勢のキャリブレーション、そして猫背スコアの計算といった、
 * 姿勢検出に関するすべてのコアロジックをカプセル化しています。
 *
 * 主な責務：
 * - TensorFlow.jsの`PoseDetection`（MoveNet）モデルと`FaceLandmarksDetection`（MediaPipeFaceMesh）モデルを非同期に読み込む。
 * - ユーザーのカメラにアクセスし、ビデオストリームをセットアップ・管理する。
 * - ユーザーの「良い姿勢」を基準としてキャリブレーションする機能を提供する。
 * - 耳と肩の相対的な位置、および顔の大きさの変化を基に、独自のアルゴリズムで「猫背スコア」を算出する。
 * - Electron環境とWebブラウザ環境で異なる分析ループの制御を行い、パフォーマンスを最適化する。
 * - エラーハンドリングと状態のリセット機能を提供する。
 *
 * @hook usePoseDetection
 * @param {UsePoseDetectionProps} props - フックの動作に必要なプロパティ（ビデオ要素への参照、ポーズ状態など）。
 * @returns {UsePoseDetectionReturn} 姿勢スコア、カメラの状態、および制御関数を含むオブジェクト。
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

// このフックが受け取る引数の型定義
interface UsePoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPaused: boolean;
  isEnabled: boolean;
  onError: (message: string) => void;
}

// このフックが返す値の型定義
interface UsePoseDetectionReturn {
  slouchScore: number;
  isCameraReady: boolean;
  isCalibrated: boolean;
  calibrate: () => void;
  stopCamera: () => void; // カメラを手動で停止する関数
  resetState: () => void; // 状態をリセットする関数
}

// 距離を計算するヘルパー関数
const euclideanDist = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

export const usePoseDetection = ({ videoRef, isPaused, isEnabled, onError }: UsePoseDetectionProps): UsePoseDetectionReturn => {
  const [poseDetector, setPoseDetector] = useState<poseDetection.PoseDetector | null>(null);
  const [faceDetector, setFaceDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [slouchScore, setSlouchScore] = useState(0);
  const [calibratedPose, setCalibratedPose] = useState<poseDetection.Keypoint[] | null>(null);
  const [calibratedFaceSize, setCalibratedFaceSize] = useState<number | null>(null);
  const smoothingHistory = useRef<number[]>([]);
  const streamRef = useRef<MediaStream | null>(null); // ビデオストリームの参照を保持

  const isCalibrated = calibratedPose !== null;

  const resetState = useCallback(() => {
    setSlouchScore(0);
    smoothingHistory.current = [];
  }, []);

  // --- 初期化 ---
  useEffect(() => {
    const initModels = async () => {
      try {
        await tf.ready();
        await tf.setBackend("webgl");

        // モデルの並列読み込み
        const [poseDetector, faceDetector] = await Promise.all([
          poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
          }),
          faceLandmarksDetection.createDetector(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, {
            runtime: 'tfjs',
            refineLandmarks: true,
          })
        ]);

        setPoseDetector(poseDetector);
        setFaceDetector(faceDetector);
      } catch (error) {
        console.error("Error during model initialization:", error);
        onError("機械学習モデルの読み込みに失敗しました。リロードしてください。");
      }
    };
    initModels();
  }, [onError]);

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
      // モデルの準備を待たずにカメラをセットアップ
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360 },
          audio: false,
        });
        streamRef.current = stream;
        const video = videoRef.current;
        video.srcObject = stream;
        video.onloadedmetadata = () => video.play();
        video.onplaying = () => setIsCameraReady(true);
      } catch (error) {
        console.error("Error accessing camera:", error);
        onError("カメラにアクセスできませんでした。権限を確認してください。");
      }
    };
    setupCamera();

    return () => {
      stopCamera();
    };
  // poseDetectorとfaceDetectorへの依存を削除
  }, [videoRef, stopCamera, onError]);

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
      } else {
        onError("キャリブレーションに失敗しました。姿勢を検出できませんでした。");
      }
    } catch (e) {
      console.warn("Calibration failed:", e);
      onError("キャリブレーションに失敗しました。姿勢を検出できませんでした。");
    }
  };

  // --- 猫背スコア計算 ---
  const calculateSlouchScore = useCallback((poseKeypoints: poseDetection.Keypoint[], faceKeypoints: faceLandmarksDetection.Keypoint[]): number | null => {
    // キャリブレーションされていない場合は、スコアを計算しない
    if (!calibratedPose || !calibratedFaceSize) {
      return null;
    }

    const get = (name: string) => poseKeypoints.find((k) => k.name === name);
    const getCalibrated = (name: string) => calibratedPose.find((k) => k.name === name);

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

    return calibratedScore;
  }, [calibratedPose, calibratedFaceSize]);

  // --- 姿勢測定処理 ---
  const analyze = useCallback(async () => {
    if (isPaused || !poseDetector || !faceDetector || !isCameraReady || !videoRef.current) {
      return;
    }

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

          // メインプロセスにスコアを通知
          if (window.electron) {
            window.electron.updatePostureScore(avgScore);
          }
        }
      }
    } catch (e) {
      console.error('[Posture Detection] Error during analysis:', e);
      // ▼▼▼ エラー通知を追加 ▼▼▼
      // ループ内で連続発生する可能性があるので、ここは慎重に。
      // 今回はコンソールエラーのみにしておきます（または頻度制限付きでonErrorを呼ぶ）
      // もし一度のエラーで止めて良いならここに onError(e.message) を入れます。
    }
  }, [isPaused, poseDetector, faceDetector, isCameraReady, videoRef, calculateSlouchScore]);



  // --- メインプロセスからのタイマー制御 ---
  useEffect(() => {
    if (!isEnabled) return;

    if (typeof window === 'undefined' || !window.electron) {
      // Electron環境でない場合は従来のsetIntervalを使用
      if (isPaused || !poseDetector || !faceDetector || !isCameraReady) {
        return;
      }
      const intervalId = setInterval(analyze, 1500);
      return () => clearInterval(intervalId);
    }

    // Electron環境: メインプロセスでタイマーを動かす
    if (!isPaused && poseDetector && faceDetector && isCameraReady) {
      // メインプロセスからのトリガーを受け取る
      const handleTrigger = () => {
        analyze();
      };

      window.electron.onTriggerPostureCheck(handleTrigger);
      window.electron.startPostureCheck(1500);

      return () => {
        window.electron.stopPostureCheck();
      };
    }
  }, [isEnabled, isPaused, poseDetector, faceDetector, isCameraReady, analyze]);

  return { slouchScore, isCameraReady, isCalibrated, calibrate, stopCamera, resetState };
};