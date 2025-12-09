// src/app/useBGM.ts
import { useState, useEffect, useRef, useCallback } from 'react';

export const BGM_OPTIONS = [
  { value: 'cafe1.mp3', label: 'カフェ 1' },
  { value: 'cafe2.mp3', label: 'カフェ 2' },
  { value: 'cafe3.mp3', label: 'カフェ 3' },
  { value: 'forest.mp3', label: '森' },
  { value: 'rain.mp3', label: '雨' },
  { value: 'sky.mp3', label: '空' },
  { value: 'space.mp3', label: '宇宙' },
  { value: '深海.mp3', label: '深海' },
];

export const useBGM = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentBGM, setCurrentBGM] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5); // 0.0 to 1.0

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true; // Loop BGM
      audioRef.current.volume = volume;
      audioRef.current.onended = () => setIsPlaying(false); // Should not be called with loop true, but good practice
    }
  }, [volume]);

  // Set BGM track
  useEffect(() => {
    if (audioRef.current && currentBGM) {
      audioRef.current.src = `/musics/${currentBGM}`;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Error playing BGM:", e));
      }
    } else if (audioRef.current && !currentBGM) {
      audioRef.current.pause();
      audioRef.current.src = '';
      setIsPlaying(false);
    }
  }, [currentBGM, isPlaying]); // Only re-run if currentBGM changes

  // Control play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying && currentBGM) {
        audioRef.current.play().catch(e => console.error("Error playing BGM:", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentBGM]); // Re-run if isPlaying or currentBGM changes

  // Control volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const playBGM = useCallback(() => {
    if (currentBGM) {
      setIsPlaying(true);
    }
  }, [currentBGM]);

  const pauseBGM = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const selectBGM = useCallback((track: string) => {
    setCurrentBGM(track);
  }, []);

  const setBGMVolume = useCallback((newVolume: number) => {
    setVolume(Math.max(0, Math.min(1, newVolume))); // Ensure volume is between 0 and 1
  }, []);

  return {
    currentBGM,
    isPlaying,
    volume,
    playBGM,
    pauseBGM,
    selectBGM,
    setBGMVolume,
    BGM_OPTIONS,
  };
};