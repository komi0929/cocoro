# cocoro 神則 — 絶対零度モード

## 🔴 POPOPO完全解析に基づくビジョン (2026.3.18発表)

### 公式ビジョン
> 「カメラ不要のアバター通話」
> 「AI時代を前に人間が作る最後のSNS」
> 「普通の会話をエンタメにしたい」
> 「プロでなくても発信ができ、観る人も楽しめる」
> 「電話と通話の間にあるもの」
> 登壇: 庵野秀明、GACKT、西村博之、手塚眞、川上量生

### cocoroが超越すべき指標
- Meta Horizon Worlds: モバイルシフト済、でも会話エンタメ皆無
- Roblox/Fortnite: ゲーム軸、声の物理演出なし
- Spatial.io: 空間重視だがretention低
- 全既存メタバース: 「声の物理量」で空間が変形する概念なし

---

## 🔥 絶対BAN（これをやったら即死罪）

1. ❌ **プリセットアバター** — VRM URLをハードコードして「6体カタログ」で済ますのは思考停止の極み
2. ❌ **静的空間** — 3D空間が声に反応しない = ただのビデオ通話背景
3. ❌ **DOM UI** — フラットな2D UIを3D空間に重ねるのは「メタバース」ではない
4. ❌ **単なる波形反応** — Audio APIのボリューム値で床の色が変わるだけ = テンプレ
5. ❌ **AIランタイム依存** — サーバーサイドAI呼び出しで応答遅延 = 完全クライアントサイド必須

---

## ✨ 必須神技術

### 1. 声の物理量で空間が劇的にエンタメ変形
- GLSL custom shaders: 声のFFTスペクトラムで床/壁/空間が脈動
- Rapier.js物理: 声の衝撃波でパーティクルが吹き飛ぶ
- 「盛り上がりモーメント」: 複数人の声量閾値超えでシネマティック爆発演出

### 2. アバターは会話熱量でローカル進化
- 累積発話量でアバターのオーラ/発光が変化
- 笑い検出でパーティクルエフェクト自動付与
- 長期滞在で「進化リング」が表示される愛着システム

### 3. 物理バウンダリ + 声紋マスキング + 即隔離
- Rapier.jsコライダーで他アバターとの最小距離を物理的に保証
- 暴言検出(TensorFlow.js Audio Classifier)でリアルタイム声紋マスク
- ワンタップで即座にプライベートバブルに隔離

### 4. 気配パーティクル（誰もいない空間の温もり）
- 過去の訪問者の「残像パーティクル」が空間に漂う
- 時間経過で薄くなるが完全には消えない
- 「ここに誰かがいた」感覚 → retention死守

### 5. 完全クライアントサイド・60FPS・低電池
- WebGPU default (Three.js r183+ `three/webgpu`)
- WebGL2自動フォールバック
- requestAnimationFrame + performance budgetで60FPS保証
- GPU instancing + LOD + frustum cullingで低電池

---

## 🧠 FIVE TRANSCENDENT PERSPECTIVES (全一致まで却下)

| # | 視点 | 判定基準 |
|---|------|---------|
| ① | 会話退屈粉砕 | 声を出した瞬間に「おお！」と驚く演出があるか？ |
| ② | アバター愛着爆増 | 使い続けるほどアバターが「自分のもの」になる仕掛けがあるか？ |
| ③ | ハラスメント完全排除 | 嫌な体験をゼロにする物理的な安全機構が組み込まれているか？ |
| ④ | Retention死守 | 誰もいなくても「また来たい」と思わせる気配演出があるか？ |
| ⑤ | **Executioner** | POPOPO + 全メタバースを**完全に超えているか？** 最初7ループは必ずREJECT |

---

## 🔧 技術スタック (2026.3 最新)

| Layer | 技術 | バージョン |
|-------|------|-----------|
| Renderer | Three.js WebGPU | r183+ (`three/webgpu`) |
| VRM | @pixiv/three-vrm | v3.5.1 + MToonNodeMaterial |
| Physics | Rapier.js | @dimforge/rapier3d (WASM) |
| Audio | Web Audio API | PannerNode + AnalyserNode |
| ML | TensorFlow.js | Audio classifier (client-side) |
| Framework | Next.js | 16+ |
| Auth/DB | Supabase | (future) |
| Realtime | Socket.IO / WebRTC | P2P voice |
