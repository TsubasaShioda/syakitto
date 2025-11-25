"use client";

import { RefObject, useEffect, useRef } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPaused: boolean;
  isVisualizationEnabled: boolean;
  poses: poseDetection.Pose[] | null;
  debugValues: Record<string, number | string>;
}

const CameraView = ({ videoRef, isPaused, isVisualizationEnabled, poses, debugValues }: CameraViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 描画領域をクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isVisualizationEnabled && poses && poses.length > 0) {
      const keypoints = poses[0].keypoints;

      // 左右反転に対応
      const flipX = (x: number) => canvas.width - x;

      // ランドマークを描画
      const relevantKeypoints = [
        'left_shoulder', 'right_shoulder', 'left_ear', 'right_ear',
        'left_eye', 'right_eye', 'nose'
      ];
      keypoints.forEach(kp => {
        if (kp.name && relevantKeypoints.includes(kp.name) && kp.score && kp.score > 0.5) {
          ctx.beginPath();
          ctx.arc(flipX(kp.x), kp.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'aqua';
          ctx.fill();
        }
      });

      // 体の線を描画
      const drawLine = (p1Name: string, p2Name: string, color: string) => {
        const p1 = keypoints.find(k => k.name === p1Name);
        const p2 = keypoints.find(k => k.name === p2Name);
        if (p1 && p2 && p1.score && p1.score > 0.5 && p2.score && p2.score > 0.5) {
          ctx.beginPath();
          ctx.moveTo(flipX(p1.x), p1.y);
          ctx.lineTo(flipX(p2.x), p2.y);
          ctx.strokeStyle = color;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      };

      drawLine('left_shoulder', 'right_shoulder', 'lime');
      drawLine('left_shoulder', 'left_ear', 'yellow');
      drawLine('right_shoulder', 'right_ear', 'yellow');

      // 水平線を描画
      const drawHorizontalLine = (y: number, color: string, name: string) => {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.fillText(name, flipX(40), y - 5);
      };
      
      if (typeof debugValues.shoulderY === 'number') {
        drawHorizontalLine(debugValues.shoulderY, 'lime', 'shoulderY');
      }
      if (typeof debugValues.earY === 'number') {
        drawHorizontalLine(debugValues.earY, 'yellow', 'earY');
      }
    }

  }, [poses, isVisualizationEnabled, debugValues]);

  return (
    <div className="relative w-max mx-auto mb-4">
      <video
        ref={videoRef}
        width={480}
        height={360}
        className="rounded-lg border border-gray-700"
        style={{ transform: "scaleX(-1)" }}
      />
      <canvas
        ref={canvasRef}
        width={480}
        height={360}
        className="absolute top-0 left-0"
      />
      {isPaused && (
        <div className="absolute inset-0 bg-black bg-opacity-80 flex items-center justify-center rounded-lg">
          <p className="text-white text-2xl font-bold">PAUSED</p>
        </div>
      )}
    </div>
  );
};

export default CameraView;
