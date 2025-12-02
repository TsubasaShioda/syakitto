"use client";

import { RefObject } from 'react';

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPaused: boolean;
}

const CameraView = ({ videoRef, isPaused }: CameraViewProps) => {
  return (
    <div className="relative w-full">
      <div className="rounded-3xl overflow-hidden shadow-xl border border-[#c9b8a8]/30 bg-white/50 backdrop-blur-sm">
        <video
          ref={videoRef}
          width={640}
          height={480}
          className="w-full h-auto object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        {isPaused && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center">
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
  );
};

export default CameraView;
