# Obsidian Link Externalizer (日本語)

Obsidian の内部リンクを、参照先ノートの frontmatter に定義された URL へ変換してくれるプラグインです。ノートを Obsidian の外でも共有しやすくなります。

## 主な機能

- **URL 変換**: リンク先ノートの frontmatter に URL があれば、自動的に外部リンクへ変換
- **フォールバック動作**: URL が見つからない場合はリンクを取り除き、テキストのみを残す
- **複数フォーマット対応**: Markdown リンクと Wiki リンクの両方をサポート
- **処理モード**: ドキュメント全体・選択範囲のどちらも変換可能

## 変換例

このプラグインは、現在編集中のノート内のリンクを走査し、参照先ノートの frontmatter を確認して変換します。

### 参照されるノートの例

1. URL を持つノート
   ```md
   ---
   title: obsidian
   url: https://obsidian.md/
   ---
   Local note about Obsidian
   ```

2. URL を持たないノート
   ```md
   ---
   title: another-note
   url:
   ---
   Local note without url
   ```

### 変換結果

変換前:
```md
---
title: My Note
---
Obsidian is a great note-taking app!
Learn more about [[obsidian]].

You can also use it for [[another-note]] which has no URL in frontmatter.
```

変換後:
```md
---
title: My Note
---
Obsidian is a great note-taking app!
Learn more about [obsidian](https://obsidian.md/).

You can also use it for another-note which has no URL in frontmatter.
```

### 変換ルール

- URL を持つノートへのリンク → 外部リンクに変換
- URL を持たないノートへのリンク → リンクを取り除き、表示テキストのみ残す
