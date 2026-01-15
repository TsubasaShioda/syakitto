
export interface PomodoroSettings {
  work: number;
  shortBreak: number;
  longBreak: number;
  sessions: number;
}

export interface NotificationSettings {
  all: boolean;
  sound: boolean;
  soundVolume: number;
  soundFile: string;
  visual: boolean;
  visualType: 'cat_hand' | 'dimmer' | 'noise' | 'toggle';
  pomodoro: boolean;
  type: 'desktop' | 'voice' | 'animation' | 'none';
}

export interface Settings {
  notification: NotificationSettings;
  threshold: {
    slouch: number;
    duration: number;
    reNotificationMode: 'cooldown' | 'continuous';
    cooldownTime: number;
    continuousInterval: number;
  };
  drowsiness: {
    earThreshold: number;
    timeThreshold: number;
  };
  shortcut: {
    enabled: boolean;
    keys: string;
  };
  camera: {
    id: string;
  };
  pomodoro: PomodoroSettings;
  startup: {
    runOnStartup: false;
    startMinimized: false;
  };
  animationWindowPositions?: {
    toggle?: { x: number; y: number };
    cat_hand?: { x: number; y: number };
  };
}


export interface ElectronAPI {
  platform: NodeJS.Platform;
  isElectron: boolean;
  getSettings: () => Promise<Settings>;
  saveSettings: (settings: Partial<Settings>) => Promise<void>;
  showNotification: (options: Electron.NotificationConstructorOptions) => void;
  updateTrayIcon: (dataUrl: string) => void;
  updatePostureScore: (score: number) => void;
  showAnimationNotification: () => void;
  showCatHandNotification: () => void;
  showNoiseNotification: () => void;
  requestDimmerUpdate: (score: number) => void;
  minimizeWindow?: () => void;
  maximizeWindow?: () => void;
  closeWindow?: () => void;
  onBeforeQuit: (callback: () => void) => void;
  removeOnBeforeQuit: () => void;
  cleanupComplete: () => void;
  startPostureCheck: (interval: number) => void;
  stopPostureCheck: () => void;
  onTriggerPostureCheck: (callback: () => void) => void;
  showTimerWindow: () => void;
  updateTimerWindow: (data: { timeLeft: number; isActive: boolean; sessionType: string }) => void;
  closeTimerWindow: () => void;
  toggleNotifications: (enabled: boolean) => void;
  quitApp: () => void;
}

export interface ElectronTimerAPI {
  onUpdateTimer: (callback: (data: { timeLeft: number; isActive: boolean; sessionType: string }) => void) => void;
  closeTimerWindow: () => void;
}

export interface ElectronTrayAPI {
  // スコア更新を受け取る関数（戻り値は解除用の関数）
  onUpdatePostureScore: (callback: (score: number) => void) => () => void;
}

declare global {
  interface Window {
    electron: ElectronAPI;
    electronAPI?: ElectronTimerAPI;
    trayAPI: ElectronTrayAPI;
  }
}
