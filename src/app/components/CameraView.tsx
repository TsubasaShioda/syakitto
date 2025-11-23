"use client";

import { RefObject } from 'react';

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPaused: boolean;
}

const CameraView = ({ videoRef, isPaused }: CameraViewProps) => {
  return (
    <div className="relative w-max mx-auto mb-4">
      <video
        ref={videoRef}
        width={480}
        height={360}
        className="rounded-lg border border-gray-700"
        style={{ transform: "scaleX(-1)" }}
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
