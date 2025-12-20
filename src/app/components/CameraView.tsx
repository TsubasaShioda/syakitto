"use client";
import { RefObject, useEffect, useRef } from 'react';
import ToggleSwitch from './ToggleSwitch';
import { Keypoints } from '@/app/usePoseDetection';

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPaused: boolean;
  isCameraViewVisible: boolean;
  onToggleCameraView: () => void;
  isAnalyzeModeEnabled: boolean;
  keypoints: Keypoints | null;
}

const CameraView = ({ 
  videoRef, 
  isPaused, 
  isCameraViewVisible, 
  onToggleCameraView,
  isAnalyzeModeEnabled,
  keypoints,
}: CameraViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !video.videoWidth || !video.videoHeight) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // キャンバスのサイズをビデオに合わせる
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }
    
    // アナライズモードが無効、またはキーポイントがない場合はキャンバスをクリアして終了
    if (!isAnalyzeModeEnabled || !keypoints) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // 描画処理
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'lime';
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 2;

    // ポーズのキーポイントを描画
    keypoints.pose.forEach(point => {
      if (point.score && point.score > 0.5) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      }
    });

    // 顔のキーポイントを描画 (軽量化のため間引く)
    /* keypoints.face.forEach((point, index) => {
      if (index % 5 === 0) { // 5点ごとに1点描画
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
        ctx.fill();
      }
    }); */

  }, [keypoints, isAnalyzeModeEnabled, videoRef]);

  return (
    <div className="relative w-full">
      <div className="rounded-3xl overflow-hidden shadow-xl border border-[#c9b8a8]/30 bg-white/50 backdrop-blur-sm">
        <div className="absolute top-0 left-0 right-0 h-10 bg-black/20 z-20 flex justify-end items-center px-4">
          <ToggleSwitch isEnabled={isCameraViewVisible} onToggle={onToggleCameraView} />
        </div>
        <div className="relative w-full h-[480px]">
          <video
            ref={videoRef}
            width={640}
            height={480}
            className={`w-full h-full object-cover ${!isCameraViewVisible && 'hidden'}`}
            style={{ transform: "scaleX(-1)" }}
          />
          <canvas 
            ref={canvasRef} 
            className="absolute top-0 left-0 w-full h-full"
            style={{ transform: "scaleX(-1)", zIndex: 10 }}
          />
          {!isCameraViewVisible && (
            <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center z-10">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25v-9a2.25 2.25 0 012.25-2.25h7.5a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25-2.25z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
              </svg>
            </div>
          )}
          {isPaused && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-[#a8d5ba]/30 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-10 h-10 text-[#5a8f7b]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                  </svg>
                </div>
                <p className="text-gray-700 text-xl font-semibold tracking-wide">一時停止中</p>
                <p className="text-gray-500 text-sm mt-2">再開ボタンを押してください</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CameraView;