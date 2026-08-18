import { test, expect } from '@playwright/test';

const errs: string[] = [];

test.beforeEach(async ({ page }) => {
  page.on('pageerror', e => errs.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
});

async function login(page) {
  await page.goto('/auth/');
  await page.getByTestId('login-userid').fill('user001@widsley.com');
  await page.getByTestId('login-password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(/\/call\//);
}

test('ログイン: 正常系', async ({ page }) => { await login(page); });

test('ログイン: 空欄', async ({ page }) => {
  await page.goto('/auth/');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-userid-error')).toBeVisible();
  await expect(page.getByTestId('login-password-error')).toBeVisible();
});

test('ログイン: 誤パスワード', async ({ page }) => {
  await page.goto('/auth/');
  await page.getByTestId('login-userid').fill('user001@widsley.com');
  await page.getByTestId('login-password').fill('wrong');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('login-error')).toHaveText('ログインに失敗しました');
});

test('未ログインは auth へ戻る', async ({ page }) => {
  await page.goto('/announce/');
  await expect(page).toHaveURL(/\/auth\//);
});

test('情報共有ボード: 投稿/編集/削除', async ({ page }) => {
  await login(page);
  await page.getByTestId('nav-announce').click();
  await expect(page.getByTestId('page-title')).toHaveText('情報共有ボード');
  await expect(page.getByTestId('post-item')).toHaveCount(3);

  await page.getByTestId('new-post-button').click();
  await expect(page.getByTestId('modal-post-button')).toBeVisible();
  await expect(page.getByTestId('modal-send-button')).toBeHidden();
  await page.getByTestId('modal-title-input').fill('テスト投稿');
  await page.getByTestId('modal-content-input').fill('Playwrightで自動化検証中');
  await page.getByTestId('modal-post-button').click();
  await expect(page.getByTestId('post-item')).toHaveCount(4);
  await expect(page.getByTestId('post-title').first()).toHaveText('テスト投稿');

  await page.getByTestId('post-edit-button').first().click();
  await expect(page.getByTestId('modal-send-button')).toBeVisible();
  await expect(page.getByTestId('modal-post-button')).toBeHidden();
  await page.getByTestId('modal-title-input').fill('編集後タイトル');
  await page.getByTestId('modal-send-button').click();
  await expect(page.getByTestId('post-title').first()).toHaveText('編集後タイトル');

  await page.getByTestId('post-delete-button').first().click();
  await page.getByTestId('delete-confirm-button').click();
  await expect(page.getByTestId('post-item')).toHaveCount(3);

  await expect(page.getByRole('button', { name: '送信', exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '送信する' })).toBeVisible();
});

test('各ページが開く', async ({ page }) => {
  await login(page);
  for (const [nav, title] of [['keyword-detect','キーワード設定'],['users','ユーザー管理'],['access','アクセス管理']] as const) {
    await page.getByTestId('nav-' + nav).click();
    await expect(page.getByTestId('page-title')).toHaveText(title);
  }
  await page.getByTestId('profile-menu-button').click();
  await page.getByTestId('menu-profile').click();
  await expect(page.getByTestId('profile-userid')).toHaveText('user001@widsley.com');
});

test('キーワード追加', async ({ page }) => {
  await login(page);
  await page.getByTestId('nav-keyword-detect').click();
  const before = await page.getByTestId('keyword-row').count();
  await page.getByTestId('add-keyword-button').click();
  await page.getByTestId('keyword-name-input').fill('返金');
  await page.getByTestId('keyword-add-submit-button').click();
  await expect(page.getByTestId('keyword-row')).toHaveCount(before + 1);
});

test('パスワード変更バリデーション', async ({ page }) => {
  await login(page);
  await page.getByTestId('nav-access').click();
  await page.getByTestId('pw-current-input').fill('password');
  await page.getByTestId('pw-new-input').fill('newpassword1');
  await page.getByTestId('pw-confirm-input').fill('newpassword1');
  await page.getByTestId('pw-submit-button').click();
  await expect(page.getByTestId('flash-message')).toBeVisible();
});

test.afterAll(() => { if (errs.length) throw new Error('JSエラー:\n' + errs.join('\n')); });
