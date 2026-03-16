# POPOPO ABSOLUTE LAWS — kokoro 恒久ルール
# このルールは全エージェント・全推論プロセスに強制適用される憲法

## [BAN] Primitive Geometry & Basic Material
- `BoxGeometry`, `PlaneGeometry`, `TorusGeometry`, `SphereGeometry` 等の標準ジオメトリに `MeshStandardMaterial` / `MeshBasicMaterial` をベタ塗りすることを禁ずる
- 必ずカスタムGLSL（`ShaderMaterial` のフラグメント/頂点シェーダー）を使用し、物理ベースレンダリング（PBR）またはカスタムライティングを実装すること
- 例外: VRMモデル内のマテリアルはVRM仕様に従う

## [BAN] T-Pose / A-Pose
- アバターの硬直ポーズはシステムエラーと見なす
- VRMロード直後から `Math.sin` と時間軸を用いた「生々しい呼吸・揺らぎ（Idle Animation）」を `VRMHumanBoneName` API で実装すること
- `LeftUpperArm` / `RightUpperArm` の初期回転 (±0.5rad) で腕を下ろすこと
- 自動瞬き、肩の微動、頭部の揺れを必須とする

## [BAN] Default HTML/CSS UI
- 画面に張り付く野暮ったいDOM要素（素のdiv, button）を禁ずる
- UIは Diegetic UI（3D空間内描画）か、高度な `backdrop-filter: blur` を用いた Glassmorphism で空間に溶け込ませること
- 必須パラメータ: `backdrop-blur-2xl`, `backdrop-saturate-150`, `bg-white/4`, `border-white/8`

## [BAN] Static Lerp Formation
- アバター配置に静的な `THREE.MathUtils.lerp` を使用することを禁ずる
- Spring Physics（ばね物理演算）またはVerlet Integrationを使用し、弾力のある動的な座標補間を実装すること
- 会話の熱量をAttraction Forceとして引力モデルに反映すること

## [REQUIREMENT] Post-Processing
- `EffectComposer` を必須とし、以下を常に稼働させること:
  - Bloom（光の溢れ、密度連動の動的threshold）
  - Vignette（視線誘導、darkness >= 0.8）
  - ChromaticAberration（密度連動）
- 密度が高まるほどBloom intensity を上げ、threshold を下げること

## [REQUIREMENT] Voice-Reactive Visuals
- 発話者の足元からGLSLシェーダーで波紋を描画すること
- 波紋はFFT周波数データに連動して色相・強度が変化すること
- ROM専ユーザーのタップ/ジャイロに反応するインタラクションを実装すること

## [REQUIREMENT] Cinematic Camera
- ページロード時に「Loading...」テキストを出すことを禁ずる
- 宇宙空間からアバターの背後へダイブするシネマティックカメラトランジションを必須とする
- フェーズ遷移時のカメラ距離変化と、常時の呼吸的微揺れを実装すること
