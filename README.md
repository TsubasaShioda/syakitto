# syakitto

Webカメラを使い、リアルタイムで猫背を検知してスコアを表示するアプリケーションである。

## 概要

`syakitto`は、TensorFlow.jsとMoveNetモデルを利用し、ユーザーの姿勢をリアルタイムで分析する。特に、耳と目の位置関係から「猫背スコア」を算出し、ユーザーにフィードバックを提供する。スコアが高くなる（猫背になる）ほど、表示スコアの色が赤に近づく仕様である。

## 使い方

1.  デプロイ先のURLにアクセスする。
2.  ブラウザからカメラへのアクセスを許可する。
3.  画面に表示される猫背スコアを確認する。

## 特徴

- **リアルタイム姿勢分析**: Webカメラの映像からリアルタイムで姿勢を分析する。
- **プライバシー配慮**: 映像処理はすべてブラウザ上で完結し、外部にデータが送信されることはない。
- **簡易的な検知**: 肩が完全に映っていなくても、顔のパーツから姿勢を推定可能である。
- **シンプルなUI**: 猫背スコアとカメラ映像のみを表示する、直感的なインターフェースを持つ。

## 技術スタック

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [TensorFlow.js](https://www.tensorflow.org/js)
  - [@tensorflow-models/pose-detection](https://github.com/tensorflow/tfjs-models/tree/master/pose-detection) (MoveNet)
- [Tailwind CSS](https://tailwindcss.com/)
- [Electron](https://www.electronjs.org/) (デスクトップアプリ版)

## 開発者向けセットアップ

ローカル環境で開発を行う場合は、以下の手順でセットアップを行う。

1.  **リポジトリのクローン:**
    ```bash
    git clone https://github.com/TsubasaShioda/syakitto.git
    cd syakitto
    ```
2.  **依存関係のインストール:**
    ```bash
    npm install
    ```
3.  **開発サーバーの起動:**
    ```bash
    npm run dev
    ```
4.  **ブラウザで確認:**
    [http://localhost:3000](http://localhost:3000) をブラウザで開く。

### Electron デスクトップアプリ開発

デスクトップアプリとして開発する場合は、以下のコマンドを使用する。

1.  **Electron開発モードの起動:**
    ```bash
    npm run electron:dev
    ```
    このコマンドは、Next.jsの開発サーバーとElectronアプリを同時に起動する。

2.  **Electronアプリの単体起動:**
    ```bash
    npm run electron:start
    ```

3.  **デスクトップアプリのパッケージング:**
    ```bash
    # macOS向け
    npm run electron:package:mac

    # Windows向け
    npm run electron:package:win

    # Linux向け
    npm run electron:package:linux
    ```
    パッケージ化されたアプリは `release/` ディレクトリに出力される。

### ビルド確認

変更をコミットする前に、以下のコマンドでローカルでのビルドが成功することを確認する。

```bash
npm run build
```

## 猫背スコアの計算について

本アプリケーションは、以下のキーポイントを基に猫背の度合いをスコア化する。

-   **主要キーポイント**: `left_ear`, `right_ear`, `left_eye`, `right_eye`, `left_shoulder`, `right_shoulder`
-   **計算ロジック**:
    1.  耳と目のY座標の平均値をそれぞれ算出する。
    2.  肩が表示されている場合は両肩のY座標の平均値を、表示されていない場合は目と耳の位置関係から肩のおおよその位置を推定する。
    3.  「目と肩の垂直距離」を基準とした「耳と肩の垂直距離」の比率 (`postureRatio`) を計算する。
    4.  この比率が一定の閾値を超えると、猫背と判断しスコアを0から100の範囲で正規化する。
    5.  スコアの急な変動を抑制するため、移動平均を用いて滑らかな値を最終的なスコアとして表示する。
