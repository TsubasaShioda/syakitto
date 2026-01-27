"use client";
import { RefObject } from 'react';
import ToggleSwitch from '@/app/components/ui/buttons/ToggleSwitch';

interface CameraViewProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  isPaused: boolean;
  isCameraViewVisible: boolean;
  onToggleCameraView: () => void;
}


const CameraView = ({ videoRef, isPaused, isCameraViewVisible, onToggleCameraView }: CameraViewProps) => {
  return (
    <div className="relative w-full">
      <div className="rounded-3xl overflow-hidden shadow-xl border border-[#c9b8a8]/30 bg-white/50 backdrop-blur-sm">
        <div className="absolute top-0 left-0 right-0 h-10 bg-black/20 z-10 flex justify-end items-center px-4">
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
          {!isCameraViewVisible && (
            <div className="absolute inset-0 w-full h-full bg-gray-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-20 h-20 text-gray-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25v-9a2.25 2.25 0 012.25-2.25h7.5a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
              </svg>
            </div>
          )}
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
    </div>
  );
};

export default CameraView;
