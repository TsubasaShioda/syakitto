/**
 * @file このファイルは、アプリケーションの初回利用時に表示されるガイド付きチュートリアルを実装するReactコンポーネントです。
 * 特定のUI要素（この場合は「良い姿勢を記録」ボタン）をハイライトし、ユーザーに次に行うべき操作を指示します。
 *
 * 主な機能：
 * - `useEffect`フック内でDOM要素を直接操作し、対象要素をハイライト。
 * - ハイライト、メッセージ、矢印の位置を動的に計算・調整。
 * - 画面のスクロールやリサイズに追従してハイライト位置を更新。
 * - ハイライトされた要素がクリックされると、次のステップに進む(`onNext`を呼び出す)ロジック。
 * - チュートリアル中は対象要素の`z-index`を一時的に変更し、操作可能にする。
 *
 * @component Tutorial
 * @param {number} step - 現在のチュートリアルのステップ番号。
 * @param {() => void} onNext - 次のステップに進むためのコールバック関数。
 * @param {() => void} onClose - チュートリアルを閉じるためのコールバック関数（現在は未使用）。
 *
 * @returns {JSX.Element | null} 現在のステップが1の場合にチュートリアルUIを返します。それ以外はnullを返します。
 */
"use client";
import React, { useEffect, useState } from 'react';
import './Tutorial.css';

interface TutorialProps {
  step: number;
  onNext: () => void;
  onClose: () => void;
}

const Tutorial: React.FC<TutorialProps> = ({ step, onNext }) => {
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [messageStyle, setMessageStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    let button: HTMLElement | null = null;
    let originalZIndex = '';
    let originalPosition = '';

    if (step === 1) {
      button = document.getElementById('record-good-posture-button');
      if (button) {
        originalZIndex = button.style.zIndex;
        originalPosition = button.style.position;

        button.style.position = 'relative';
        button.style.zIndex = '10001';

        const updatePositions = (targetButton: HTMLElement) => {
          const rect = targetButton.getBoundingClientRect();
          const highlightPadding = 10;
          
          setHighlightStyle({
            top: `${rect.top - highlightPadding}px`,
            left: `${rect.left - highlightPadding}px`,
            width: `${rect.width + highlightPadding * 2}px`,
            height: `${rect.height + highlightPadding * 2}px`,
          });

          setMessageStyle({
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '900px',
          });

          setArrowStyle({
            position: 'absolute',
            top: `${rect.top - 50}px`,
            left: `${rect.left + rect.width / 2}px`,
          });
        };

        updatePositions(button);

        const scrollHandler = () => updatePositions(button!);
        const resizeHandler = () => updatePositions(button!);

        window.addEventListener('scroll', scrollHandler, true);
        window.addEventListener('resize', resizeHandler);
        
        const handleClick = () => {
          onNext();
        };
        button.addEventListener('click', handleClick, { once: true });
        
        return () => {
          if (button) {
            button.removeEventListener('click', handleClick);
            button.style.zIndex = originalZIndex;
            button.style.position = originalPosition;
          }
          window.removeEventListener('scroll', scrollHandler, true);
          window.removeEventListener('resize', resizeHandler);
        };
      }
    }
  }, [step, onNext]);

  if (step !== 1) return null;

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-highlight" style={highlightStyle}></div>
      <div className="tutorial-message" style={messageStyle}>
        <h2>最初に、あなたの最も良い姿勢を記録しましょう。</h2>
        <p>背筋を伸ばし、肩の力を抜き、顎を引いてまっすぐ前を見つめます。</p>
        <p>準備ができたら、下のボタンを押してください！</p>
      </div>
      <svg className="tutorial-arrow" style={arrowStyle} width="40" height="40" viewBox="0 0 24 24" fill="white">
        <path d="M12 21l-12-12h7v-9h10v9h7z"/>
      </svg>
    </div>
  );
};

export default Tutorial;
