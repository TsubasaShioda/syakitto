/**
 * @file このファイルは、アプリケーション全体で再利用可能な、
 * ON/OFFの状態を切り替えるためのトグルスイッチUIを定義するReactコンポーネントです。
 *
 * @component ToggleSwitch
 * @param {boolean} isEnabled - スイッチがON（有効）の状態であるかどうか。
 * @param {() => void} onToggle - スイッチがクリックされたときに実行されるコールバック関数。
 *
 * @returns {JSX.Element} アニメーション付きのトグルスイッチUI。
 */
"use client";

interface ToggleSwitchProps {
  isEnabled: boolean;
  onToggle: () => void;
}

const ToggleSwitch = ({ isEnabled, onToggle }: ToggleSwitchProps) => {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none ${
        isEnabled ? "bg-[#5a8f7b]" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
          isEnabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
};

export default ToggleSwitch;
