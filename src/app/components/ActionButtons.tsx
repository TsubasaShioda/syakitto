"use client";

interface ActionButtonsProps {
  onDownload: () => void;
  onReportOpen: () => void;
  onToggleTimer: () => void;
  isTimerVisible: boolean;
  isElectron: boolean;
}

const ActionButtons = ({ onDownload, onReportOpen, onToggleTimer, isTimerVisible, isElectron }: ActionButtonsProps) => {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3">
      {!isElectron && (
        <div className="relative flex items-center">
          <button
            onClick={onDownload}
            className="peer w-14 h-14 bg-white/80 backdrop-blur-sm text-[#5a8f7b] rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-[#a8d5ba]/40 transition-all duration-300 transform hover:scale-110 border border-[#c9b8a8]/30"
            aria-label="macOS版をダウンロード"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 group-hover:scale-110 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
          </button>
          <span className="absolute right-16 w-auto whitespace-nowrap p-2 px-3 bg-white text-[#5a8f7b] text-sm font-bold rounded-md shadow-lg opacity-0 peer-hover:opacity-100 transition-opacity duration-300">
            インストーラー
          </span>
        </div>
      )}
      <div className="relative flex items-center">
        <button
            onClick={onReportOpen}
            className="peer w-14 h-14 bg-white/80 backdrop-blur-sm text-[#5a8f7b] rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl hover:bg-[#a8d5ba]/40 transition-all duration-300 transform hover:scale-110 border border-[#c9b8a8]/30"
            aria-label="スコア履歴を開く"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 group-hover:scale-110 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
            </svg>
        </button>
        <span className="absolute right-16 w-auto whitespace-nowrap p-2 px-3 bg-white text-[#5a8f7b] text-sm font-bold rounded-md shadow-lg opacity-0 peer-hover:opacity-100 transition-opacity duration-300">
            スコア履歴
        </span>
      </div>
      <div className="relative flex items-center">
        <button
            onClick={onToggleTimer}
            className={`peer w-14 h-14 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 border border-[#c9b8a8]/30 ${
            isTimerVisible ? 'bg-[#d4a59a]/80 text-white hover:bg-[#d4a59a]' : 'bg-white/80 text-[#5a8f7b] hover:bg-[#a8d5ba]/40'
            }`}
            aria-label="タイマー表示切替"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 group-hover:scale-110 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
        <span className="absolute right-16 w-auto whitespace-nowrap p-2 px-3 bg-white text-[#5a8f7b] text-sm font-bold rounded-md shadow-lg opacity-0 peer-hover:opacity-100 transition-opacity duration-300">
            タイマー
        </span>
      </div>
    </div>
  );
};

export default ActionButtons;
