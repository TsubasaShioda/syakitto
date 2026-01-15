"use client";

import React from 'react';
import NotificationSettings from './NotificationSettings';
import { Settings } from '@/app/settings';

interface NotificationOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

interface NotificationSelectorProps {
  notificationType: string;
  setNotificationType: (type: string) => void;
  isElectron: boolean;
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  notificationSound: string;
  setNotificationSound: (sound: string) => void;
  SOUND_OPTIONS: { value: string; label: string }[];
  animationType: string;
  setAnimationType: (type: string) => void;
  onOpenAdvancedSettings: () => void;
}

const NotificationSelector = ({
  notificationType,
  setNotificationType,
  isElectron,
  settings,
  setSettings,
  notificationSound,
  setNotificationSound,
  SOUND_OPTIONS,
  animationType,
  setAnimationType,
  onOpenAdvancedSettings,
}: NotificationSelectorProps) => {
  const baseOptions: NotificationOption[] = [
    {
      value: "none",
      label: "なし",
      description: "デスクトップ・音声通知を無効にします",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
        </svg>
      ),
    },
    {
      value: "voice",
      label: "音声",
      description: "音声で通知します",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
        </svg>
      ),
    },
    {
      value: "desktop",
      label: "デスクトップ",
      description: "デスクトップ通知を表示",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454 -1.31 A8.967 8.967 0 0 1 18 9.75v-.7V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1 -2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1 -5.714 0m5.714 0a3 3 0 1 1 -5.714 0" />
        </svg>
      ),
    },
  ];

  const electronOptions: NotificationOption[] = [
    {
      value: "animation",
      label: "アニメーション",
      description: "アニメーションを表示",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.81 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
        </svg>
      ),
    },
  ];

  const allOptions = isElectron ? [...baseOptions, ...electronOptions] : baseOptions;

  return (
    <div className="w-full bg-white/60 backdrop-blur-sm rounded-3xl p-6 shadow-lg border border-[#c9b8a8]/30">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-6 h-6 text-[#5a8f7b]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454 -1.31 A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1 -2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1 -5.714 0m5.714 0a3 3 0 1 1 -5.714 0" />
          </svg>
          通知タイプ
        </h2>
      </div>
      <div className="space-y-3">
        {allOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setNotificationType(option.value)}
            className={`
              w-full relative p-4 rounded-2xl border-2 transition-all duration-300
              ${
                notificationType === option.value
                  ? "border-[#a8d5ba] bg-[#a8d5ba]/20 shadow-md"
                  : "border-[#c9b8a8]/30 bg-white/40 hover:border-[#c9b8a8]/50 hover:bg-white/60"
              }
            `}
          >
            <div className="flex items-center gap-3">
              <div
                className={`
                  p-2 rounded-xl transition-colors flex-shrink-0
                  ${
                    notificationType === option.value
                      ? "bg-[#a8d5ba] text-white"
                      : "bg-[#c9b8a8]/20 text-gray-600"
                  }
                `}
              >
                {option.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-gray-700 text-sm">{option.label}</p>
                <p style={{ display: 'block', fontSize: '0.75rem', color: '#6B7280', marginTop: '0.125rem' }}>{option.description}</p>
              </div>
              {notificationType === option.value && (
                <div className="flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5 text-[#5a8f7b]"
                  >
                    <path
                      fillRule="evenodd"
                      d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
      <NotificationSettings 
        settings={settings}
        setSettings={setSettings}
        notificationSound={notificationSound}
        setNotificationSound={setNotificationSound}
        SOUND_OPTIONS={SOUND_OPTIONS}
        notificationType={notificationType}
        animationType={animationType}
        setAnimationType={setAnimationType}
        onOpenAdvancedSettings={onOpenAdvancedSettings}
      />
    </div>
  );
};

export default NotificationSelector;