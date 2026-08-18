/* ============================================================
   Comdesk Practice — 研修専用練習アプリ 共通スクリプト
   ------------------------------------------------------------
   設計方針（研修/試験で仕様を固定するため）
   - 全ての操作対象に data-testid を付与する（SPEC.md が正）
   - 見た目が変わっても data-testid は変えない
   - 状態はセッションのみ sessionStorage、業務データはメモリ保持
     （リロードで初期状態に戻る = テストが互いに独立する）
   - アニメーション・遅延は入れない（フレーキーテスト防止）
   ============================================================ */

(function () {
  'use strict';

  /* ---------- ベースパス解決（GitHub Pages のサブパス対応） ---------- */

  var scriptEl = document.currentScript ||
    (function () {
      var s = document.getElementsByTagName('script');
      return s[s.length - 1];
    })();

  // .../assets/app.js -> .../
  var BASE = scriptEl.src.replace(/assets\/app\.js.*$/, '');

  function url(path) {
    return BASE + String(path).replace(/^\//, '');
  }

  /* ---------- 認証 ---------- */

  var VALID_PASSWORD = 'password';
  var USER_PATTERN = /^user(00[1-9]|010)@widsley\.com$/; // user001〜user010 のみ

  var DISPLAY_NAMES = {
    'user001@widsley.com': '田中 太郎',
    'user002@widsley.com': '山田 花子',
    'user003@widsley.com': '佐藤 健',
    'user004@widsley.com': '鈴木 一郎',
    'user005@widsley.com': '高橋 美咲',
    'user006@widsley.com': '伊藤 大輔',
    'user007@widsley.com': '渡辺 結衣',
    'user008@widsley.com': '中村 翔',
    'user009@widsley.com': '小林 彩',
    'user010@widsley.com': '加藤 直樹'
  };

  var SESSION_KEY = 'comdesk-practice-session';

  function isValidUser(userId) {
    return USER_PATTERN.test(String(userId).trim().toLowerCase());
  }

  function login(userId, password) {
    var id = String(userId).trim().toLowerCase();
    if (!isValidUser(id) || password !== VALID_PASSWORD) return null;
    var session = { userId: id, name: DISPLAY_NAMES[id] || 'ゲスト ユーザー' };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch (e) {}
    return session;
  }

  function getSession() {
    try {
      var raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function logout() {
    try { sessionStorage.removeItem(SESSION_KEY); } catch (e) {}
    location.href = url('auth/');
  }

  /** 未ログインなら /auth/ へ飛ばす。ログイン済みならセッションを返す。 */
  function requireLogin() {
    var s = getSession();
    if (!s) { location.replace(url('auth/')); return null; }
    return s;
  }

  /* ---------- アプリシェル（ヘッダー＋サイドバー）描画 ---------- */

  var NAV = [
    { key: 'call',           href: 'call/',           label: '通常コールモード' },
    { key: 'announce',       href: 'announce/',       label: '情報共有ボード' },
    { key: 'keyword-detect', href: 'keyword-detect/', label: 'キーワード設定' },
    { key: 'users',          href: 'users/',          label: 'ユーザー管理' },
    { key: 'access',         href: 'access/',         label: 'アクセス管理' }
  ];

  function initials(name) {
    return String(name || '').trim().charAt(0) || 'U';
  }

  function renderShell(activeKey, session) {
    var header = document.querySelector('[data-shell="header"]');
    var sidebar = document.querySelector('[data-shell="sidebar"]');

    if (header) {
      header.className = 'app-header';
      header.innerHTML =
        '<span class="app-header__brand" data-testid="app-brand">' +
          '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">' +
            '<rect x="1" y="3" width="16" height="12" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
            '<path d="M5 7.5h8M5 10.5h5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
          '</svg>' +
          'Comdesk Practice' +
        '</span>' +
        '<span class="app-header__spacer"></span>' +
        '<button type="button" class="app-header__user" data-testid="profile-menu-button" ' +
          'aria-haspopup="true" aria-expanded="false" aria-controls="profile-menu">' +
          '<span class="avatar" aria-hidden="true">' + initials(session.name) + '</span>' +
          '<span data-testid="header-user-name">' + session.name + '</span>' +
        '</button>' +
        '<ul class="menu" id="profile-menu" data-testid="profile-menu" hidden>' +
          '<li><a href="' + url('profile/') + '" data-testid="menu-profile">プロフィール</a></li>' +
          '<li><a href="#" data-testid="menu-logout">ログアウト</a></li>' +
        '</ul>';

      var btn = header.querySelector('[data-testid="profile-menu-button"]');
      var menu = header.querySelector('[data-testid="profile-menu"]');
      btn.addEventListener('click', function () {
        var open = menu.hidden;
        menu.hidden = !open;
        btn.setAttribute('aria-expanded', String(open));
      });
      header.querySelector('[data-testid="menu-logout"]').addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });
    }

    if (sidebar) {
      sidebar.className = 'sidebar';
      var links = NAV.map(function (item) {
        var cur = item.key === activeKey ? ' aria-current="page"' : '';
        return '<a href="' + url(item.href) + '" data-testid="nav-' + item.key + '"' + cur + '>' +
               item.label + '</a>';
      }).join('');
      sidebar.innerHTML =
        '<p class="sidebar__label">MENU</p>' +
        '<nav class="sidebar__nav" aria-label="メインメニュー">' + links + '</nav>';
    }
  }

  /** ログイン必須ページの標準初期化。戻り値はセッション（未ログインなら null）。 */
  function initPage(activeKey) {
    var session = requireLogin();
    if (!session) return null;
    renderShell(activeKey, session);
    return session;
  }

  /* ---------- 小さなヘルパー ---------- */

  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /** YYYY/MM/DD HH:mm 固定フォーマット */
  function formatDateTime(d) {
    function p(n) { return n < 10 ? '0' + n : String(n); }
    return d.getFullYear() + '/' + p(d.getMonth() + 1) + '/' + p(d.getDate()) +
           ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  window.App = {
    BASE: BASE,
    url: url,
    login: login,
    logout: logout,
    getSession: getSession,
    requireLogin: requireLogin,
    isValidUser: isValidUser,
    initPage: initPage,
    renderShell: renderShell,
    esc: esc,
    formatDateTime: formatDateTime,
    VALID_PASSWORD: VALID_PASSWORD,
    DISPLAY_NAMES: DISPLAY_NAMES
  };
})();
