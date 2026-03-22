---
description: 3Dボクセルアセットを生成・修正するときのワークフロー
---

# ボクセルアセット生成ワークフロー

// turbo-all

## 必読
1. まず `.agents/voxel-system/DESIGN_RULES.md` を読む（**絶対**）
2. 参考画像を確認する（`DESIGN_RULES.md` 内のルール参照）

## 新アセット追加
3. ユーザーの指示を `DESIGN_RULES.md` Section 5 に追記する
4. 適切なファイルに生成関数を追加する
   - アバター → `VoxelAvatars.ts`
   - 家具 → `VoxelFurniture.ts`
   - 環境 → `VoxelEnvironments.ts`
   - その他 → `VoxelModels.tsx`
5. `VoxelAudit.tsx` に登録する
6. `npm run dev` でサーバー起動済みなら `http://localhost:5173/?audit=voxel` を開く
7. ブラウザでスクリーンショットを撮影し品質確認する
8. `DESIGN_RULES.md` Section 6 の品質評価を更新する
9. ユーザーにスクリーンショット付きで報告する

## 既存アセット改善
3. `?audit=voxel` で現状をスクリーンショット撮影する
4. `DESIGN_RULES.md` のルールと照合してギャップを特定する
5. **デザインを改善する（ボクセル数は増やさない）**
   - プロポーション修正
   - 色の調整
   - パーツ配置の改善
6. 再度スクリーンショットで確認する
7. ユーザーに before/after で報告する

## 厳禁事項
- ❌ `DESIGN_RULES.md` を読まずにコード修正する
- ❌ 「グリッド拡大」「密度増加」で品質を上げようとする
- ❌ スクリーンショットなしで完了報告する
- ❌ PowerShellで `&&` を使う（`;` を使うか `Cwd` パラメータを使う）
