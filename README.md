# Comdesk Practice

QA エンジニア向け **Playwright 研修**と**社内認定試験**のための、練習専用の Web アプリです。

自社ステージング環境（Comdesk 本体）を教材にすると、機能改修のたびに画面や文言が変わり、
研修資料と試験問題が使えなくなってしまいます。そこで「**仕様を固定できる練習台**」として、
Comdesk の主要画面を模した独立の静的サイトを用意しました。

- **仕様は [SPEC.md](./SPEC.md) が正。** 見た目を変えても `data-testid` は変更しません
- **ビルド不要・依存パッケージ 0**。素の HTML / CSS / JavaScript のみ
- **バックエンドなし**。API 通信もアニメーションも人工的な遅延もありません（フレーキー対策）
- **データはリロードで必ず初期状態に戻る**ので、テストケースが互いに独立します

---

## ディレクトリ構成

```
practice-app/
├── index.html            ルート（/auth/ へリダイレクトするだけ）
├── 404.html              カスタム 404 ページ（style.css を読み込まない自己完結型）
├── favicon.svg
├── assets/
│   ├── style.css         全画面共通のスタイル
│   └── app.js            共通スクリプト（認証・ヘッダー・サイドバーの描画）
├── auth/index.html       ログイン
├── call/index.html       通常コールモード
├── announce/index.html   情報共有ボード
├── keyword-detect/index.html  キーワード設定
├── users/index.html      ユーザー管理
├── access/index.html     アクセス管理
├── profile/index.html    プロフィール設定
├── smoke/smoke.spec.ts   スモークテスト（動作確認用）
├── pw.config.ts          スモークテスト用 Playwright 設定
├── SPEC.md               画面仕様書（研修・試験の「正」）
└── README.md             このファイル
```

---

## ローカルでの起動方法

静的ファイルを配信するだけです。ビルドもインストールも不要です。
どちらか好きな方を使ってください。

```bash
# Node.js がある場合
npx http-server -p 4173 -c-1 .
```

```bash
# Python がある場合
python3 -m http.server 4173
```

起動したら <http://127.0.0.1:4173/auth/> を開きます。

- `-c-1` は http-server のキャッシュ無効化オプションです。付けておくと、
  HTML を編集した直後にリロードしても古い内容が表示されません。
- **`file://` で直接 HTML を開くのは不可です。** `assets/app.js` がスクリプト自身の URL から
  ベースパスを解決し、`sessionStorage` を使うため、必ず HTTP サーバー経由で開いてください。

### 研修用アカウント

| 項目 | 値 |
| --- | --- |
| ユーザーID | `user001@widsley.com` 〜 `user010@widsley.com` |
| パスワード | `password` |

ログインすると `/call/`（通常コールモード）に着地します。

---

## GitHub Pages での公開手順

1. このディレクトリの中身をリポジトリのルートに置いて push します（`main` ブランチ想定）。
2. GitHub のリポジトリページで **Settings → Pages** を開きます。
3. **Source** で **Deploy from a branch** を選択します。
4. **Branch** を **`main`** / **`/ (root)`** に設定して **Save**。
5. 数十秒〜数分で `https://<org>.github.io/<repo>/` に公開されます。

### サブパスでも動く理由

GitHub Pages はリポジトリ名のサブパス（`https://<org>.github.io/<repo>/`）で配信されます。
本アプリはこの環境でそのまま動くように作ってあります。

- **CSS / JS / favicon はすべて相対パス**で参照しています（`../assets/style.css` など）。
  ルート絶対パス（`/assets/...`）は使っていないので、どの階層に配置しても壊れません。
- **リンクとリダイレクト先は `app.js` が実行時に解決**します。`app.js` は自分自身の `script.src`
  （`.../assets/app.js`）からサイトのベースパスを逆算し、`App.url('call/')` のように組み立てます。

  ```js
  // assets/app.js より
  var BASE = scriptEl.src.replace(/assets\/app\.js.*$/, '');
  function url(path) { return BASE + String(path).replace(/^\//, ''); }
  ```

  そのため `https://example.github.io/practice-app/` でも `http://127.0.0.1:4173/` でも、
  ログイン後の遷移やサイドバーのリンクが正しいパスになります。
- **ビルド設定は不要です。** Jekyll の処理が走っても問題ありませんが、気になる場合は
  空の `.nojekyll` ファイルをルートに置いてください（アンダースコア始まりのファイルは無いため必須ではありません）。

### `404.html` について

GitHub Pages は、存在しないパスへのアクセスに対してリポジトリルートの **`404.html` を自動的に返します**。
本アプリの `404.html` は、深い階層（`/announce/xxx` など）から表示されても崩れないように、
`assets/style.css` を読み込まず必要なスタイルを HTML 内に直書きしてあります。

