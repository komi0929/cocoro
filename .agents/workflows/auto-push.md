---
description: タスク完了時に自動でgit commit & pushする
---
// turbo-all

## 手順

1. ステージング
```
git add -A
```

2. 差分確認（空なら終了）
```
git diff --cached --stat
```

3. コミット（日本語メッセージ、変更内容を自動要約）
```
git commit -m "<変更内容を1行で要約>"
```

4. プッシュ
```
git push origin main
```
