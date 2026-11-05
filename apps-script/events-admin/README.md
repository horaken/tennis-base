# eventsシート管理画面のセットアップ

**既存の `Code.gs` は置き換えないでください。** そこにある `doGet(e)` は動画検索APIで使われています。管理画面は同じウェブアプリの `?admin=1` 経由で開くように追加します。

**対象スプレッドシート:** [tennis-baseのGoogleスプレッドシートを開く](https://docs.google.com/spreadsheets/d/1s-Py0EYGTouk8BqavwxQLYF9tQfQwR018z8ZkXUFg9I/edit)

操作するタブ名は **`events`** です（「イベント参加者」タブではありません）。サイト側の管理者ボタンは、デプロイ後に設定したウェブアプリURLを別タブで開きます。

## 初回セットアップ

1. 対象スプレッドシートで **拡張機能 → Apps Script** を開きます。
2. 既存の `Code.gs` の一番下へ、このフォルダーの `Code.gs` の内容を追加します。既存の `doGet(e)` は残してください。
3. 既存 `doGet(e)` 関数の冒頭に次の分岐を追加します。これにより、`?admin=1` のときだけHTML管理画面を返し、通常の `?name=...` 動画検索APIはそのまま動きます。
   ```javascript
   if (e && e.parameter && e.parameter.admin === "1") {
     return eventsAdminPage_();
   }
   ```
4. Apps Scriptで作成済みのHTMLファイル **`index_2.html`** に、`Index.html` の内容を貼り付けます。既存の `index.html` は変更しません。コードからは拡張子を除いた `index_2` として呼び出します。
5. Apps Scriptの **プロジェクトの設定 → スクリプト プロパティ** に次を登録します。
   - `SPREADSHEET_ID`: 対象スプレッドシートID（URL中の `/d/` と次の `/` の間）
   - ADMIN_ID`: 管理者用の共有ID
   - `ADMIN_PASSWORD`: 十分に長く、他で使い回していない共有パスワード
6. `events` シートの1行目に、次の列見出しがあることを確認します（順序は問いません）。
   `id`, `date`, `title`, `location`, `participants`, `practiceContents`, `comment`, `videos_title`, `videos_url`, `aiConsultations_title`, `aiConsultations_url`, `participantNames`
7. **デプロイ → デプロイを管理 → 編集** で既存ウェブアプリのバージョンを更新します（初回デプロイの場合は新しいデプロイ）。実行ユーザーはシートに書き込みできる自分のアカウントにします。アクセス可能範囲は運用方針に合わせ、共有ID/Passwordも関係者以外へ共有しないでください。
8. ウェブアプリURL（末尾 `/exec`）を、サイトのプロジェクトルートにある `.env.local` の `VITE_ADMIN_WEB_APP_URL` に設定します。サイトのボタンが `?admin=1` を付けて開きます。例:
   `VITE_ADMIN_WEB_APP_URL=https://script.google.com/macros/s/デプロイID/exec`
9. Vite開発サーバーを再起動します。サイトを再読み込みし、ホーム上部の「管理者用」ボタンからログイン画面を開きます。

保存前には画面で確認を出します。検索した既存イベントのIDは編集できず、新規IDがすでに使われている場合も登録を拒否します。ID、開催日、イベント名が必須です。既存行の他列はそのまま保持し、管理対象の列だけ更新します。

## 注意

- 既存コードには `status` 列を使って `events.json` をGitHubへ同期する処理があります。`status` 列を削除済みなら、その同期関数と `checkStatusChange` トリガーは現在のシート列と合いません。JSON同期を終了する方針が決まった段階で、関連トリガーも確認して整理してください。今回の管理機能追加では既存同期処理を削除しません。
- Apps Scriptコードはこのリポジトリに置いてありますが、Googleアカウントへ自動反映・デプロイはされません。上記の貼り付けとデプロイはGoogle Apps Script画面で行います。
- `ADMIN_ID` と `ADMIN_PASSWORD` はスクリプトプロパティに保存され、サイトのフロントエンドコードには含まれません。
- Apps Scriptのウェブアプリで利用可能なアクセス範囲は、Google Workspaceの管理ポリシーにより異なります。意図した利用者だけがページへアクセスできる範囲を選び、公開設定時は共有認証情報の管理に注意してください。