> 注意: `404.html` 内の「ログイン画面へ戻る」リンクは相対パス `auth/` です。
> ルート直下以外の 404 から押すと正しい場所に飛びません（[SPEC.md §14-13](./SPEC.md#14-13-404html-の戻りリンクは相対パス)）。

---

## Vercel での公開手順

1. Vercel のダッシュボードで **Add New… → Project** からリポジトリをインポートします。
2. **Framework Preset** は **Other**（フレームワークなし）を選択します。
3. **Build Command**: 空のまま（ビルド不要）
4. **Output Directory**: **ルート**（`.` のまま。何も指定しない）
5. **Install Command**: 空のまま
6. **Deploy** を押すだけです。

Vercel は独自ドメイン／プロジェクトドメインのルート（`https://<project>.vercel.app/`）で配信するため、
サブパスの考慮は不要です。`404.html` もカスタム 404 として自動的に使われます。

---

## Playwright からの使い方

`playwright.config.ts` に `baseURL` を設定しておくと、テスト側は
`page.goto('/auth/')` のようにパスだけを書けます。公開先（ローカル / GitHub Pages / Vercel）を
切り替えるときは `baseURL` の 1 行だけ直せば済みます。

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    // ローカル: 'http://127.0.0.1:4173'
    // GitHub Pages: 'https://<org>.github.io/<repo>/'
    // Vercel:       'https://<project>.vercel.app'
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // ローカル実行時にサーバーを自動起動したい場合（任意）
  webServer: {
    command: 'npx --yes http-server -p 4173 -c-1 --silent .',
    url: 'http://127.0.0.1:4173/auth/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
```

テスト側はこう書きます。

```ts
// tests/login.spec.ts
import { test, expect } from '@playwright/test';

test('ログインすると通常コールモードに遷移する', async ({ page }) => {
  await page.goto('/auth/');                              // 末尾スラッシュを付ける
  await page.getByTestId('login-userid').fill('user001@widsley.com');
  await page.getByTestId('login-password').fill('password');
  await page.getByTestId('login-submit').click();

  await expect(page).toHaveURL(/\/call\//);
  await expect(page.getByTestId('page-title')).toHaveText('通常コールモード');
  await expect(page.getByTestId('header-user-name')).toHaveText('田中 太郎');
});
```

### 末尾スラッシュは必須です

**`page.goto('/auth')` ではなく `page.goto('/auth/')` と書いてください。**

各画面の実体は `auth/index.html` のようなディレクトリ内の `index.html` です。
GitHub Pages（および多くの静的ホスティング）は、末尾スラッシュ付きの URL に対して
ディレクトリの index を返す一方、スラッシュ無しの URL では 301 リダイレクトが挟まったり、
環境によっては 404 になったりします。`baseURL` に相対パスを結合する際も、
末尾スラッシュの有無で解決結果が変わります。

| 書き方 | 結果 |
| --- | --- |
| `page.goto('/auth/')` | ◎ どの環境でも安定 |
| `page.goto('/auth')` | △ リダイレクトが挟まる、または 404 |
| `page.goto('auth/')` | △ `baseURL` の末尾スラッシュ有無に依存する |

`toHaveURL()` で検証するときも、リダイレクト後の URL に末尾スラッシュが付く前提で
正規表現（`/\/call\//`）を使うのが安全です。

### ログイン処理の使い回し

セッションは `sessionStorage` に保存されます。`storageState` を使う場合は
`origins[].sessionStorage` を保存する形になるため、研修の序盤ではシンプルに
ヘルパー関数でログインする方法を推奨します（`smoke/smoke.spec.ts` の `login()` が実例です）。

---

## 画面一覧

各画面の要素・`data-testid`・エラー文言の詳細は **[SPEC.md](./SPEC.md)** を参照してください。

| パス | 画面名 | ログイン要否 | 仕様書 |
| --- | --- | --- | --- |
| `/` | ルート（`/auth/` へリダイレクト） | 不要 | [§5](./SPEC.md#5--ルートリダイレクト専用) |
| `/auth/` | ログイン | 不要 | [§6](./SPEC.md#6-auth-ログイン) |
| `/call/` | 通常コールモード | 必要 | [§7](./SPEC.md#7-call-通常コールモード) |
| `/announce/` | 情報共有ボード | 必要 | [§8](./SPEC.md#8-announce-情報共有ボード) |
| `/keyword-detect/` | キーワード設定 | 必要 | [§9](./SPEC.md#9-keyword-detect-キーワード設定) |
| `/users/` | ユーザー管理 | 必要 | [§10](./SPEC.md#10-users-ユーザー管理) |
| `/access/` | アクセス管理 | 必要 | [§11](./SPEC.md#11-access-アクセス管理) |
| `/profile/` | プロフィール設定 | 必要 | [§12](./SPEC.md#12-profile-プロフィール設定) |
| `404.html` | ページが見つかりません | 不要 | [§13](./SPEC.md#13-404html-ページが見つかりません) |

共通のヘッダー／サイドバー（`profile-menu-button`、`nav-*` など）は
[SPEC.md §3](./SPEC.md#3-共通シェルヘッダー--サイドバー) にまとまっています。

テストを書き始める前に、[SPEC.md §14 既知の注意点](./SPEC.md#14-既知の注意点テストを書く前に必ず読む) に
必ず目を通してください。ボタン名の衝突やラベルの部分一致など、意図的に仕込んだ「ハマりどころ」を
すべて列挙してあります。

---

## 動作確認

`smoke/smoke.spec.ts` に、アプリが壊れていないことを確認するスモークテストがあります。
改修したら必ず実行してください。カバーしているのは以下です。

| テスト名 | 内容 |
| --- | --- |
| ログイン: 正常系 | `user001` でログインして `/call/` に着地する |
| ログイン: 空欄 | ID / パスワード両方の必須エラーが出る |
| ログイン: 誤パスワード | `ログインに失敗しました` が出る |
| 未ログインは auth へ戻る | `/announce/` を直接開くと `/auth/` にリダイレクトされる |
| 情報共有ボード: 投稿/編集/削除 | CRUD 一通り + `送信` / `送信する` の `exact` 検証 |
| 各ページが開く | サイドバー遷移とプロフィールメニュー遷移 |
| キーワード追加 | 行数が 1 増える |
| パスワード変更バリデーション | 正常系でフラッシュが出る |

またテスト全体を通して `pageerror` と `console.error` を収集し、
1 件でもあれば `afterAll` で失敗させています（JavaScript エラーの検知）。

### 実行方法

```bash
# 初回のみ
npm install
npx playwright install chromium

# 実行（webServer 設定により http-server が自動で起動します）
npx playwright test --config=pw.config.ts
```

`pw.config.ts` は `smoke/` を `testDir` に、`http://127.0.0.1:4173` を `baseURL` にしています。
`webServer` でポート 4173 の http-server を自動起動するため、サーバーを手動で立てる必要はありません。

> `pw.config.ts` の `launchOptions.executablePath` は、ブラウザを共有配置している
> 社内コンテナ環境向けの指定です。手元の PC で実行する場合はこの行を削除し、
> `npx playwright install chromium` で入るブラウザを使ってください。

公開先（GitHub Pages / Vercel）に対してスモークテストを流したい場合は、
`baseURL` を公開 URL に変更し、`webServer` の設定を外して実行します。

---

## 改修時のルール

このアプリは研修資料と試験問題から参照されています。以下を必ず守ってください。

1. **`data-testid` は変更しない。** リネーム・削除は禁止です。過去の研修資料・受験者の提出物・
   模範解答がすべて壊れます。要素そのものを作り直す場合も、同じ `data-testid` を引き継いでください。
2. **`data-testid` の追加は OK。** 新しい要素を足すときは必ず `data-testid` を付け、
   SPEC.md の要素表と §15 の索引に追記してください。
3. **表示文言（ラベル・ボタン名・エラーメッセージ）を変えるときは、SPEC.md も同じコミットで更新する。**
   文言は `getByRole` / `getByLabel` / `toHaveText` から参照されており、SPEC.md がその「正」です。
   片方だけ変えると研修中に必ず事故ります。
4. **見た目（CSS）の変更は自由。** `assets/style.css` の色・余白・レイアウトは変えて構いませんが、
   要素を `display:none` にするなど**表示状態を変える変更は仕様変更**にあたるため SPEC.md を更新してください。
5. **初期データを変えない。** 架電リスト 5 件 / 投稿 3 件 / キーワード 3 件 / ユーザー 6 件 /
   通知トグルの初期 ON・OFF は、`toHaveCount()` などで直接検証されています。
6. **アニメーション・遅延・API 通信を入れない。** フレーキーテストの原因になります。
   データはメモリ保持のままにし、`localStorage` などへ永続化しないでください
   （テストの独立性が崩れます）。
7. **改修後は必ずスモークテストを実行する。**（[動作確認](#動作確認)）

意図的に残している「テストのハマりどころ」（`送信` と `送信する`、`追加` と `キーワード追加`、
`閉じる` の重複、ラベル内の「必須」バッジなど）は**バグではなく教材です**。
善意で修正しないでください。詳細は [SPEC.md §14](./SPEC.md#14-既知の注意点テストを書く前に必ず読む) にあります。
