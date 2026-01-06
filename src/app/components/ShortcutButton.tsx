"use client";

type Props = {
  onClick: () => void;
};

const ShortcutButton = ({ onClick }: Props) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 w-12 h-12 bg-[#2d3436] hover:bg-[#636e72] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 z-40"
      aria-label="ショートカットキー一覧を表示"
      title="ショートカットキー一覧 (Ctrl+K / ⌘K)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
        />
      </svg>
    </button>
  );
};

export default ShortcutButton;
