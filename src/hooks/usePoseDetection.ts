import { useState, useEffect, useRef, useCallback } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import * as faceLandmarksDetection from '@tensorflow-models/face-landmarks-detection';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-webgl';

/**
 * @file usePoseDetection.ts
 * @description TensorFlow.jsを利用した姿勢検出のコアロジックをカプセル化したカスタムフック。
 * MoveNetによる体全体のキーポイント検出と、MediaPipeFaceMeshによる顔のランドマーク検出を組み合わせ、
 * ユーザーの「猫背スコア」を算出します。
 */

// このフックが受け取る引数の型定義
interface UsePoseDetectionProps {
  videoRef: React.RefObject<HTMLVideoElement | null>; // 映像を表示する<video>要素のRef
  isPaused: boolean; // 検出プロセスが一時停止中か
  isEnabled: boolean; // 検出機能全体が有効か
  onError: (message: string) => void; // エラー発生時に呼び出されるコールバック
}

// このフックが返す値の型定義
interface UsePoseDetectionReturn {
  slouchScore: number; // 計算された猫背スコア (0-100)
  isCameraReady: boolean; // カメラの準備が完了したか
  isCalibrated: boolean; // 基準姿勢のキャリブレーションが完了したか
  calibrate: () => void; // キャリブレーションを実行する関数
  stopCamera: () => void; // カメラを停止する関数
  resetState: () => void; // スコアなどの状態をリセットする関数
}

// 2点間のユークリッド距離を計算するヘルパー関数
const euclideanDist = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
};

