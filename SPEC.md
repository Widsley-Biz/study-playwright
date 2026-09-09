# Comdesk Practice 画面仕様書（SPEC）

> **この仕様は固定です。UI の見た目を変えても `data-testid` は変更しません。**
>
> 本ドキュメントは QA エンジニア向け Playwright 研修および社内認定試験の「正」です。
> ここに記載された `data-testid`・表示ラベル・ボタン名・エラー文言は、研修教材および試験問題の
> 前提条件として扱われます。スタイル（色・余白・レイアウト・アイコン）の変更は随時行いますが、
> **`data-testid` の削除・リネームは行いません**。文言や要素を追加する場合は、必ず本ドキュメントを
> 同時に更新します（[改修時のルール](./README.md#改修時のルール) 参照）。

- 対象アプリ: Comdesk Practice（研修専用練習アプリ / ビルド不要の静的サイト）
- 最終更新: 2026-08-17
- 掲載 `data-testid` 数: **141 個（ユニーク）**

---

## 目次

1. [アカウント仕様・セッション仕様](#1-アカウント仕様セッション仕様)
2. [画面一覧](#2-画面一覧)
3. [共通シェル（ヘッダー / サイドバー）](#3-共通シェルヘッダー--サイドバー)
4. [全ページ共通の要素](#4-全ページ共通の要素)
5. [`/` ルート（リダイレクト専用）](#5--ルートリダイレクト専用)
6. [`/auth/` ログイン](#6-auth-ログイン)
7. [`/call/` 通常コールモード](#7-call-通常コールモード)
8. [`/announce/` 情報共有ボード](#8-announce-情報共有ボード)
9. [`/keyword-detect/` キーワード設定](#9-keyword-detect-キーワード設定)
10. [`/users/` ユーザー管理](#10-users-ユーザー管理)
11. [`/access/` アクセス管理](#11-access-アクセス管理)
12. [`/profile/` プロフィール設定](#12-profile-プロフィール設定)
13. [`404.html` ページが見つかりません](#13-404html-ページが見つかりません)
14. [既知の注意点（テストを書く前に必ず読む）](#14-既知の注意点テストを書く前に必ず読む)
15. [testid 一覧（索引）](#15-testid-一覧索引)

---

## 1. アカウント仕様・セッション仕様

### 1.1 研修用アカウント

| 項目 | 値 |
| --- | --- |
| ユーザーID | `user001@widsley.com` 〜 `user010@widsley.com`（10 アカウント） |
| パスワード | `password`（全アカウント共通） |
| ログイン後の遷移先 | `/call/`（通常コールモード） |
| 未ログインで保護ページを開いた場合 | `/auth/` へリダイレクト（`location.replace`） |

ユーザーIDと表示名の対応は固定です。

| ユーザーID | 表示名 |
| --- | --- |
| `user001@widsley.com` | 田中 太郎 |
| `user002@widsley.com` | 山田 花子 |
| `user003@widsley.com` | 佐藤 健 |
| `user004@widsley.com` | 鈴木 一郎 |
| `user005@widsley.com` | 高橋 美咲 |
| `user006@widsley.com` | 伊藤 大輔 |
| `user007@widsley.com` | 渡辺 結衣 |
| `user008@widsley.com` | 中村 翔 |
| `user009@widsley.com` | 小林 彩 |
| `user010@widsley.com` | 加藤 直樹 |

入力されたユーザーIDは `trim()` および小文字化してから判定されます。
したがって `  USER001@WIDSLEY.COM  ` でもログインできます。

### 1.2 セッションと業務データ

| 種別 | 保存先 | リロード時の挙動 |
| --- | --- | --- |
| ログインセッション | `sessionStorage`（キー: `comdesk-practice-session`、値: `{"userId":"...","name":"..."}`） | 保持される（同一タブ内）。タブを閉じると消える |
| 業務データ（投稿・キーワード・ユーザー・通知設定・プロフィール） | JavaScript のメモリのみ | **必ず初期状態に戻る** |

- 業務データはどこにも永続化されません。ページをリロードした時点で必ず同じ初期データに戻るため、
  **テストケースは互いに独立**し、実行順序に依存しません。後片付け（クリーンアップ）処理は不要です。
- ネットワーク通信・API 呼び出しは一切ありません。アニメーションと人工的な遅延も入れていないため、
  待機は Playwright の自動待機（web-first assertion）だけで十分です。

### 1.3 ログイン・ログアウトの経路

| 操作 | 結果 |
| --- | --- |
| `/auth/` で正しい ID / パスワードを入力し「ログイン」 | `sessionStorage` にセッション保存 → `/call/` へ遷移 |
| 保護ページ（`/call/` `/announce/` `/keyword-detect/` `/users/` `/access/` `/profile/`）を未ログインで開く | `/auth/` へ即リダイレクト（履歴を残さない `location.replace`） |
| ヘッダーのプロフィールメニュー →「ログアウト」 | `sessionStorage` からセッション削除 → `/auth/` へ遷移 |
| `/`（ルート）を開く | ログイン状態に関わらず **常に** `/auth/` へリダイレクト |

---

## 2. 画面一覧

| パス | 画面名 | ログイン要否 | 主な用途（研修での位置づけ） |
| --- | --- | --- | --- |
| `/` | ルート（リダイレクト） | 不要 | Day1: `page.goto()` とリダイレクト追従の確認 |
| `/auth/` | ログイン | 不要 | Day1: ロケーター基礎、フォーム入力、正常系／異常系。Day3: 認証状態の使い回し（storageState） |
| `/call/` | 通常コールモード | **必要** | Day1: ログイン後の着地確認。Day2: テーブル行の取得、`nth` / `filter` / `toHaveCount` |
| `/announce/` | 情報共有ボード | **必要** | Day2: モーダル操作、CRUD（投稿・編集・削除）、ページネーション、`exact` の使い分け |
| `/keyword-detect/` | キーワード設定 | **必要** | Day2: モーダル + テーブルの複合操作、`select` / `checkbox` の操作 |
| `/users/` | ユーザー管理 | **必要** | Day2: 行を特定して編集、`select` の値検証 |
| `/access/` | アクセス管理 | **必要** | Day3: トグル操作、複数フィールドのバリデーション網羅（試験の主要題材） |
| `/profile/` | プロフィール設定 | **必要** | Day1〜Day3: ログイン中ユーザーの検証、ヘッダーメニュー経由の遷移 |
| `404.html` | ページが見つかりません | 不要 | Day3: 存在しない URL のハンドリング確認 |

> URL は必ず **末尾スラッシュ付き**（`/auth/`）で指定してください。理由は
> [README の Playwright からの使い方](./README.md#playwright-からの使い方) を参照。

---

## 3. 共通シェル（ヘッダー / サイドバー）

ログインが必要な全ページ（`/call/` `/announce/` `/keyword-detect/` `/users/` `/access/` `/profile/`）に
共通で描画されるヘッダーとサイドバーです。`assets/app.js` が JavaScript で組み立てます。

### 3.1 ヘッダー

| data-testid | 要素種別 | 表示ラベル・ボタン名 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `app-brand` | span（テキスト） | `Comdesk Practice` | `getByTestId('app-brand')` | ロゴ SVG + サービス名。`aria-hidden` の SVG を含む |
| `profile-menu-button` | button | ログイン中ユーザーの表示名（例: `田中 太郎`） | `getByTestId('profile-menu-button')` / `getByRole('button', {name:'田中 太郎'})` | `aria-haspopup="true"`。クリックでメニューを開閉し `aria-expanded` が `"true"` / `"false"` に変化 |
| `header-user-name` | span（テキスト） | ログイン中ユーザーの表示名 | `getByTestId('header-user-name')` | `profile-menu-button` の内側。頭文字アバターは `aria-hidden` |
| `profile-menu` | ul（メニュー本体） | — | `getByTestId('profile-menu')` | 初期状態は `hidden`。`profile-menu-button` クリックで表示 |
| `menu-profile` | a（リンク） | `プロフィール` | `getByTestId('menu-profile')` / `getByRole('link', {name:'プロフィール'})` | `/profile/` へ遷移。メニューが閉じている間は role 検索にヒットしない |
| `menu-logout` | a（リンク） | `ログアウト` | `getByTestId('menu-logout')` / `getByRole('link', {name:'ログアウト'})` | クリックでセッション破棄 → `/auth/` へ遷移 |

### 3.2 サイドバー

見出しは `MENU`（固定テキスト）。`<nav aria-label="メインメニュー">` の中に 5 本のリンクが入ります。

| data-testid | 要素種別 | 表示ラベル | 推奨ロケーター | 遷移先 |
| --- | --- | --- | --- | --- |
| `nav-call` | a（リンク） | `通常コールモード` | `getByTestId('nav-call')` / `getByRole('link', {name:'通常コールモード'})` | `/call/` |
| `nav-announce` | a（リンク） | `情報共有ボード` | `getByTestId('nav-announce')` / `getByRole('link', {name:'情報共有ボード'})` | `/announce/` |
| `nav-keyword-detect` | a（リンク） | `キーワード設定` | `getByTestId('nav-keyword-detect')` / `getByRole('link', {name:'キーワード設定'})` | `/keyword-detect/` |
| `nav-users` | a（リンク） | `ユーザー管理` | `getByTestId('nav-users')` / `getByRole('link', {name:'ユーザー管理'})` | `/users/` |
| `nav-access` | a（リンク） | `アクセス管理` | `getByTestId('nav-access')` / `getByRole('link', {name:'アクセス管理'})` | `/access/` |

- 現在表示中のページのリンクだけに `aria-current="page"` が付きます。
- **`/profile/` にはアクティブなナビ項目がありません**（`aria-current="page"` の要素は 0 個）。
  サイドバーには `/profile/` へのリンクも存在しません。プロフィール画面へはヘッダーメニューから遷移します。

---

## 4. 全ページ共通の要素

ログインが必要な 6 ページすべてに存在します。

| data-testid | 要素種別 | 表示内容 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `page-title` | h1（見出し） | 画面名（例: `通常コールモード`） | `getByTestId('page-title')` / `getByRole('heading', {name:'通常コールモード'})` | 画面判定に最も使いやすい要素 |
| `flash-area` | div（コンテナ） | — | `getByTestId('flash-area')` | `aria-live="polite"`。**常に DOM に存在する空の入れ物**。中身が無くても `toBeVisible()` は成立しない場合があるため、判定には `flash-message` を使う |
| `flash-message` | div（アラート） | 操作結果メッセージ | `getByTestId('flash-message')` | `role="status"`。操作後に `flash-area` の中へ動的に挿入される。**同時に 1 件のみ**（新しいメッセージが古いものを置き換える）。自動では消えない（ページ遷移／リロードまで残る） |

---

## 5. `/` ルート（リダイレクト専用）

- **URL**: `/`（`index.html`）
- **説明**: JavaScript で `/auth/` へ即座に `location.replace()` します。ログイン済みかどうかは判定しません。
  実質的に中身を目視することはできず、`page.goto('/')` すると最終 URL は `/auth/` になります。

| data-testid | 要素種別 | 表示ラベル | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `redirect-message` | p（テキスト） | `読み込み中…` | `getByTestId('redirect-message')` | リダイレクト前の一瞬だけ表示。テストで捕まえることは想定していない |
| `redirect-link` | a（リンク） | `ログイン画面へ進む` | `getByTestId('redirect-link')` | `<noscript>` 内。JavaScript 有効時は表示されない |

### 画面遷移

| 条件 | 遷移先 |
| --- | --- |
| 常に | `/auth/`（履歴を残さない `location.replace`） |

---

## 6. `/auth/` ログイン

- **URL**: `/auth/`
- **`<title>`**: `ログイン | Comdesk Practice`
- **説明**: ユーザーID とパスワードを入力してログインします。ログイン不要（未ログイン用画面）。
  画面下部に研修用アカウントのヒント（`user001@widsley.com` 〜 `user010@widsley.com` / `password`）が
  常時表示されています。フォームは `novalidate` のため、ブラウザ標準のバリデーションは動作しません。

### 要素表

| data-testid | 要素種別 | 表示ラベル・ボタン名 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `login-form` | form | — | `getByTestId('login-form')` | `novalidate`。submit をハンドリング（Enter キーでも送信される） |
| `login-userid` | input[type=text] | `ユーザーIDまたはメールアドレス必須` | `getByTestId('login-userid')` / `getByLabel('ユーザーIDまたはメールアドレス')` / `getByRole('textbox', {name:'ユーザーIDまたはメールアドレス'})` | `id="userId"`。ラベル内に「必須」バッジを含むため、ラベル文字列の完全一致は `ユーザーIDまたはメールアドレス必須` |
| `login-userid-error` | p（エラー文） | `必須項目です` | `getByTestId('login-userid-error')` | 初期状態は `hidden` |
| `login-password` | input[type=password] | `パスワード必須` | `getByTestId('login-password')` / `getByLabel('パスワード')` / `getByRole('textbox', {name:'パスワード'})` | `id="password"`。この画面では `getByLabel('パスワード')` は 1 件だけヒットする |
| `login-password-error` | p（エラー文） | `必須項目です` | `getByTestId('login-password-error')` | 初期状態は `hidden` |
| `login-submit` | button[type=submit] | `ログイン` | `getByTestId('login-submit')` / `getByRole('button', {name:'ログイン'})` | 画面幅いっぱいのボタン |
| `login-error-area` | div（コンテナ） | — | `getByTestId('login-error-area')` | `aria-live="polite"`。常に DOM に存在する空の入れ物 |
| `login-error` | div（アラート） | `ログインに失敗しました` | `getByTestId('login-error')` | `role="alert"`。認証失敗時に `login-error-area` の中へ動的に挿入される |

その他、`h1` として `ログイン` の見出しがあります（`getByRole('heading', {name:'ログイン'})`）。

### エラーメッセージ一覧

| 発生条件 | 表示文言 | 表示先 testid |
| --- | --- | --- |
| ユーザーID が空（空白のみを含む） | `必須項目です` | `login-userid-error` |
| パスワードが空 | `必須項目です` | `login-password-error` |
| 両方入力済みだが認証に失敗（ID が規定形式外／パスワードが `password` 以外） | `ログインに失敗しました` | `login-error` |

- **空欄チェックが優先されます。** どちらかが空の場合は認証処理自体を行わないため、
  `login-error`（`ログインに失敗しました`）は表示されません。
- 送信のたびに、直前のエラー表示はすべてクリアされてから再判定されます。

### 画面遷移

| 条件 | 遷移先 |
| --- | --- |
| 認証成功 | `/call/` |
| 認証失敗・入力エラー | 遷移せず、同一画面にエラー表示 |

---

## 7. `/call/` 通常コールモード

- **URL**: `/call/`（**要ログイン**）
- **`<title>`**: `通常コールモード | Comdesk Practice`
- **`page-title`**: `通常コールモード`
- **説明**: 本日の架電サマリー（4 つの数値カード）と、架電リスト（5 行のテーブル）を表示します。
  「発信」を押すとフラッシュメッセージが出るだけで、データは変化しません（読み取り中心の画面）。

### 要素表

| data-testid | 要素種別 | 表示ラベル・値 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `page-title` | h1 | `通常コールモード` | `getByTestId('page-title')` / `getByRole('heading', {name:'通常コールモード'})` | — |
| `flash-area` | div | — | `getByTestId('flash-area')` | 共通仕様（§4） |
| `flash-message` | div | `<顧客名> に発信しました` | `getByTestId('flash-message')` | `role="status"`。「発信」クリック時のみ出現 |
| `stat-row` | section（コンテナ） | — | `getByTestId('stat-row')` | 数値カード 4 枚の親 |
| `stat-call-count` | div（数値） | `42`（ラベル: `本日の架電数`） | `getByTestId('stat-call-count')` | 固定値 |
| `stat-connect-rate` | div（数値） | `38%`（ラベル: `接続率`） | `getByTestId('stat-connect-rate')` | 固定値 |
| `stat-avg-duration` | div（数値） | `3分12秒`（ラベル: `平均通話時間`） | `getByTestId('stat-avg-duration')` | 固定値 |
| `stat-pending` | div（数値） | `7`（ラベル: `未対応`） | `getByTestId('stat-pending')` | 固定値 |
| `call-table` | table | 見出し: `顧客名` / `電話番号` / `ステータス` / `最終架電日` / `操作` | `getByTestId('call-table')` | — |
| `call-list` | tbody | — | `getByTestId('call-list')` | 行の親要素 |
| `call-row` | tr（行） | — | `getByTestId('call-row')` | **初期 5 行**。`data-customer-id` 属性に 1〜5 を保持 |
| `call-customer-name` | td | 顧客名 | `getByTestId('call-customer-name')` | 行ごとに 1 個 |
| `call-phone` | td | 電話番号 | `getByTestId('call-phone')` | 行ごとに 1 個 |
| `call-status` | span（バッジ） | `未対応` / `対応中` / `完了` | `getByTestId('call-status')` | 行ごとに 1 個 |
| `call-last-called` | td | 最終架電日（`YYYY/MM/DD`） | `getByTestId('call-last-called')` | 行ごとに 1 個 |
| `call-start-button` | button | `発信` | `getByTestId('call-start-button')` / `getByRole('button', {name:'発信'})` | 行ごとに 1 個。**5 個あるので `.first()` / `.nth()` / 行スコープでの絞り込みが必須** |

### 初期データ（リロードで必ずこの状態に戻る）

| # | 顧客名 | 電話番号 | ステータス | 最終架電日 |
| --- | --- | --- | --- | --- |
| 1 | 株式会社アオイ商事 | 090-0000-0001 | 未対応 | 2026/04/01 |
| 2 | 有限会社ミドリ工業 | 090-0000-0002 | 対応中 | 2026/04/02 |
| 3 | カワセ電機株式会社 | 090-0000-0003 | 完了 | 2026/04/03 |
| 4 | 株式会社ハルカゼ物流 | 090-0000-0004 | 未対応 | 2026/04/04 |
| 5 | ソラマメ食品株式会社 | 090-0000-0005 | 対応中 | 2026/04/05 |

### 操作結果メッセージ

| 発生条件 | 表示文言 | 表示先 testid |
| --- | --- | --- |
| 行の「発信」をクリック | `<その行の顧客名> に発信しました`（例: `株式会社アオイ商事 に発信しました`） | `flash-message` |

> 顧客名と `に発信しました` の間には**半角スペースが 1 つ**入ります。

---

## 8. `/announce/` 情報共有ボード

- **URL**: `/announce/`（**要ログイン**）
- **`<title>`**: `情報共有ボード | Comdesk Practice`
- **`page-title`**: `情報共有ボード`
- **説明**: チーム連絡事項の投稿・編集・削除（CRUD）ができます。投稿モーダルは新規／編集で共用し、
  **モードによって確定ボタンが `投稿` と `送信` に切り替わります**。画面下部に「ボードへのフィードバック」
  フォーム（送信ボタン名は `送信する`）があり、`exact` オプションの教材として意図的に配置しています。
  一覧は **1ページ 5 件のページネーション**付き（初期 12 件 = 3 ページ）で、
  「2ページ目に何が表示されるか」といった観点のテスト題材にできます。

### 要素表（一覧エリア）

| data-testid | 要素種別 | 表示ラベル・ボタン名 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `page-title` | h1 | `情報共有ボード` | `getByTestId('page-title')` / `getByRole('heading', {name:'情報共有ボード'})` | — |
| `new-post-button` | button | `新規投稿` | `getByTestId('new-post-button')` / `getByRole('button', {name:'新規投稿'})` | クリックで投稿モーダルを新規モードで開く |
| `flash-area` | div | — | `getByTestId('flash-area')` | 共通仕様（§4） |
| `flash-message` | div | 操作結果メッセージ | `getByTestId('flash-message')` | `role="status"` |
| `post-list` | section（コンテナ） | — | `getByTestId('post-list')` | 投稿カードの親 |
| `post-item` | article（投稿カード） | — | `getByTestId('post-item')` | **1ページに最大 5 件**（初期データは全 12 件 = 3 ページ）。`data-post-id` 属性を保持。件数検証は `toHaveCount()` |
| `post-title` | h2（投稿タイトル） | 投稿のタイトル | `getByTestId('post-title')` | 投稿ごとに 1 個。`getByRole('heading')` でも取れるが件数が多いので testid 推奨 |
| `post-meta` | span | `<投稿者>・<作成日時>`（例: `田中 太郎・2026/04/01 10:15`） | `getByTestId('post-meta')` | 区切りは中黒 `・`。日時形式は `YYYY/MM/DD HH:mm` |
| `post-content` | p | 投稿本文 | `getByTestId('post-content')` | — |
| `post-edit-button` | button | `編集` | `getByTestId('post-edit-button')` | 投稿ごとに 1 個。**複数存在するため `.first()` 等が必須** |
| `post-delete-button` | button | `削除` | `getByTestId('post-delete-button')` | 投稿ごとに 1 個。クリックで削除確認モーダルを開く |
| `post-list-empty` | p（空状態） | `投稿はまだありません。` | `getByTestId('post-list-empty')` | **投稿が 0 件のときだけ** DOM に出現。0 件でないときは存在しない |
| `feedback-input` | textarea | `ご意見・ご要望` | `getByTestId('feedback-input')` / `getByLabel('ご意見・ご要望')` / `getByRole('textbox', {name:'ご意見・ご要望'})` | `id="feedback"`。カード見出しは `ボードへのフィードバック` |
| `feedback-send-button` | button | `送信する` | `getByTestId('feedback-send-button')` / `getByRole('button', {name:'送信する'})` | **空欄のままクリックしても何も起こらない**（エラーもフラッシュも出ない） |

### 要素表（ページネーション）

投稿一覧は **1ページ 5 件** で区切られます。初期データは 12 件なので **3 ページ** になります。

| data-testid | 要素種別 | 表示ラベル・ボタン名 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `pagination` | nav（コンテナ） | アクセシブル名 `ページ送り` | `getByTestId('pagination')` / `getByRole('navigation', {name:'ページ送り'})` | **投稿が 5 件以下のときは `hidden`**（全部削除して 5 件以下になると消える） |
| `page-prev-button` | button | `前へ` | `getByTestId('page-prev-button')` / `getByRole('button', {name:'前へ'})` | **1 ページ目では `disabled`**。検証は `toBeDisabled()` / `toBeEnabled()` |
| `page-next-button` | button | `次へ` | `getByTestId('page-next-button')` / `getByRole('button', {name:'次へ'})` | **最終ページでは `disabled`** |
| `page-numbers` | span（コンテナ） | — | `getByTestId('page-numbers')` | ページ番号ボタンの親 |
| `page-number-button` | button | `1` `2` `3` … | `getByTestId('page-number-button').nth(n)` | **ページ数だけ存在する**ので `.first()` `.nth()` 必須。`data-page` 属性にページ番号。**現在ページのみ `aria-current="page"`** |
| `page-indicator` | span | `全 12 件 / 1 ページ目（全 3 ページ）` | `getByTestId('page-indicator')` | 件数とページ位置。件数は増減するので完全一致検証に注意 |

現在ページの取得は `aria-current` が使えます。

```ts
// 現在ページのボタンだけを取る
await expect(page.getByTestId('page-number-button')
  .and(page.locator('[aria-current="page"]'))).toHaveText('2');

// もしくはロケーターを直接
await expect(page.locator('[data-testid="page-number-button"][aria-current="page"]'))
  .toHaveText('2');
```

### 要素表（投稿モーダル：新規／編集 共用）

| data-testid | 要素種別 | 表示ラベル・ボタン名 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `post-modal` | div（背景 + ダイアログ） | — | `getByTestId('post-modal')` | 初期状態は `hidden`。内側の `div[role="dialog"]` は `aria-modal="true"` |
| `modal-heading` | h2 | 新規時 `新規投稿` / 編集時 `投稿の編集` | `getByTestId('modal-heading')` | モードの判定に使える |
| `modal-close-button` | button（× アイコン） | アクセシブル名 `閉じる`（表示文字は `×`） | `getByTestId('modal-close-button')` | `aria-label="閉じる"`。**テキスト「閉じる」のボタンと名前が衝突する**（§14 参照） |
| `modal-title-input` | input[type=text] | `タイトル必須` | `getByTestId('modal-title-input')` / `getByLabel('タイトル')` / `getByRole('textbox', {name:'タイトル'})` | `id="postTitle"`。モーダルを開くと自動フォーカスされる |
| `modal-title-error` | p（エラー文） | `必須項目です` | `getByTestId('modal-title-error')` | 初期状態は `hidden` |
| `modal-content-input` | textarea | `本文必須` | `getByTestId('modal-content-input')` / `getByLabel('本文')` / `getByRole('textbox', {name:'本文'})` | `id="postContent"` |
| `modal-content-error` | p（エラー文） | `必須項目です` | `getByTestId('modal-content-error')` | 初期状態は `hidden` |
| `modal-cancel-button` | button | `閉じる` | `getByTestId('modal-cancel-button')` | モーダルを閉じるだけ（入力は破棄） |
| `modal-post-button` | button | `投稿` | `getByTestId('modal-post-button')` / `getByRole('button', {name:'投稿', exact:true})` | **新規モードのみ表示**（編集モードでは `hidden`） |
| `modal-send-button` | button | `送信` | `getByTestId('modal-send-button')` / `getByRole('button', {name:'送信', exact:true})` | **編集モードのみ表示**（新規モードでは `hidden`） |

### 要素表（削除確認モーダル）

| data-testid | 要素種別 | 表示ラベル・ボタン名 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `delete-modal` | div（背景 + ダイアログ） | 見出し `投稿の削除` | `getByTestId('delete-modal')` | 初期状態は `hidden` |
| `delete-modal-close-button` | button（× アイコン） | アクセシブル名 `閉じる` | `getByTestId('delete-modal-close-button')` | `aria-label="閉じる"` |
| `delete-modal-message` | p | `この投稿を削除します。よろしいですか？` | `getByTestId('delete-modal-message')` | — |
| `delete-cancel-button` | button | `キャンセル` | `getByTestId('delete-cancel-button')` / `getByRole('button', {name:'キャンセル'})` | 削除せずに閉じる |
| `delete-confirm-button` | button | `削除する` | `getByTestId('delete-confirm-button')` / `getByRole('button', {name:'削除する'})` | 削除を確定 |

### 初期データ（リロードで必ずこの状態に戻る）

全 12 件、**新しい順**に並んでいます。1ページ 5 件なので 3 ページになります。

| ページ | 表示順 | タイトル | 投稿者 | 作成日時 |
| --- | --- | --- | --- | --- |
| 1 | 1 | 検証環境メンテナンスのお知らせ | 佐藤 健 | 2026/04/05 09:00 |
| 1 | 2 | 定例MTGの時間変更について | 山田 花子 | 2026/04/03 18:42 |
| 1 | 3 | リリース手順書を更新しました | 田中 太郎 | 2026/04/01 10:15 |
| 1 | 4 | 在宅勤務申請フローの変更 | 鈴木 一郎 | 2026/03/30 14:20 |
| 1 | 5 | 新メンバー紹介（4月入社） | 高橋 美咲 | 2026/03/27 11:05 |
| 2 | 6 | キーワード検知ルールの見直し | 伊藤 大輔 | 2026/03/25 16:40 |
| 2 | 7 | 請求書提出期限のリマインド | 渡辺 結衣 | 2026/03/23 09:30 |
| 2 | 8 | 社内アンケートご協力のお願い | 中村 翔 | 2026/03/20 13:15 |
| 2 | 9 | セキュリティ研修の受講について | 小林 彩 | 2026/03/18 10:00 |
| 2 | 10 | 備品購入申請の窓口変更 | 加藤 誠 | 2026/03/16 15:50 |
| 3 | 11 | 年度末の勤怠締めについて | 吉田 香織 | 2026/03/13 17:25 |
| 3 | 12 | オフィス移転のスケジュール | 山本 隆 | 2026/03/10 08:45 |

- 新規投稿は**リストの先頭**に追加され、**表示は 1 ページ目に戻ります**。投稿者はログイン中ユーザーの表示名、
  作成日時は**実行時の現在時刻**（`YYYY/MM/DD HH:mm`）です。日時は固定値ではないので、
  完全一致で検証せず正規表現を使ってください。
- 編集はリスト内の位置を変えません。**ページも移動しません。**
- 削除して現在ページが空になった場合は、**1 つ前のページに自動的に戻ります**。

### エラーメッセージ一覧

| 発生条件 | 表示文言 | 表示先 testid |
| --- | --- | --- |
| タイトルが空（空白のみを含む）で `投稿` または `送信` をクリック | `必須項目です` | `modal-title-error` |
| 本文が空（空白のみを含む）で `投稿` または `送信` をクリック | `必須項目です` | `modal-content-error` |

バリデーションエラー時はモーダルが開いたままで、フラッシュメッセージは出ません。

### 操作結果メッセージ

| 発生条件 | 表示文言 | 表示先 testid |
| --- | --- | --- |
| 新規投稿が成功 | `投稿しました` | `flash-message` |
| 編集（`送信`）が成功 | `投稿を更新しました` | `flash-message` |
| 削除確認モーダルで `削除する` | `投稿を削除しました` | `flash-message` |
| フィードバックに入力して `送信する` | `フィードバックを送信しました` | `flash-message` |

### 画面遷移

ページ遷移は発生しません（すべて同一画面内の DOM 更新）。サイドバー／ヘッダーからの遷移のみです。

---

## 9. `/keyword-detect/` キーワード設定

- **URL**: `/keyword-detect/`（**要ログイン**）
- **`<title>`**: `キーワード設定 | Comdesk Practice`
- **`page-title`**: `キーワード設定`
- **説明**: 通話中に検知したいキーワードの一覧・追加・編集・削除ができます。
  モーダルは新規／編集で共用し、確定ボタンは新規時 `追加` / 編集時 `保存` に切り替わります。
  ページ上部のボタン名 `キーワード追加` とモーダル内の `追加` は、`exact` の教材として意図的に共存させています。

### 要素表（一覧エリア）

| data-testid | 要素種別 | 表示ラベル・ボタン名 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `page-title` | h1 | `キーワード設定` | `getByTestId('page-title')` / `getByRole('heading', {name:'キーワード設定'})` | — |
| `add-keyword-button` | button | `キーワード追加` | `getByTestId('add-keyword-button')` / `getByRole('button', {name:'キーワード追加'})` | クリックで新規モードのモーダルを開く |
| `flash-area` | div | — | `getByTestId('flash-area')` | 共通仕様（§4） |
| `flash-message` | div | 操作結果メッセージ | `getByTestId('flash-message')` | `role="status"` |
| `keyword-table` | table | 見出し: `キーワード` / `区分` / `通知先` / `状態` / `操作` | `getByTestId('keyword-table')` | — |
| `keyword-list` | tbody | — | `getByTestId('keyword-list')` | 行の親要素 |
| `keyword-row` | tr（行） | — | `getByTestId('keyword-row')` | **初期 3 行**。`data-keyword-id` 属性を保持 |
| `keyword-name` | td | キーワード名 | `getByTestId('keyword-name')` | 行ごとに 1 個 |
| `keyword-category` | td | `リスク` / `営業` / `品質` | `getByTestId('keyword-category')` | 行ごとに 1 個 |
| `keyword-notify` | td | 通知先 | `getByTestId('keyword-notify')` | 行ごとに 1 個。**未入力の場合は空文字**になる |
| `keyword-status` | span（バッジ） | `有効` / `無効` | `getByTestId('keyword-status')` | 行ごとに 1 個 |
| `keyword-edit-button` | button | `編集` | `getByTestId('keyword-edit-button')` | 行ごとに 1 個。**複数存在するため絞り込み必須** |
| `keyword-delete-button` | button | `削除` | `getByTestId('keyword-delete-button')` | 行ごとに 1 個。クリックで削除確認モーダルを開く |
| `keyword-list-empty` | td（空状態） | `キーワードはまだ登録されていません。` | `getByTestId('keyword-list-empty')` | **0 件のときだけ** DOM に出現（`colspan="5"` のセル） |

### 要素表（キーワードモーダル：新規／編集 共用）

| data-testid | 要素種別 | 表示ラベル・ボタン名 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `keyword-modal` | div（背景 + ダイアログ） | — | `getByTestId('keyword-modal')` | 初期状態は `hidden` |
| `keyword-modal-heading` | h2 | 新規時 `キーワード追加` / 編集時 `キーワード編集` | `getByTestId('keyword-modal-heading')` | **新規時は上部ボタンと同じ文字列**になるため `getByText('キーワード追加')` は 2 件ヒットする |
| `keyword-modal-close-button` | button（× アイコン） | アクセシブル名 `閉じる` | `getByTestId('keyword-modal-close-button')` | `aria-label="閉じる"` |
| `keyword-name-input` | input[type=text] | `キーワード必須` | `getByTestId('keyword-name-input')` / `getByLabel('キーワード')` / `getByRole('textbox', {name:'キーワード'})` | `id="keywordName"`。モーダルを開くと自動フォーカス |
| `keyword-name-error` | p（エラー文） | `必須項目です` | `getByTestId('keyword-name-error')` | 初期状態は `hidden` |
| `keyword-category-select` | select | `区分` | `getByTestId('keyword-category-select')` / `getByLabel('区分')` / `getByRole('combobox', {name:'区分'})` | 選択肢は `リスク` / `営業` / `品質`。新規時の既定値は `リスク` |
| `keyword-notify-input` | input[type=text] | `通知先` | `getByTestId('keyword-notify-input')` / `getByLabel('通知先')` / `getByRole('textbox', {name:'通知先'})` | 任意入力（必須ではない） |
| `keyword-enabled-checkbox` | input[type=checkbox] | `有効にする` | `getByTestId('keyword-enabled-checkbox')` / `getByLabel('有効にする')` / `getByRole('checkbox', {name:'有効にする'})` | **新規時の既定値は チェック済み（`true`）**。編集時は対象キーワードの状態を反映 |
| `keyword-cancel-button` | button | `閉じる` | `getByTestId('keyword-cancel-button')` | 閉じるだけ（入力は破棄） |
| `keyword-add-submit-button` | button | `追加` | `getByTestId('keyword-add-submit-button')` / `getByRole('button', {name:'追加', exact:true})` | **新規モードのみ表示** |
| `keyword-save-button` | button | `保存` | `getByTestId('keyword-save-button')` / `getByRole('button', {name:'保存'})` | **編集モードのみ表示** |

### 要素表（削除確認モーダル）

| data-testid | 要素種別 | 表示ラベル・ボタン名 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `keyword-delete-modal` | div（背景 + ダイアログ） | 見出し `キーワードの削除` | `getByTestId('keyword-delete-modal')` | 初期状態は `hidden` |
| `keyword-delete-modal-close-button` | button（× アイコン） | アクセシブル名 `閉じる` | `getByTestId('keyword-delete-modal-close-button')` | `aria-label="閉じる"` |
| `keyword-delete-modal-message` | p | `このキーワードを削除します。よろしいですか？` | `getByTestId('keyword-delete-modal-message')` | — |
| `keyword-delete-cancel-button` | button | `キャンセル` | `getByTestId('keyword-delete-cancel-button')` / `getByRole('button', {name:'キャンセル'})` | 削除せずに閉じる |
| `keyword-delete-confirm-button` | button | `削除する` | `getByTestId('keyword-delete-confirm-button')` / `getByRole('button', {name:'削除する'})` | 削除を確定 |

### 初期データ（リロードで必ずこの状態に戻る）

| # | キーワード | 区分 | 通知先 | 状態 |
| --- | --- | --- | --- | --- |
| 1 | 解約 | リスク | 管理者 | 有効 |
| 2 | クレーム | リスク | SV | 有効 |
| 3 | キャンペーン | 営業 | チーム全体 | 無効 |

新規追加された行は**リストの末尾**に追加されます（`push`）。

### エラーメッセージ一覧

| 発生条件 | 表示文言 | 表示先 testid |
| --- | --- | --- |
| キーワードが空（空白のみを含む）で `追加` または `保存` をクリック | `必須項目です` | `keyword-name-error` |

区分・通知先・有効フラグにはバリデーションがありません（通知先は空のまま登録できます）。

### 操作結果メッセージ

| 発生条件 | 表示文言 | 表示先 testid |
| --- | --- | --- |
| 新規追加が成功 | `キーワードを追加しました` | `flash-message` |
| 編集（`保存`）が成功 | `キーワードを更新しました` | `flash-message` |
| 削除確認モーダルで `削除する` | `キーワードを削除しました` | `flash-message` |

---

## 10. `/users/` ユーザー管理

- **URL**: `/users/`（**要ログイン**）
- **`<title>`**: `ユーザー管理 | Comdesk Practice`
- **`page-title`**: `ユーザー管理`
- **説明**: 登録済みユーザーの氏名・権限・状態・メモを編集できます。**編集のみ**で、追加・削除はありません。

### 要素表（一覧エリア）

| data-testid | 要素種別 | 表示ラベル・ボタン名 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `page-title` | h1 | `ユーザー管理` | `getByTestId('page-title')` / `getByRole('heading', {name:'ユーザー管理'})` | — |
| `flash-area` | div | — | `getByTestId('flash-area')` | 共通仕様（§4） |
| `flash-message` | div | 操作結果メッセージ | `getByTestId('flash-message')` | `role="status"` |
| `user-table` | table | 見出し: `ユーザーID` / `氏名` / `権限` / `状態` / `操作` | `getByTestId('user-table')` | — |
| `user-list` | tbody | — | `getByTestId('user-list')` | 行の親要素 |
| `user-row` | tr（行） | — | `getByTestId('user-row')` | **初期 6 行**。`data-user-id` 属性にメールアドレスを保持 |
| `user-id` | td | ユーザーID（メールアドレス） | `getByTestId('user-id')` | 行ごとに 1 個 |
| `user-name` | td | 氏名 | `getByTestId('user-name')` | 行ごとに 1 個。**入力欄 `user-name-input` と混同しないこと** |
| `user-role` | td | `管理者` / `一般` / `閲覧のみ` | `getByTestId('user-role')` | 行ごとに 1 個 |
| `user-status` | span（バッジ） | `有効` / `停止中` | `getByTestId('user-status')` | 行ごとに 1 個 |
| `user-edit-button` | button | `編集` | `getByTestId('user-edit-button')` | 行ごとに 1 個。**複数存在するため絞り込み必須** |

### 要素表（ユーザー編集モーダル）

| data-testid | 要素種別 | 表示ラベル・ボタン名 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `user-modal` | div（背景 + ダイアログ） | — | `getByTestId('user-modal')` | 初期状態は `hidden` |
| `user-modal-heading` | h2 | `ユーザー編集`（固定） | `getByTestId('user-modal-heading')` | 新規モードは存在しない |
| `user-modal-close-button` | button（× アイコン） | アクセシブル名 `閉じる` | `getByTestId('user-modal-close-button')` | `aria-label="閉じる"` |
| `user-name-input` | input[type=text] | `氏名必須` | `getByTestId('user-name-input')` / `getByLabel('氏名')` / `getByRole('textbox', {name:'氏名'})` | `id="userName"`。モーダルを開くと自動フォーカス |
| `user-name-error` | p（エラー文） | `必須項目です` | `getByTestId('user-name-error')` | 初期状態は `hidden` |
| `user-role-select` | select | `権限` | `getByTestId('user-role-select')` / `getByLabel('権限')` / `getByRole('combobox', {name:'権限'})` | 選択肢は `管理者` / `一般` / `閲覧のみ` |
| `user-memo-input` | textarea | `メモ` | `getByTestId('user-memo-input')` / `getByLabel('メモ')` / `getByRole('textbox', {name:'メモ'})` | 任意入力。初期値は空文字。**保存しても一覧には表示されない**（列が無い） |
| `user-status-select` | select | `状態` | `getByTestId('user-status-select')` / `getByLabel('状態')` / `getByRole('combobox', {name:'状態'})` | 選択肢は `有効` / `停止中` |
| `user-cancel-button` | button | `閉じる` | `getByTestId('user-cancel-button')` | 閉じるだけ（入力は破棄） |
| `user-save-button` | button | `保存` | `getByTestId('user-save-button')` / `getByRole('button', {name:'保存'})` | 保存を確定 |

> モーダルを開くと `select` が 2 個同時に表示されるため、`getByRole('combobox')` は 2 件ヒットします。
> 名前（`権限` / `状態`）を指定するか testid を使ってください。

### 初期データ（リロードで必ずこの状態に戻る）

| # | ユーザーID | 氏名 | 権限 | 状態 |
| --- | --- | --- | --- | --- |
| 1 | user001@widsley.com | 田中 太郎 | 管理者 | 有効 |
| 2 | user002@widsley.com | 山田 花子 | 一般 | 有効 |
| 3 | user003@widsley.com | 佐藤 健 | 一般 | 有効 |
| 4 | user004@widsley.com | 鈴木 一郎 | 管理者 | 停止中 |
| 5 | user005@widsley.com | 高橋 美咲 | 一般 | 有効 |
| 6 | user006@widsley.com | 伊藤 大輔 | 一般 | 停止中 |

> `user007` 〜 `user010` はログインできますが、**この一覧には表示されません**（一覧は 6 件固定）。

### エラーメッセージ一覧

| 発生条件 | 表示文言 | 表示先 testid |
| --- | --- | --- |
| 氏名が空（空白のみを含む）で `保存` をクリック | `必須項目です` | `user-name-error` |

### 操作結果メッセージ

| 発生条件 | 表示文言 | 表示先 testid |
| --- | --- | --- |
| 保存が成功 | `ユーザー情報を更新しました` | `flash-message` |

---

## 11. `/access/` アクセス管理

- **URL**: `/access/`（**要ログイン**）
- **`<title>`**: `アクセス管理 | Comdesk Practice`
- **`page-title`**: `アクセス管理`
- **説明**: 「通知設定」（5 つのトグル）と「パスワード変更」（3 項目のフォーム）の 2 カード構成です。
  パスワード変更は**フィールド単位のエラー**と**フォーム全体のエラー**の 2 段構えになっており、
  バリデーション網羅テストの主要題材です。

### 要素表（通知設定カード）

カード見出しは `通知設定`。各行にタイトル（label）と説明文が並びます。

| data-testid | 要素種別 | 表示ラベル | 推奨ロケーター | 初期値 |
| --- | --- | --- | --- | --- |
| `notif-assign` | input[type=checkbox] | `担当者アサイン時` | `getByTestId('notif-assign')` / `getByLabel('担当者アサイン時')` / `getByRole('checkbox', {name:'担当者アサイン時'})` | **ON** |
| `notif-mention` | input[type=checkbox] | `メンションされた時` | `getByTestId('notif-mention')` / `getByLabel('メンションされた時')` / `getByRole('checkbox', {name:'メンションされた時'})` | **ON** |
| `notif-keyword` | input[type=checkbox] | `キーワード検知時` | `getByTestId('notif-keyword')` / `getByLabel('キーワード検知時')` / `getByRole('checkbox', {name:'キーワード検知時'})` | OFF |
| `notif-report` | input[type=checkbox] | `日次レポート` | `getByTestId('notif-report')` / `getByLabel('日次レポート')` / `getByRole('checkbox', {name:'日次レポート'})` | OFF |
| `notif-login` | input[type=checkbox] | `新しい端末からのログイン` | `getByTestId('notif-login')` / `getByLabel('新しい端末からのログイン')` / `getByRole('checkbox', {name:'新しい端末からのログイン'})` | OFF |
| `notif-save-button` | button | `保存` | `getByTestId('notif-save-button')` / `getByRole('button', {name:'保存'})` | — |
| `notif-reset-button` | button | `リセット` | `getByTestId('notif-reset-button')` / `getByRole('button', {name:'リセット'})` | — |

各トグルの説明文（アクセシブル名には含まれません）:

| testid | 説明文 |
| --- | --- |
| `notif-assign` | 自分が対応担当に割り当てられたときに通知します。 |
| `notif-mention` | 情報共有ボードなどで自分がメンションされたときに通知します。 |
| `notif-keyword` | 通話中に登録キーワードを検知したときに通知します。 |
| `notif-report` | 前日の対応件数をまとめたレポートを毎朝送信します。 |
| `notif-login` | 未登録の端末でログインされたときに通知します。 |

- `保存` はフラッシュメッセージを出すだけで、状態は変わりません（値の永続化はしません）。
- `リセット` は 5 つすべてを上表の初期値へ戻します。

### 要素表（パスワード変更カード）

カード見出しは `パスワード変更`。

| data-testid | 要素種別 | 表示ラベル・ボタン名 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `pw-form-error-area` | div（コンテナ） | — | `getByTestId('pw-form-error-area')` | 常に DOM に存在する入れ物 |
| `pw-form-error` | p（アラート） | `パスワードを変更できませんでした。入力内容を確認してください。` | `getByTestId('pw-form-error')` | `role="alert"`。**初期状態は `hidden`**。HTML 上の初期テキストは `入力内容を確認してください` だが、表示される時点で上記文言に差し替わる |
| `pw-current-input` | input[type=password] | `現在のパスワード必須` | `getByTestId('pw-current-input')` / `getByLabel('現在のパスワード')` | `id="pwCurrent"` |
| `pw-current-error` | p（エラー文） | 下表参照 | `getByTestId('pw-current-error')` | 初期状態は `hidden` |
| `pw-new-input` | input[type=password] | `新しいパスワード必須` | `getByTestId('pw-new-input')` | `id="pwNew"`。**`getByLabel('新しいパスワード')` は確認欄にもヒットするため使用禁止** |
| `pw-new-error` | p（エラー文） | 下表参照 | `getByTestId('pw-new-error')` | 初期状態は `hidden` |
| `pw-confirm-input` | input[type=password] | `新しいパスワード（確認）必須` | `getByTestId('pw-confirm-input')` / `getByLabel('新しいパスワード（確認）')` | `id="pwConfirm"`。括弧は**全角**（`（確認）`） |
| `pw-confirm-error` | p（エラー文） | 下表参照 | `getByTestId('pw-confirm-error')` | 初期状態は `hidden` |
| `pw-submit-button` | button | `パスワードを変更` | `getByTestId('pw-submit-button')` / `getByRole('button', {name:'パスワードを変更'})` | `<form>` ではないため Enter キーでは送信されない |

### エラーメッセージ一覧（パスワード変更）

判定は「現在のパスワード → 新しいパスワード → 確認」の順で行われ、**該当するものはすべて同時に表示されます**。
1 つでもエラーがあれば `pw-form-error` も併せて表示されます。

| 発生条件 | 表示文言 | 表示先 testid |
| --- | --- | --- |
| 現在のパスワードが空 | `必須項目です` | `pw-current-error` |
| 現在のパスワードが `password` 以外 | `現在のパスワードが正しくありません` | `pw-current-error` |
| 新しいパスワードが空 | `必須項目です` | `pw-new-error` |
| 新しいパスワードが 8 文字未満 | `8文字以上で入力してください` | `pw-new-error` |
| 確認欄が空 | `必須項目です` | `pw-confirm-error` |
| 確認欄が新しいパスワードと不一致（新しいパスワードが入力されている場合のみ判定） | `新しいパスワードが一致しません` | `pw-confirm-error` |
| 上記いずれかが発生 | `パスワードを変更できませんでした。入力内容を確認してください。` | `pw-form-error` |

### 操作結果メッセージ

| 発生条件 | 表示文言 | 表示先 testid |
| --- | --- | --- |
| 通知設定の `保存` | `通知設定を保存しました` | `flash-message` |
| 通知設定の `リセット` | `通知設定をリセットしました` | `flash-message` |
| パスワード変更が成功（現在 = `password`、新しい = 8 文字以上、確認が一致） | `パスワードを変更しました` | `flash-message` |

成功時は 3 つの入力欄がすべて空にクリアされ、`pw-form-error` とフィールドエラーは非表示に戻ります。
**パスワードが実際に変更されるわけではありません**。次回ログインも `password` のままです。

---

## 12. `/profile/` プロフィール設定

- **URL**: `/profile/`（**要ログイン**）
- **`<title>`**: `プロフィール設定 | Comdesk Practice`
- **`page-title`**: `プロフィール設定`
- **説明**: ログイン中アカウントの情報表示と、表示名・電話番号の変更ができます。
  ヘッダーのプロフィールメニューからのみ遷移でき、**サイドバーにはリンクがありません**。

### 要素表

| data-testid | 要素種別 | 表示ラベル・値 | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `page-title` | h1 | `プロフィール設定` | `getByTestId('page-title')` / `getByRole('heading', {name:'プロフィール設定'})` | — |
| `flash-area` | div | — | `getByTestId('flash-area')` | 共通仕様（§4） |
| `flash-message` | div | `プロフィールを更新しました` | `getByTestId('flash-message')` | `role="status"` |
| `profile-info-table` | table | 行見出し: `ユーザーID` / `氏名` / `所属` | `getByTestId('profile-info-table')` | カード見出しは `アカウント情報` |
| `profile-userid` | td | ログイン中のユーザーID（例: `user001@widsley.com`） | `getByTestId('profile-userid')` | セッションの値をそのまま表示 |
| `profile-name` | td | ログイン中の表示名（例: `田中 太郎`） | `getByTestId('profile-name')` | `保存` を押すと入力値で書き換わる |
| `profile-department` | td | `SSI事業部`（固定） | `getByTestId('profile-department')` | — |
| `profile-name-input` | input[type=text] | `表示名` | `getByTestId('profile-name-input')` / `getByLabel('表示名')` / `getByRole('textbox', {name:'表示名'})` | 初期値はログイン中の表示名 |
| `profile-phone-input` | input[type=text] | `電話番号` | `getByTestId('profile-phone-input')` / `getByLabel('電話番号')` / `getByRole('textbox', {name:'電話番号'})` | **初期値は `090-0000-0000` 固定**（全ユーザー共通） |
| `profile-save-button` | button | `保存` | `getByTestId('profile-save-button')` / `getByRole('button', {name:'保存'})` | カード見出しは `プロフィールの編集` |

### 保存時の挙動（重要）

| 対象 | `保存` 後 |
| --- | --- |
| `profile-name`（アカウント情報の氏名） | 入力値に更新される |
| `flash-message` | `プロフィールを更新しました` が表示される |
| `header-user-name`（ヘッダーの表示名） | **更新されない**（セッションの値のまま） |
| `profile-phone-input` | 画面上は入力値のまま。どこにも反映・保存されない |
| リロード後 | すべて初期状態に戻る |

- 表示名は**空欄でも保存できます**（バリデーションなし）。エラーメッセージはこの画面にはありません。

---

## 13. `404.html` ページが見つかりません

- **URL**: `404.html`（存在しないパスへアクセスした際にサーバーが返す）。ログイン不要。
- **`<title>`**: `ページが見つかりません | Comdesk Practice`
- **説明**: カスタム 404 ページです。`assets/style.css` を読み込まず、必要なスタイルを HTML 内に直書き
  しています（深い階層の URL からも表示されるため）。ヘッダー・サイドバーはありません。

| data-testid | 要素種別 | 表示ラベル | 推奨ロケーター | 備考 |
| --- | --- | --- | --- | --- |
| `notfound-code` | div（テキスト） | `404` | `getByTestId('notfound-code')` | — |
| `notfound-message` | div（テキスト） | `ページが見つかりません` | `getByTestId('notfound-message')` | 見出し要素ではないので `getByRole('heading')` では取れない |
| `notfound-sub` | p | `お探しのページは存在しないか、移動された可能性があります。` | `getByTestId('notfound-sub')` | — |
| `notfound-home-link` | a（リンク） | `ログイン画面へ戻る` | `getByTestId('notfound-home-link')` / `getByRole('link', {name:'ログイン画面へ戻る'})` | `href="auth/"`（**相対パス**、§14 参照） |

### 画面遷移

| 条件 | 遷移先 |
| --- | --- |
| `ログイン画面へ戻る` をクリック | 現在の URL からの相対で `auth/`（サイトルート直下の 404 なら `/auth/`） |

- 存在しない URL にアクセスした場合、HTTP ステータスは **404** のまま URL は変わりません
  （例: `/announce/does-not-exist` にアクセスすると URL はそのままで 404 ページが描画される）。

---

## 14. 既知の注意点（テストを書く前に必ず読む）

実際にコードを読み、Playwright で挙動を確認して洗い出した「ハマりどころ」です。
**研修の演習・試験問題は、ここに書かれた性質を前提に作られています。**

### 14-1. `getByRole` の name は既定で「部分一致」— ボタン名の衝突

Playwright の `getByRole(role, { name })` は既定で **大文字小文字を区別しない部分一致**です。
本アプリには意図的に前方／後方が重なるボタン名を配置しています。

| 画面 | 衝突する組み合わせ | 起きること | 対処 |
| --- | --- | --- | --- |
| `/keyword-detect/` | ページ上部 `キーワード追加` と モーダル内 `追加` | モーダルを開いた状態で `getByRole('button', {name:'追加'})` が **2 件**ヒットして `strict mode violation` | `{ name: '追加', exact: true }` にする、または `getByTestId('keyword-add-submit-button')` |
| `/announce/` | ページ上部 `新規投稿` と モーダル内 `投稿` | モーダルを開いた状態で `getByRole('button', {name:'投稿'})` が **2 件**ヒット | `{ name: '投稿', exact: true }` または `getByTestId('modal-post-button')` |
| `/announce/` | モーダル内 `送信`（編集確定）と フィードバックの `送信する` | `getByRole('button', {name:'送信'})` は**モーダルが閉じていても** `送信する` に 1 件ヒットする。編集モーダルを開くと 2 件になる | `{ name: '送信', exact: true }` で `送信` のみ、`送信する` はそのまま指定 |
| 各モーダル | `aria-label="閉じる"` の × ボタン と テキスト `閉じる` のボタン | モーダルを開くと `getByRole('button', {name:'閉じる'})` が **2 件**ヒット。`exact: true` を付けても両方とも名前が完全に `閉じる` なので**解決しない** | testid で使い分ける（`modal-close-button` / `modal-cancel-button`、`keyword-modal-close-button` / `keyword-cancel-button`、`user-modal-close-button` / `user-cancel-button`） |
| 各所 | `削除` と `削除する` | 一覧の `削除` ボタンと確認モーダルの `削除する` | `exact: true` または testid |

> **`送信` / `送信する` は `exact` の教材として意図的に配置しています。** 仕様変更ではありません。

### 14-2. `<label>` 内の「必須」バッジでラベル文字列が変わる

必須項目のラベルは `<label>タイトル<span class="field__req">必須</span></label>` という構造です。
そのため要素のアクセシブル名／ラベル文字列は **`タイトル必須`**（スペースなし）になります。

```ts
await page.getByLabel('タイトル').fill('...');                  // OK（部分一致でヒット）
await page.getByLabel('タイトル', { exact: true }).fill('...');  // NG（0 件）
await page.getByLabel('タイトル必須', { exact: true }).fill(''); // OK（完全一致させたい場合）
```

該当するラベル（実際の文字列）:
`ユーザーIDまたはメールアドレス必須` / `パスワード必須` / `タイトル必須` / `本文必須` /
`キーワード必須` / `氏名必須` / `現在のパスワード必須` / `新しいパスワード必須` / `新しいパスワード（確認）必須`

### 14-3. `/access/` の「新しいパスワード」は `getByLabel` が 2 件ヒットする

`新しいパスワード` は `新しいパスワード（確認）` の部分文字列です。

| ロケーター | ヒット数 |
| --- | --- |
| `getByLabel('パスワード')` | **3 件**（現在 / 新しい / 確認） |
| `getByLabel('新しいパスワード')` | **2 件**（新しい / 確認） |
| `getByLabel('新しいパスワード（確認）')` | 1 件 |

→ **パスワード変更フォームは `getByTestId('pw-new-input')` / `getByTestId('pw-confirm-input')` を使ってください。**
括弧は全角 `（ ）` です。半角 `(確認)` では一致しません。

### 14-4. 隠れている要素は role / text ロケーターにヒットしない

モーダルは `hidden` 属性 + `[hidden]{display:none!important}` で消えています。
Playwright の role / text ロケーターはアクセシビリティツリー上に無い要素を無視するため、
**モーダルを開く前と後でヒット件数が変わります**。

| 状態 | `getByRole('button', {name:'閉じる'})` |
| --- | --- |
| モーダル閉（`/announce/` 表示直後） | 0 件 |
| 投稿モーダル開 | 2 件 |

一方 `getByTestId(...)` は隠れている要素にもヒットします。`toBeVisible()` / `toBeHidden()` で
表示状態を検証したい場合は testid を使ってください（`modal-post-button` / `modal-send-button` の
モード切替検証がこのパターンです）。

### 14-5. `input[type=password]` は `getByRole('textbox')` で取れる

Playwright のロール解決では `input[type=password]` も `textbox` として扱われます
（`/auth/` で `getByRole('textbox')` は 2 件 = ID とパスワード）。
ただし `/access/` では名前が部分一致で衝突するため（14-3）、testid の利用を推奨します。

### 14-6. `/access/` の通知トグルは「見えないチェックボックス」

見た目のスイッチは `<span class="switch__track">` で描画され、実体は `opacity: 0` の
`input[type=checkbox]` が同じ領域に重なっています。
Playwright は `opacity: 0` を「非表示」とは判定しないため、`click()` / `check()` / `isChecked()` は
そのまま動作します（スクリーンショットでは見えないだけです）。
`getByTestId('notif-assign').check()` のように直接操作してください。

### 14-7. 「〜しました」系メッセージは 1 枠を使い回す

`flash-message` は画面に**常に 1 件しか存在しません**。新しい操作をすると古いメッセージが置き換わります。
また**自動では消えません**。「削除 → 追加」のように連続操作すると、
`toHaveText()` が古いメッセージを拾う可能性があるため、期待文言で待つ書き方（web-first assertion）を使ってください。

```ts
await expect(page.getByTestId('flash-message')).toHaveText('投稿しました');
```

### 14-8. 空状態の要素は「0 件のときだけ」DOM に出現する

`post-list-empty` / `keyword-list-empty` は、リストが空になったときにだけ生成されます。
初期表示の時点では DOM に存在しないため、`toBeHidden()` ではなく `toHaveCount(0)` で検証してください。

### 14-9. 何も起きない操作がある

| 操作 | 結果 |
| --- | --- |
| `/announce/` でフィードバックを**空欄のまま** `送信する` | 何も起きない（フラッシュもエラーも出ない） |
| `/access/` で通知設定を `保存` | フラッシュが出るだけ。リロードすると初期値に戻る |
| `/access/` でパスワード変更が成功 | フラッシュが出て入力欄がクリアされるだけ。**パスワードは変わらない**（次回も `password`） |
| `/profile/` で `保存` | `profile-name` は変わるが `header-user-name` は変わらない。電話番号はどこにも反映されない |
| `/users/` でメモを保存 | 一覧にメモ列が無いため画面上は確認できない（再度モーダルを開けば保持されている） |

### 14-10. `/profile/` にはアクティブなナビが無い

`/profile/` では `aria-current="page"` を持つ要素が **0 件** です。
「現在のページがハイライトされている」ことを共通ヘルパーで検証していると、この画面だけ失敗します。

### 14-11. 見出しとボタンで同じ文字列が出る

`/keyword-detect/` で新規モーダルを開くと、ページ上部のボタン `キーワード追加` と
モーダル見出し `キーワード追加` が同時に存在し、`getByText('キーワード追加')` は 2 件ヒットします。
見出しの検証は `getByTestId('keyword-modal-heading')` を使ってください。

### 14-12. ログインの ID 判定は正規表現がやや緩い

実装上の判定は `^user(0[0-9][1-9]|010)@widsley\.com$` です。
仕様上のアカウントは `user001@widsley.com` 〜 `user010@widsley.com` の 10 件のみですが、
`user011@widsley.com` のような ID も**この正規表現は通してしまいます**。
その場合の表示名は `ゲスト ユーザー` になります（`user007`〜`user010` も `/users/` の一覧には出ません）。

→ **研修・試験では `user001` 〜 `user010` のみを使用してください。** それ以外の ID の挙動は仕様外です。
「無効な ID」のテストデータには `admin@widsley.com` や `user999@example.com` など、
明らかにパターンから外れる値を使ってください。

### 14-13. `404.html` の戻りリンクは相対パス

`notfound-home-link` の `href` は `auth/` です。サイトルート直下の 404（例: `/nope`）なら `/auth/` に
飛びますが、深い階層の 404（例: `/announce/nope`）では `/announce/auth/` を指してしまい正しく遷移しません。
404 ページのリンク遷移を検証する場合は、**ルート直下の存在しないパス**を使ってください。

### 14-14. `/` は常に `/auth/` へ飛ぶ

`page.goto('/')` はログイン済みでも `/auth/` に着地します。
「ログイン済みならダッシュボードに飛ぶ」という挙動はありません。

### 14-15. 日時が可変なのは投稿の作成日時だけ

新規投稿の `post-meta` は `<投稿者>・YYYY/MM/DD HH:mm`（実行時刻）です。
その他の日時（初期投稿の日時、`call-last-called`）はすべて固定文字列です。

```ts
await expect(page.getByTestId('post-meta').first())
  .toHaveText(/^田中 太郎・\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/);
```

---

## 15. testid 一覧（索引）

全 **141 個**（ユニーク）。掲載順は本文のセクション順です。

### 共通シェル（11）

`app-brand` / `profile-menu-button` / `header-user-name` / `profile-menu` / `menu-profile` / `menu-logout` /
`nav-call` / `nav-announce` / `nav-keyword-detect` / `nav-users` / `nav-access`

### 全ページ共通（3）

`page-title` / `flash-area` / `flash-message`

### `/`（2）

`redirect-message` / `redirect-link`

### `/auth/`（8）

`login-form` / `login-userid` / `login-userid-error` / `login-password` / `login-password-error` /
`login-submit` / `login-error-area` / `login-error`

### `/call/`（13）

`stat-row` / `stat-call-count` / `stat-connect-rate` / `stat-avg-duration` / `stat-pending` /
`call-table` / `call-list` / `call-row` / `call-customer-name` / `call-phone` / `call-status` /
`call-last-called` / `call-start-button`

### `/announce/`（32）

`new-post-button` / `post-list` / `post-list-empty` / `post-item` / `post-title` / `post-meta` /
`post-content` / `post-edit-button` / `post-delete-button` / `feedback-input` / `feedback-send-button` /
`pagination` / `page-prev-button` / `page-next-button` / `page-numbers` / `page-number-button` /
`page-indicator` /
`post-modal` / `modal-heading` / `modal-close-button` / `modal-title-input` / `modal-title-error` /
`modal-content-input` / `modal-content-error` / `modal-cancel-button` / `modal-post-button` /
`modal-send-button` / `delete-modal` / `delete-modal-close-button` / `delete-modal-message` /
`delete-cancel-button` / `delete-confirm-button`

### `/keyword-detect/`（27）

`add-keyword-button` / `keyword-table` / `keyword-list` / `keyword-list-empty` / `keyword-row` /
`keyword-name` / `keyword-category` / `keyword-notify` / `keyword-status` / `keyword-edit-button` /
`keyword-delete-button` / `keyword-modal` / `keyword-modal-heading` / `keyword-modal-close-button` /
`keyword-name-input` / `keyword-name-error` / `keyword-category-select` / `keyword-notify-input` /
`keyword-enabled-checkbox` / `keyword-cancel-button` / `keyword-add-submit-button` / `keyword-save-button` /
`keyword-delete-modal` / `keyword-delete-modal-close-button` / `keyword-delete-modal-message` /
`keyword-delete-cancel-button` / `keyword-delete-confirm-button`

### `/users/`（18）

`user-table` / `user-list` / `user-row` / `user-id` / `user-name` / `user-role` / `user-status` /
`user-edit-button` / `user-modal` / `user-modal-heading` / `user-modal-close-button` / `user-name-input` /
`user-name-error` / `user-role-select` / `user-memo-input` / `user-status-select` / `user-cancel-button` /
`user-save-button`

### `/access/`（16）

`notif-assign` / `notif-mention` / `notif-keyword` / `notif-report` / `notif-login` /
`notif-save-button` / `notif-reset-button` / `pw-form-error-area` / `pw-form-error` /
`pw-current-input` / `pw-current-error` / `pw-new-input` / `pw-new-error` / `pw-confirm-input` /
`pw-confirm-error` / `pw-submit-button`

### `/profile/`（7）

`profile-info-table` / `profile-userid` / `profile-name` / `profile-department` / `profile-name-input` /
`profile-phone-input` / `profile-save-button`

### `404.html`（4）

`notfound-code` / `notfound-message` / `notfound-sub` / `notfound-home-link`
