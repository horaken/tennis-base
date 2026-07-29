# tennis-base.net

テニスコミュニティ向けの情報発信サイトです。開催記録と今後の開催予定を、管理者がJSONファイルを更新するだけで掲載できます。利用者向けのログイン・投稿機能はありません。

## フォルダ構成

```text
tennis-base/
├─ index.html          # トップページ
├─ events.html         # 開催記録一覧
├─ event.html          # 開催記録の詳細表示（共通ページ）
├─ schedule.html       # 今後の開催予定
├─ css/
│  └─ style.css        # 共通デザイン・スマホ表示
├─ js/
│  └─ app.js           # JSONの読み込みと画面表示
└─ data/
   ├─ events.json      # 開催記録データ
   └─ schedule.json    # 開催予定データ
```

## 開催情報の追加方法

`data/events.json` の配列の先頭に、次の形式で新しい開催情報を追加します。`id` はほかの記録と重複しない値にしてください。

```json
{
  "id": "2026-08-10-arakawa-practice",
  "date": "2026-08-10",
  "title": "荒川練習会",
  "location": "荒川河川敷テニスコート",
  "participants": "8名",
  "practiceContents": ["サーブ練習", "ラリー練習"],
  "comment": "練習会のコメントを入力します。",
  "photos": [
    {
      "url": "assets/images/2026-08-10-01.jpg",
      "alt": "荒川練習会の様子"
    }
  ],
  "videos": [
    {
      "title": "練習動画",
      "url": "https://video.example.com/your-video"
    }
  ],
  "aiConsultations": [
    {
      "participant": "参加者名または全体",
      "title": "AI相談結果のタイトル",
      "url": "https://example.com/your-ai-result"
    }
  ]
}
```

- `practiceContents`、`photos`、`videos`、`aiConsultations` は複数追加できます。
- 写真を使わない場合は `"photos": []` とします。画像は将来 `assets/images/` フォルダを作成して配置できます。
- 動画・AI相談結果のURLは、実際に共有する外部ページのURLへ置き換えてください。
- 追加後にGitHubへ反映すると、開催記録一覧、詳細ページ、トップページの最新開催情報へ自動で表示されます。

## GitHub Pages公開方法

1. GitHubでリポジトリを作成し、このフォルダ内のファイルを `main` ブランチへアップロードします。
2. リポジトリの **Settings** → **Pages** を開きます。
3. **Build and deployment** のSourceで **Deploy from a branch** を選択します。
4. Branchに `main`、フォルダに `/ (root)` を選び、保存します。
5. 数分後に表示されるURLで公開を確認します。
6. 独自ドメインを使う場合は、同じ画面の **Custom domain** に `tennis-base.net` を入力し、ドメイン管理サービス側でGitHub Pages向けのDNS設定を行います。

GitHub Pagesでは、公開ページを直接ファイルとして開くのではなく、公開URLまたはローカルWebサーバー経由で確認してください。JSONデータはJavaScriptで読み込むため、`file://` 形式で直接開くとブラウザの制限により表示されない場合があります。