export const usePoseDetection = ({ videoRef, isPaused, isEnabled, onError }: UsePoseDetectionProps): UsePoseDetectionReturn => {
  // --- 状態管理 ---
  const [poseDetector, setPoseDetector] = useState<poseDetection.PoseDetector | null>(null); // 体の姿勢検出モデル
  const [faceDetector, setFaceDetector] = useState<faceLandmarksDetection.FaceLandmarksDetector | null>(null); // 顔のランドマーク検出モデル
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [slouchScore, setSlouchScore] = useState(0);
  const [calibratedPose, setCalibratedPose] = useState<poseDetection.Keypoint[] | null>(null); // キャリブレーション時の基準姿勢
  const [calibratedFaceSize, setCalibratedFaceSize] = useState<number | null>(null); // キャリブレーション時の基準顔サイズ（両目の距離）
  const smoothingHistory = useRef<number[]>([]); // スコアを平滑化するための履歴
  const streamRef = useRef<MediaStream | null>(null); // カメラのストリーム

  const isCalibrated = calibratedPose !== null;

  // スコア等の状態を初期値にリセットする
  const resetState = useCallback(() => {
    setSlouchScore(0);
    smoothingHistory.current = [];
  }, []);

  // --- 初期化処理 ---
  useEffect(() => {
    // TensorFlow.jsのバックエンドを初期化し、姿勢検出と顔検出モデルをロードする
    const initModels = async () => {
      try {
        await tf.ready();
        await tf.setBackend("webgl");

        const [poseModel, faceModel] = await Promise.all([
          poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }),
          faceLandmarksDetection.createDetector(faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh, { runtime: 'tfjs', refineLandmarks: true })
        ]);

        setPoseDetector(poseModel);
        setFaceDetector(faceModel);
      } catch (error) {
        console.error("Error during model initialization:", error);
        onError("機械学習モデルの読み込みに失敗しました。リロードしてください。");
      }
    };
    initModels();
  }, [onError]);

  // カメラを停止し、リソースを解放する
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraReady(false);
  }, [videoRef]);

  // --- カメラのセットアップ ---
  useEffect(() => {
    // isEnabledがfalseの場合は何もしない
    if (!isEnabled) {
      stopCamera();
      return;
    }
    
    const setupCamera = async () => {
      if (!videoRef.current) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 480, height: 360 }, audio: false });
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

    // クリーンアップ関数
    return () => stopCamera();
  }, [isEnabled, videoRef, stopCamera, onError]);

  // --- キャリブレーション処理 ---
  const calibrate = async () => {
    if (!poseDetector || !faceDetector || !videoRef.current) return;
    try {
      // 現在のフレームから姿勢と顔を同時に検出
      const [poses, faces] = await Promise.all([
        poseDetector.estimatePoses(videoRef.current),
        faceDetector.estimateFaces(videoRef.current, { flipHorizontal: false }),
      ]);

      if (poses.length > 0) {
        setCalibratedPose(poses[0].keypoints); // 基準姿勢として保存
      }
      if (faces.length > 0) {
        // 顔のサイズ（両目の距離）を基準として保存
        const leftEye = faces[0].keypoints.find(k => k.name === 'leftEye');
        const rightEye = faces[0].keypoints.find(k => k.name === 'rightEye');
        if (leftEye && rightEye) {
          setCalibratedFaceSize(euclideanDist(leftEye, rightEye));
        }
      } else {
        onError("キャリブレーション失敗: 姿勢を検出できませんでした。");
      }
    } catch (e) {
      console.warn("Calibration failed:", e);
      onError("キャリブレーション失敗: 姿勢を検出できませんでした。");
    }
  };

  /**
   * 猫背スコアを計算するコアロジック
   * @param {poseDetection.Keypoint[]} poseKeypoints - 現在の姿勢のキーポイント
   * @param {faceLandmarksDetection.Keypoint[]} faceKeypoints - 現在の顔のキーポイント
   * @returns {number | null} 猫背スコア(0-100)。計算不能な場合はnull。
   */
  const calculateSlouchScore = useCallback((poseKeypoints: poseDetection.Keypoint[], faceKeypoints: faceLandmarksDetection.Keypoint[]): number | null => {
    if (!calibratedPose || !calibratedFaceSize) return null;

    const get = (name: string) => poseKeypoints.find((k) => k.name === name);
    const getCalibrated = (name: string) => calibratedPose.find((k) => k.name === name);

    // --- 現在のキーポイントを取得 ---
    const leftEar = get("left_ear");
    const rightEar = get("right_ear");
    const leftEye = get("left_eye");
    const rightEye = get("right_eye");
    const leftShoulder = get("left_shoulder");
    const rightShoulder = get("right_shoulder");

    // 主要なキーポイントが検出できなければ計算しない
    if (![leftEar, rightEar, leftEye, rightEye].every(kp => kp && kp.score! > 0.4)) return null;

    // --- 垂直位置の平均を計算 ---
    const earY = (leftEar!.y + rightEar!.y) / 2;
    const eyeY = (leftEye!.y + rightEye!.y) / 2;
    // 肩が見えない場合、耳と目の位置関係から推定する
    const shoulderY = (leftShoulder && rightShoulder)
      ? (leftShoulder.y + rightShoulder.y) / 2
      : eyeY + (eyeY - earY) * 2.2; 
    
    // 体の高さ（目と肩の垂直距離）を計算
    const bodyHeight = Math.abs(shoulderY - eyeY);
    if (bodyHeight < 40) return null; // 体が小さすぎる場合はノイズと判断

    // --- キャリブレーション時のキーポイントを取得 ---
    const calibLeftEar = getCalibrated("left_ear");
    const calibRightEar = getCalibrated("right_ear");
    const calibLeftShoulder = getCalibrated("left_shoulder");
    const calibRightShoulder = getCalibrated("right_shoulder");

    if (!calibLeftEar || !calibRightEar || !calibLeftShoulder || !calibRightShoulder) return null;
    
    // --- カメラとの距離変動を補正 ---
    // ユーザーが前後に動くと、画面上のキーポイント間の距離が変わってしまう。
    // これを補正するため、顔の大きさ（両目の距離）を基準に比率を計算する。
    const currentLeftEye = faceKeypoints.find(k => k.name === 'leftEye');
    const currentRightEye = faceKeypoints.find(k => k.name === 'rightEye');
    if (!currentLeftEye || !currentRightEye) return null;
    const currentFaceSize = euclideanDist(currentLeftEye, currentRightEye);
    const faceSizeRatio = currentFaceSize / calibratedFaceSize; // 基準時からの顔サイズの変動率

    // --- 姿勢比率を計算 ---
    // 基準姿勢の「体に対する頭の位置」の比率
    const calibEarY = (calibLeftEar.y + calibRightEar.y) / 2;
    const calibShoulderY = (calibLeftShoulder.y + calibRightShoulder.y) / 2;
    const calibBodyHeight = Math.abs(calibShoulderY - eyeY); // 比較基準を揃えるため、現在の目の高さを使う
    const calibPostureRatio = (calibShoulderY - calibEarY) / calibBodyHeight;

    // 現在姿勢の「体に対する頭の位置」の比率
    const currentPostureRatio = (shoulderY - earY) / bodyHeight;
    
    // --- スコア算出 ---
    // 基準姿勢と現在姿勢の比率の差を計算。現在姿勢の比率は顔サイズの変動率で正規化する。
    // これにより、ユーザーが前に乗り出して顔が大きく見えても、猫背として誤検出されにくくなる。
    const deviation = calibPostureRatio - (currentPostureRatio / faceSizeRatio);
    // 逸脱度(deviation)を0-100のスコアに変換。0.35は経験的に調整した係数。
    const calibratedScore = Math.min(1, Math.max(0, deviation / 0.35)) * 100;

    return calibratedScore;
  }, [calibratedPose, calibratedFaceSize]);

  // --- 継続的な姿勢分析処理 ---
  const analyze = useCallback(async () => {
    if (isPaused || !poseDetector || !faceDetector || !isCameraReady || !videoRef.current) return;

    try {
      const [poses, faces] = await Promise.all([
        poseDetector.estimatePoses(videoRef.current!),
        faceDetector.estimateFaces(videoRef.current!, { flipHorizontal: false }),
      ]);

      if (poses.length > 0 && faces.length > 0) {
        const score = calculateSlouchScore(poses[0].keypoints, faces[0].keypoints);
        if (score !== null) {
          // スコアを平滑化（スムージング）して、急な変動を抑える
          const history = smoothingHistory.current;
          history.push(score);
          if (history.length > 3) history.shift();
          const avgScore = history.reduce((a, b) => a + b, 0) / history.length;
          setSlouchScore(avgScore);

          // Electron環境ではメインプロセスにスコアを通知してトレイアイコンを更新
          window.electron?.updatePostureScore(avgScore);
        }
      }
    } catch (e) {
      console.error('[Posture Detection] Error during analysis:', e);
    }
  }, [isPaused, poseDetector, faceDetector, isCameraReady, videoRef, calculateSlouchScore]);

  // --- 分析ループの制御 ---
  useEffect(() => {
    if (!isEnabled) return;
    
    // ブラウザ環境では、単純なsetIntervalで分析を繰り返す
    if (typeof window === 'undefined' || !window.electron) {
      if (isPaused || !poseDetector || !faceDetector || !isCameraReady) return;
      const intervalId = setInterval(analyze, 1500);
      return () => clearInterval(intervalId);
    }

    // Electron環境では、メインプロセスをタイマーとして利用する。
    // これにより、アプリが非表示状態でも安定して動作する。
    if (!isPaused && poseDetector && faceDetector && isCameraReady) {
      const handleTrigger = () => analyze();
      window.electron.onTriggerPostureCheck(handleTrigger);
      window.electron.startPostureCheck(1500);

      // クリーンアップ
      return () => window.electron.stopPostureCheck();
    }
  }, [isEnabled, isPaused, poseDetector, faceDetector, isCameraReady, analyze]);

  return { slouchScore, isCameraReady, isCalibrated, calibrate, stopCamera, resetState };
};