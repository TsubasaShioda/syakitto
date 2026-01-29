/**
 * @file このファイルは、情報（インフォメーション）を示すためのシンプルなアイコンボタンを定義するReactコンポーネントです。
 * 主に、クリックすると情報モーダルやヘルプテキストなどを表示する目的で使用されます。
 *
 * @component InfoButton
 * @param {() => void} onClick - ボタンがクリックされたときに実行されるコールバック関数。
 *
 * @returns {JSX.Element} "i"の形をしたSVGアイコンを含むボタン要素。
 */
"use client";

interface InfoButtonProps {
  onClick: () => void;
}

const InfoButton = ({ onClick }: InfoButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="text-gray-400 hover:text-[#5a8f7b] transition-colors"
      aria-label="情報"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
    </button>
  );
};

export default InfoButton;
