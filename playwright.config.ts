import { defineConfig, devices } from '@playwright/test';

/**
 * Comdesk Practice — 動作確認用スモークテストの設定
 * 研修受講者はこのファイルではなく、自分のプロジェクト側で
 * baseURL に公開URL（例: https://<org>.github.io/<repo>/）を設定してください。
 */
export default defineConfig({
  testDir: './smoke',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npx --yes http-server -p 4173 -c-1 --silent .',
    url: 'http://127.0.0.1:4173/auth/',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
