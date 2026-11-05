// ==UserScript==
// @name         SubSensei
// @name:zh-CN   字幕老师
// @name:zh-TW   字幕老師
// @name:zh-HK   字幕老師
// @namespace    https://github.com/neo2codes/subsensei
// @version      1.0.3
// @description  SubSensei -- automatic subtitle loading in 14 languages, appearance and picture controls, hotkeys, and a draggable panel for MissAV, Jable, fs1.app and AV01.
// @description:zh-CN 字幕老师 —— 为 MissAV、Jable、fs1.app 与 AV01 提供 14 种语言字幕自动加载、字幕样式调节、画面调节、快捷键控制与可拖拽面板，兼容 Safari Userscripts 与 Tampermonkey。
// @description:zh-TW 字幕老師 —— 為 MissAV、Jable、fs1.app 與 AV01 提供 14 種語言字幕自動載入、字幕樣式調節、畫面調節、快捷鍵控制與可拖曳面板，相容 Safari Userscripts 與 Tampermonkey。
// @author       neo2codes
// @match        *://missav123.com/*
// @match        *://missav.ws/*
// @match        *://missav.ai/*
// @match        *://missav.com/*
// @match        *://missav.live/*
// @match        *://jable.tv/*
// @match        *://www.jable.tv/*
// @match        *://fs1.app/*
// @match        *://www.fs1.app/*
// @match        *://av01.media/*
// @match        *://www.av01.media/*
// @match        *://av01.tv/*
// @match        *://www.av01.tv/*
// @noframes
// @grant        GM.xmlHttpRequest
// @grant        GM.openInTab
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_info
// @connect      api-shoulei-ssl.xunlei.com
// @connect      geilijiasu.com
// @connect      v.geilijiasu.com
// @connect      subtitle.v.geilijiasu.com
// @updateURL    https://raw.githubusercontent.com/neo2codes/subsensei/main/dist/subsensei.user.js
// @downloadURL  https://raw.githubusercontent.com/neo2codes/subsensei/main/dist/subsensei.user.js
// @supportURL   https://github.com/neo2codes/subsensei/issues
// @homepageURL  https://github.com/neo2codes/subsensei
// @license      MIT
// @run-at       document-end
// @connect      vshvhdducfsxo8o.m0tw.pocketbasecloud.com
// @connect      *.pocketbasecloud.com

// ==/UserScript==

/* v1.0.3  |  完整版本記錄：https://github.com/neo2codes/subsensei/blob/main/CHANGELOG.md */

(function () {

    // ===== v1.5.59: 站點判斷（必須最先定義，其他 const 會用到）=====
    const HOST = location.hostname;
    // jable 家族（jable.tv + fs1.app 鏡像，結構相同）
    const IS_JABLE = HOST.indexOf('jable.tv') >= 0 || HOST.indexOf('fs1.app') >= 0;
    // AV01 家族（av01.media + av01.tv，結構相同）
    const IS_AV01 = HOST.indexOf('av01.') >= 0;

    // v1.5.63: 版本號（優先讀 Tampermonkey 的 @version，fallback 硬編碼）
    //   顯示在面板頂部，方便用戶回報時講清楚用邊個版本。
    //   ⚠️ 發新版本時記得同步改下面的 fallback 字串。
    const APP_VERSION = (function () {
        try {
            if (typeof GM_info !== 'undefined' && GM_info.script) {
                return GM_info.script.version || '1.0.3';
            }
            if (typeof GM !== 'undefined' && GM.info && GM.info.script) {
                return GM.info.script.version || '1.0.3';
            }
        } catch (e) {}
        return '1.0.3';
    })();

    'use strict';

    const PLAYER_STATE_EVENT = 'missav-player-state';
    const PLAYER_STATE_ATTR = 'data-missav-player-state';
    const PLAYER_BRIDGE_ID = 'missav-player-bridge';
    const FLOATING_BUTTON_POSITION_KEY = 'missavFloatingButtonPosition';
    const FLOATING_UI_GAP = 8;
    const VIDEO_QUERY_SELECTORS = [
        'video#player',
        '.plyr video',
        '.video-js video',
        '.jwplayer video',
        'video'
    ];
    const VIDEO_CONTAINER_SELECTORS = [
        '.plyr__video-wrapper',
        '.player-container',
        '#player-container',
        '.video-js',
        '.jwplayer',
        '.jw-wrapper',
        '.video-img-box',
        '.video-player',
        // v1.5.61: AV01 播放器容器（實測：video 的祖父有 aspect-video + bg-gray-900）
        '.aspect-video.bg-gray-900',
        '[class*="aspect-video"][class*="overflow-hidden"]'
    ];
    const VIDEO_ANCESTOR_SELECTORS = [
        ...VIDEO_CONTAINER_SELECTORS,
        '.plyr',
        '.player',
        '[class*="video-player"]',
        '[class*="player"]'
    ];

    // --- PocketBase Config ---
    const PB_URL = 'https://vshvhdducfsxo8o.m0tw.pocketbasecloud.com';
    // v1.5.40: 付款累計 + 補領（已由 Cloudflare Worker 搬入 PB hooks: bmc_webhook.pb.js）
    const BMC_CLAIM_URL = `${PB_URL}/api/founder-claim`;
    const PB_SUBTITLES_COLLECTION = 'subtitles';
    const PB_USERS_COLLECTION = 'users';
    const FETCH_LIMITS = {
        free: 3,
        member: 100
    };
    // --- Store config (v1.5.40: 改為 Buy Me a Coffee) ---
    const BMC_URL = 'https://buymeacoffee.com/neo2codes';
    // 4 個方案。1-3 暫時劃線（beta 期間唔賣，用嚟顯示「而家唔買會加價」），
    // 4 = Founder LTD 是 beta 期間唯一可買的方案。
    // v1.5.51: 改成函數延遲計算 —— t() 在 UI_STRINGS 定義之後才可用，
    // 之前直接用 const PLANS = [{label: t('...')}] 會在模組載入時拋
    // ReferenceError: Cannot access 't' before initialization，整個 IIFE 崩潰。
    function getPlans() {
        return [
            { id: 'monthly',  label: t('plan.monthly'), price: t('plan.monthlyPrice'), variant: 'monthly',  enabled: false },
            { id: 'yearly',   label: t('plan.yearly'),  price: t('plan.yearlyPrice'),  variant: 'yearly',   enabled: false },
            { id: 'lifetime', label: t('plan.lifetime'), price: 'USD$70',              variant: 'lifetime', enabled: false },
            { id: 'founder',  label: t('plan.founder'),  price: 'USD$30 LTD',          variant: 'founder',  enabled: true }
        ];
    }
    const LS_CHECKOUT = {
        monthly:  BMC_URL,
        yearly:   BMC_URL,
        lifetime: BMC_URL,
        founder:  BMC_URL
    };
    /** Build the checkout URL.
     *  v1.5.40: 改用 Buy Me a Coffee。BMC 唔支援 custom_data，
     *  靠 webhook 用 email 比對（worker 已實作累計金額 + 自動開通）。
     *
     *  ⚠️ 絕對唔可以加 ?email= —— 實測 BMC 付款彈窗會永遠卡在 loading，
     *  用戶根本上唔到付款頁。所以 URL 保持純淨，電郵靠用戶自己填。
     */
    function buildCheckoutUrl(variant) {
        const base = LS_CHECKOUT[variant];
        if (!base) return null;
        return base;
    }
    /** Returns true if the logged-in user currently has a valid (non-expired) membership. */
    function isMemberActive() {
        if (pbUserPlan === 'paid') return true;
        if (pbUserPlan === 'member') {
            // If paid_until exists and is in the future → valid. Otherwise expired.
            const untilStr = (pbUser && pbUser.paid_until) || '';
            if (!untilStr) return true; // no expiry recorded → treat as valid member
            const until = new Date(untilStr);
            if (isNaN(until.getTime())) return true;
            return until.getTime() > Date.now();
        }
        return false;
    }
    /** Effective daily fetch quota: member(active)=100, else free=3. */
    function currentQuotaLimit() {
        return isMemberActive() ? FETCH_LIMITS.member : FETCH_LIMITS.free;
    }
    /** Best plan label for display. */
    function effectivePlanLabel() {
        if (pbUserPlan === 'paid') return t('plan.paid');
        if (pbUserPlan === 'member') return isMemberActive() ? t('plan.member') : t('plan.memberExpired');
        return t('plan.free');
    }
    // v1.5.49: 擴展到 12 種語言（對應 PB subtitles.language 的值）
    // 順序：常用度 + 使用者分佈（繁中/粵語最大，其次英文，然後亞洲，最後歐洲）
    const LANGUAGE_OPTIONS = [
        { value: 'cantonese',           label: '廣東話',            flag: '🇭🇰' },
        { value: 'traditional-chinese', label: '繁體中文',          flag: '🇹🇼' },
        { value: 'simplified-chinese',  label: '简体中文',          flag: '🇨🇳' },
        { value: 'english',             label: 'English',           flag: '🇬🇧' },
        { value: 'korean',              label: '한국어',            flag: '🇰🇷' },
        { value: 'malay',               label: 'Melayu',            flag: '🇲🇾' },
        { value: 'thai',                label: 'ไทย',               flag: '🇹🇭' },
        { value: 'vietnamese',          label: 'Tiếng Việt',        flag: '🇻🇳' },
        { value: 'indonesian',          label: 'Bahasa Indonesia',  flag: '🇮🇩' },
        { value: 'filipino',            label: 'Filipino',          flag: '🇵🇭' },
        { value: 'german',              label: 'Deutsch',           flag: '🇩🇪' },
        { value: 'french',              label: 'Français',          flag: '🇫🇷' },
        { value: 'portuguese',          label: 'Português',         flag: '🇧🇷' },
        { value: 'russian',             label: 'Русский',           flag: '🇷🇺' }
    ];

    // 迅雷 API 只有中文（粵語/繁中/簡中），其他語言冇 fallback
    function canUseXunlei(lang) {
        // v1.5.69: 簡體中文也加入。迅雷字幕多數係簡體中文，
        // 簡體用戶反而最需要這個 fallback。
        return lang === 'cantonese'
            || lang === 'traditional-chinese'
            || lang === 'simplified-chinese';
    }

    /** v1.5.49: 由 value 查顯示名稱（給 toast / 標題用） */
    function currentLangLabel(lang) {
        const code = lang || preferredLanguage;
        for (var i = 0; i < LANGUAGE_OPTIONS.length; i++) {
            if (LANGUAGE_OPTIONS[i].value === code) return LANGUAGE_OPTIONS[i].label;
        }
        return code;
    }

    // ===== v1.5.50: i18n 框架 =====
    // UI 翻譯：所有用戶可見文字都用 t('key') 取得
    // 翻譯包按語言放在 _UI_STRINGS，找不到時 fallback 到英文，再 fallback 到繁中
    const UI_STRINGS = {
        'zh-tw': {
            'app.name': '字幕老師',
            'auth.hasAccount': '已有帳號？{login}',
            'auth.loginLink': '登入',
            'auth.noAccount': '未有帳號？{register}',
            'auth.registerLink': '註冊',
            'badge.extra': '補充',
            'badge.loading': '偵測',
            'badge.noLogin': '未登入',
            'badge.none': '無',
            'badge.partial': '殘次',
            'badge.subtitle': '字幕',
            'btn.adjust': '調節',
            'btn.cancel': '取消',
            'btn.clearSubtitle': '清空字幕',
            'btn.closePanel': '關閉面板',
            'btn.copy': '複製',
            'btn.fetchSubtitle': '擷取字幕',
            'btn.localSubtitle': '本地字幕',
            'btn.login': '登入',
            'btn.loginRegister': '登入 / 註冊',
            'btn.logout': '登出',
            'btn.register': '註冊',
            'btn.report': '回報',
            'btn.reset': '重設',
            'btn.saveSettings': '保存設置',
            'btn.settings': '設置',
            'btn.submit': '提交',
            'btn.upgrade': '升級',
            'err.badJson': '無法解析服務器響應 (JSON)',
            'err.gmNotSupported': '當前腳本管理器不支持 GM.xmlHttpRequest',
            'err.loginFailed': '登入失敗',
            'err.mustLogin': '請先登入',
            'err.mustLoginUpgrade': '請先登入再升級',
            'err.needEmailPassword': '請輸入 email 和密碼',
            'err.network': '網絡錯誤或請求被阻止',
            'err.noPlayer': '錯誤：無法連接到播放器實例',
            'err.noVideoContainer': '錯誤：無法找到視頻容器掛載字幕',
            'err.noVideoId': '無法獲取當前影片番號',
            'err.passwordMismatch': '兩次密碼不一致',
            'err.passwordTooShort': '密碼至少 8 個字元',
            'err.registerFailed': '註冊失敗',
            'err.server': '服務器錯誤 {status}',
            'err.submitFailed': '提交失敗',
            'err.timeout': '請求超時（{seconds} 秒）',
            'fetch.failed': '擷取字幕失敗: {message}',
            'fetch.fetching': '正在擷取字幕: {videoId} ({lang})...',
            'fetch.notFound': '未找到 {videoId} 嘅 {lang} 字幕',
            'fetch.tryXunlei': 'PocketBase 未找到，嘗試迅雷...',
            'fetch.xunleiError': '迅雷搜索出錯: {message}',
            'fetch.xunleiLoading': '迅雷: 載入 {name}...',
            'fetch.xunleiNotFound': '未找到 {videoId} 嘅字幕',
            'founder.bodyAfter': '，開通會自動對應到呢個帳號。',
            'founder.bodyBefore': '喺 Buy Me a Coffee 付款時，',
            'founder.bodyEmphasis': '請務必填寫以下 Email',
            'founder.goPay': '已確認，前往付款',
            'founder.title': '確認付款電郵',
            'founder.warning': '⚠️ 填錯 Email 會導致無法自動開通。',
            'label.backKey': '倒退鍵',
            'label.brightness': '亮度',
            'label.confirmPassword': '確認密碼',
            'label.contrast': '對比度',
            'label.detailOptional': '詳細說明（可選）',
            'label.forwardKey': '快進鍵',
            'label.password': '密碼',
            'label.saturation': '飽和度',
            'label.speedKey': '加速鍵',
            'label.speedRate': '加速倍率',
            'label.stepSeconds': '步進秒數',
            'label.subtitleColor': '字幕顏色',
            'label.subtitleLang': '字幕語言',
            'label.subtitleOffset': '字幕偏移',
            'label.subtitlePosition': '字幕位置',
            'label.subtitleSize': '字幕大小',
            'label.uiLang': '界面語言',
            'lang.cantonese': '廣東話',
            'lang.japanese': '日本語',
            'lang.traditionalChinese': '繁體中文',
            'misc.copyHint': '已選取，請按 Cmd+C / Ctrl+C 複製',
            'online.clickToLoad': '點擊加載: {name}',
            'online.closeList': '關閉列表',
            'online.downloadFailed': '下載失敗 (HTTP {status})',
            'online.emptyContent': '字幕內容爲空',
            'online.loadFailed': '在線字幕加載失敗: {message}',
            'online.loaded': '在線字幕加載成功',
            'online.loading': '正在加載在線字幕...',
            'online.noMatch': '未找到 {videoID} 的匹配字幕',
            'online.noSrtFound': '未找到 {videoID} 的SRT字幕',
            'online.notFound': '未找到相關字幕。',
            'online.searchError': '字幕搜索出錯: {message}',
            'online.searching': '正在搜索字幕: {videoID}...',
            'online.selectSubtitle': '選擇在線字幕:',
            'plan.founder': 'Founder 創辦會員',
            'plan.free': '免費會員',
            'plan.lifetime': '終身一次性',
            'plan.member': '會員',
            'plan.memberExpired': '會員(已過期)',
            'plan.monthly': '月費',
            'plan.monthlyPrice': 'USD$5 / 月',
            'plan.paid': '付費會員',
            'plan.yearly': '年費',
            'plan.yearlyPrice': 'USD$50 / 年',
            'player.ready': '播放器初始化完成',
            'quota.exhausted': '今日配額已用完 ({count}/{limit})',
            'quota.memberExpired': '會員已到期，請續期後再存取此字幕',
            'quota.needUpgrade': '此字幕需要升級會員才能存取（帳號狀態：{plan}）',
            'report.audioMismatch': '聲音同字幕唔夾',
            'report.inaccurate': '翻譯唔準確',
            'report.other': '其他',
            'report.poorQuality': '質素差',
            'report.requestSubtitle': '請求字幕',
            'report.timingOutOfSync': '時間軸唔同步',
            'report.title': '回報 / 請求',
            'report.unknown': '未知',
            'report.version': '版本',
            'report.videoCode': '番號',
            'report.wrongText': '字幕錯字',
            'srt.contentEmpty': 'SRT 內容為空',
            'srt.downloadFailed': '下載 SRT 失敗 ({status})',
            'srt.fileNotFound': '找不到 srt_file',
            'srt.tokenEmpty': '檔案 token 為空',
            'srt.tokenFailed': '取得檔案 token 失敗',
            'status.cleared': '字幕已清除',
            'status.copied': '已複製',
            'status.founderGranted': '✅ Founder 會員已開通，重新載入中…',
            'status.loadFailed': '本地字幕加載失敗: {message}',
            'status.loaded': '本地字幕加載成功',
            'status.loadingOnline': '正在加載在線字幕...',
            'status.loggedIn': '登入成功',
            'status.loggedOut': '已登出',
            'status.offsetFailed': '應用字幕偏移失敗: {message}',
            'status.onlineLoaded': '在線字幕加載成功',
            'status.processing': '處理中...',
            'status.registered': '註冊成功',
            'status.reportSubmitted': '回報已提交，多謝你嘅反饋！',
            'status.saveFailed': '保存設置失敗',
            'status.selectToCopy': '已選取，請按 Cmd+C / Ctrl+C 複製',
            'status.settingsSaved': '設置已保存',
            'status.submitting': '提交中...',
            'status.subtitleLoaded': '{title} {lang} 字幕已加載',
            'status.today': '今日',
            'upgrade.accumulated': '已累計 USD${total}，尚差 USD${remaining}',
            'upgrade.afterPay': '付款完成後，返嚟重新載入頁面即會自動開通',
            'upgrade.alreadyGranted': '✅ Founder 會員已開通，重新載入中…',
            'upgrade.betaLine': 'Beta 期間限定：<strong style="color:var(--ms-accent)">Founder 創辦會員 USD$30 終身</strong>。',
            'upgrade.betaOnly': 'Beta 期間只開放 Founder 創辦會員 USD$30 終身，其他方案會加價',
            'upgrade.emailHint': '📧 付款時請填寫你嘅登入 Email：',
            'upgrade.noRecord': '搵唔到付款記錄。請確認付款時填的 Email 與登入 Email 一致',
            'upgrade.notAvailable': '（未取得）',
            'upgrade.notOpen': '此方案尚未開放',
            'upgrade.title': '支持字幕補完計劃',
        },
        'en': {
            'app.name': 'SubSensei',
            'auth.hasAccount': 'Already have an account? {login}',
            'auth.loginLink': 'Login',
            'auth.noAccount': 'No account? {register}',
            'auth.registerLink': 'Register',
            'badge.extra': 'Extra',
            'badge.loading': 'Check',
            'badge.noLogin': 'No login',
            'badge.none': 'None',
            'badge.partial': 'Partial',
            'badge.subtitle': 'Subs',
            'btn.adjust': 'Adjust',
            'btn.cancel': 'Cancel',
            'btn.clearSubtitle': 'Clear',
            'btn.closePanel': 'Close',
            'btn.copy': 'Copy',
            'btn.fetchSubtitle': 'Extract',
            'btn.localSubtitle': 'Local',
            'btn.login': 'Login',
            'btn.loginRegister': 'Login / Register',
            'btn.logout': 'Logout',
            'btn.register': 'Register',
            'btn.report': 'Report',
            'btn.reset': 'Reset',
            'btn.saveSettings': 'Save Settings',
            'btn.settings': 'Settings',
            'btn.submit': 'Submit',
            'btn.upgrade': 'Upgrade',
            'err.badJson': 'Server response (JSON) could not be parsed.',
            'err.gmNotSupported': 'The current script manager does not support GM.xmlHttpRequest.',
            'err.loginFailed': 'Login failed.',
            'err.mustLogin': 'Please log in first.',
            'err.mustLoginUpgrade': 'Please log in before upgrading.',
            'err.needEmailPassword': 'Please enter your email and password.',
            'err.network': 'Network error or request blocked.',
            'err.noPlayer': 'Error: Unable to connect to the player instance.',
            'err.noVideoContainer': 'Error: Video container not found for subtitle loading.',
            'err.noVideoId': 'Current video ID cannot be retrieved.',
            'err.passwordMismatch': 'Passwords do not match.',
            'err.passwordTooShort': 'Password must be at least 8 characters long.',
            'err.registerFailed': 'Registration failed.',
            'err.server': 'Server error {status}.',
            'err.submitFailed': 'Submission failed.',
            'err.timeout': 'Request timed out ({seconds}s)',
            'fetch.failed': 'Subtitle retrieval failed: {message}.',
            'fetch.fetching': 'Retrieving subtitles: {videoId} ({lang})...',
            'fetch.notFound': '{lang} subtitles for {videoId} not found.',
            'fetch.tryXunlei': 'Not found on PocketBase; trying Xunlei...',
            'fetch.xunleiError': 'Xunlei search error: {message}',
            'fetch.xunleiLoading': 'Xunlei: loading {name}...',
            'fetch.xunleiNotFound': 'Subtitles for {videoId} not found.',
            'founder.bodyAfter': '— activation will be matched to this account automatically.',
            'founder.bodyBefore': 'When paying on Buy Me a Coffee,',
            'founder.bodyEmphasis': 'please use the email below',
            'founder.goPay': 'Confirmed, Proceed to Payment',
            'founder.title': 'Confirm Payment Email',
            'founder.warning': '⚠️ A wrong email will prevent automatic activation.',
            'label.backKey': 'Backward',
            'label.brightness': 'Brightness',
            'label.confirmPassword': 'Confirm',
            'label.contrast': 'Contrast',
            'label.detailOptional': 'Details (optional)',
            'label.forwardKey': 'Forward',
            'label.password': 'Password',
            'label.saturation': 'Saturation',
            'label.speedKey': 'Speed Up',
            'label.speedRate': 'Rate',
            'label.stepSeconds': 'Step (s)',
            'label.subtitleColor': 'Color',
            'label.subtitleLang': 'SUBTITLE LANGUAGE',
            'label.subtitleOffset': 'Offset',
            'label.subtitlePosition': 'Position',
            'label.subtitleSize': 'Size',
            'label.uiLang': 'UI LANGUAGE',
            'lang.cantonese': 'Cantonese',
            'lang.japanese': 'Japanese',
            'lang.traditionalChinese': 'Traditional Chinese',
            'misc.copyHint': 'Selected; press Cmd+C / Ctrl+C to copy',
            'online.clickToLoad': 'Click to load: {name}',
            'online.closeList': 'Close list',
            'online.downloadFailed': 'Download failed (HTTP {status})',
            'online.emptyContent': 'Subtitle content is empty',
            'online.loadFailed': 'Online subtitles failed to load: {message}',
            'online.loaded': 'Online subtitles loaded successfully',
            'online.loading': 'Loading online subtitles...',
            'online.noMatch': 'No matching subtitles found for {videoID}',
            'online.noSrtFound': 'No SRT subtitles found for {videoID}.',
            'online.notFound': 'No relevant subtitles available.',
            'online.searchError': 'Subtitle search error: {message}.',
            'online.searching': 'Searching for subtitles: {videoID}...',
            'online.selectSubtitle': 'Select online subtitles:',
            'plan.founder': 'Founder',
            'plan.free': 'Free',
            'plan.lifetime': 'Lifetime',
            'plan.member': 'Member',
            'plan.memberExpired': 'Member (expired)',
            'plan.monthly': 'Monthly',
            'plan.monthlyPrice': 'USD$5/mo',
            'plan.paid': 'Premium',
            'plan.yearly': 'Yearly',
            'plan.yearlyPrice': 'USD$50/yr',
            'player.ready': 'Player initialized successfully.',
            'quota.exhausted': 'Daily quota used up ({count}/{limit}).',
            'quota.memberExpired': 'Membership has expired; renew first to access these subtitles.',
            'quota.needUpgrade': 'Access to these subtitles requires a higher membership level (Account status: {plan}).',
            'report.audioMismatch': 'Audio and subtitles are out of sync.',
            'report.inaccurate': 'Translation is inaccurate.',
            'report.other': 'Other',
            'report.poorQuality': 'Poor quality.',
            'report.requestSubtitle': 'Request subtitles.',
            'report.timingOutOfSync': 'Timeline is not synchronized.',
            'report.title': 'Report / Request',
            'report.unknown': 'Unknown',
            'report.version': 'Version',
            'report.videoCode': 'Code',
            'report.wrongText': 'Subtitle contains errors.',
            'srt.contentEmpty': 'SRT content is empty.',
            'srt.downloadFailed': 'Failed to download SRT ({status})',
            'srt.fileNotFound': 'srt_file not found.',
            'srt.tokenEmpty': 'File token is empty.',
            'srt.tokenFailed': 'Failed to retrieve file token.',
            'status.cleared': 'Subtitles have been cleared.',
            'status.copied': 'Copied successfully.',
            'status.founderGranted': '✅ Founder membership activated; reloading...',
            'status.loadFailed': 'Failed to load local subtitles: {message}',
            'status.loaded': 'Local subtitles loaded successfully.',
            'status.loadingOnline': 'Loading online subtitles...',
            'status.loggedIn': 'Login successful.',
            'status.loggedOut': 'Logged out.',
            'status.offsetFailed': 'Failed to apply subtitle offset: {message}',
            'status.onlineLoaded': 'Online subtitles loaded successfully.',
            'status.processing': 'Processing...',
            'status.registered': 'Registration successful.',
            'status.reportSubmitted': 'Report submitted; thank you for your feedback!',
            'status.saveFailed': 'Failed to save settings.',
            'status.selectToCopy': 'Selected. Press Cmd+C / Ctrl+C to copy.',
            'status.settingsSaved': 'Settings saved successfully.',
            'status.submitting': 'Submitting...',
            'status.subtitleLoaded': '{title} {lang} subtitles loaded.',
            'status.today': 'Today',
            'upgrade.accumulated': 'Total paid: USD${total}. Amount remaining: USD${remaining}.',
            'upgrade.afterPay': 'Service will be activated automatically after payment and page reload.',
            'upgrade.alreadyGranted': '✅ Founder plan activated. Reloading...',
            'upgrade.betaLine': 'Limited during beta: <strong style="color:var(--ms-accent)">Founder Membership USD$30 lifetime</strong>.',
            'upgrade.betaOnly': 'During beta, only the Founder lifetime plan at USD$30 is available. Other plans will increase in price.',
            'upgrade.emailHint': '📧 Enter your login email when paying:',
            'upgrade.noRecord': 'No payment record found. Please ensure the email used for payment matches your login email.',
            'upgrade.notAvailable': '(Not available)',
            'upgrade.notOpen': 'This option is not yet available.',
            'upgrade.title': 'Support the Subtitle Completion Project',
        },
    };

    // v1.5.52: UI 只支援 2 種語言（英文 / 繁體中文）。
    // 用戶嘅瀏覽器語言只決定「預設顯示邊種」，其他語言一律 fallback 到英文。
    const UI_LANG_MAP = {
        'zh-hk': 'zh-tw', 'zh-mo': 'zh-tw', 'zh-tw': 'zh-tw',
        'zh-cn': 'zh-tw', 'zh-sg': 'zh-tw', 'zh': 'zh-tw',
        'en': 'en'
    };

    /** 由瀏覽器語言偵測 UI 語言 */
    function detectUiLang() {
        const saved = localStorage.getItem('missavUiLang');
        if (saved && UI_STRINGS[saved]) return saved;
        const nav = (navigator.language || 'zh-tw').toLowerCase();
        if (UI_LANG_MAP[nav]) return UI_LANG_MAP[nav];
        const base = nav.split('-')[0];
        if (UI_LANG_MAP[base]) return UI_LANG_MAP[base];
        // v1.5.52: 非中英文的瀏覽器 -> fallback 英文（國際通用）
        return 'en';
    }

    let uiLang = detectUiLang();
    // v1.5.54: 立即把語言寫到 body，CSS 才能依語言調整字體
    if (typeof document !== 'undefined' && document.body) {
        document.body.setAttribute('data-ui-lang', uiLang);
    }

    /**
     * 翻譯 UI 字串
     * @param {string} key   如 'btn.settings'
     * @param {object} vars  佔位符變數，如 { count: 3 }
     */
    function t(key, vars) {
        let table = UI_STRINGS[uiLang];
        let str = table && table[key];
        // fallback 到英文，再 fallback 到繁中
        if (str === undefined && UI_STRINGS['en']) str = UI_STRINGS['en'][key];
        if (str === undefined) str = UI_STRINGS['zh-tw'][key];
        if (str === undefined) return key;
        if (vars) {
            Object.keys(vars).forEach(function (k) {
                str = str.split('{' + k + '}').join(String(vars[k]));
            });
        }
        return str;
    }

    /** 切換 UI 語言（保存到 localStorage）*/
    /** 把目前 UI 語言寫到 body[data-ui-lang]，讓 CSS 可以依語言調整字體大小 */
    function applyUiLangAttr() {
        if (document.body) {
            document.body.setAttribute('data-ui-lang', uiLang);
        }
    }

    function setUiLang(lang) {
        if (!UI_STRINGS[lang]) return;
        uiLang = lang;
        localStorage.setItem('missavUiLang', lang);
        applyUiLangAttr();
    }


    // --- Styles — Sakura Noir Theme (v1.5.37) ---
    // 設計取自 9pick（F:\dsh-workspace\sukigao9\style.css）嘅粉紅 palette，
    // 但因為 panel 浮喺 missav 黑底上面，用淺粉會超刺眼，所以壓暗成「深櫻紅黑」。
    // 字型直接搬 9pick 嘅香港優先 stack —— 台灣用戶會自然 fallback 到
    // PingFang TC / Noto Sans TC / 微軟正黑體，唔會出豆腐格。
    addStyle(`
        /* v1.5.39: 顏色同字型直接沿用 missav.ai 本身
           （取自 dm278/chinese-subtitle 的分頁器：bg-primary = #FE628E，
             text-nord6 = #ECEFF4，字型 Inter）
           背景由 #1a0f14 提亮到 #2a1a22 —— 用戶反映原本太暗。 */
        :root {
            /* v1.5.39: 背景同「升級 SubSensei 會員」彈窗一致（深櫻紅黑） */
            --ms-bg:          #1a0f14;
            --ms-bg-elev:     #24151c;
            --ms-bg-elev-2:   #2e1a24;
            --ms-line:        #4a2a38;
            --ms-line-strong: #6b3d52;

            /* 文字沿用 Nord 的 nord6 / nord4 */
            --ms-text:        #ECEFF4;   /* nord6 */
            --ms-text-muted:  #D8DEE9;   /* nord4 */
            --ms-text-dim:    #a8b0c0;

            /* missav 主色 */
            --ms-accent:      #FE628E;
            --ms-accent-hi:   #FF8FAB;
            --ms-accent-soft: #FFB3C6;
            --ms-accent-tint: #46222f;

            --ms-ok:          #2eb872;   /* 綠：有字幕 */
            --ms-danger:      #e5484d;
            --ms-warn:        #f0a020;   /* 黃：補充 */
            --ms-partial:     #fd7e14;   /* 橙：殘次 */

            --ms-shadow:      0 8px 32px rgba(254, 98, 142, 0.20);
            --ms-shadow-soft: 0 2px 10px rgba(254, 98, 142, 0.12);

            --ms-radius:      12px;
            --ms-radius-sm:   8px;

            /* v1.5.39: Inter 排第一（同 missav.ai 一致） */
            --ms-font: "Inter", -apple-system, "PingFang HK", "PingFang TC",
                       "Noto Sans HK", "Noto Sans TC", "Microsoft JhengHei",
                       "Hiragino Sans", system-ui, "Segoe UI", Roboto,
                       "Helvetica Neue", sans-serif;
        }
        .custom-control-panel {
            position: fixed;
            left: 12px;
            bottom: 78px;
            background: var(--ms-bg);
            color: var(--ms-text);
            padding: 12px 14px;
            /* v1.5.66: 40px -> 12px。標題列現在佔滿第一行，✕ 絕對定位在 top:8px 右邊，
               標題列自己用 padding-right 避開 ✕，唔需要靠面板 padding-top 留位。 */
            padding-top: 12px;
            z-index: 9999;
            border-radius: var(--ms-radius);
            width: min(292px, calc(100vw - 24px));
            max-height: min(560px, calc(100vh - 120px));
            overflow-y: auto;
            overflow-x: hidden;  /* v1.5.53: 禁止橫向滾動 */
            font-family: var(--ms-font);
            font-size: 14px;
            box-shadow: var(--ms-shadow), 0 0 0 1px var(--ms-line);
            border: 1px solid var(--ms-line);
            backdrop-filter: blur(12px);
            transition: all 0.3s ease;
            display: none;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px 10px;
            align-items: end;
        }
        .custom-control-panel label {
            margin-right: 0;
            display: block;
            min-width: 0;
            text-align: left;
            color: var(--ms-text-muted);
            font-weight: 500;
            font-size: 12px;
            line-height: 1.2;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }
        .custom-control-panel input[type="number"],
        .custom-control-panel input[type="text"],
        .custom-control-panel input[type="color"] {
            width: 100%;
            margin-right: 0;
            color: var(--ms-text);
            background: var(--ms-bg-elev);
            border: 1px solid var(--ms-line);
            border-radius: var(--ms-radius-sm);
            /* v1.5.56: 垂直置中 —— 之前 padding 5px + height 30px 令文字偏下。
               改成固定 height + line-height = height - 2*border，並水平置中文字 */
            padding: 0 8px;
            box-sizing: border-box;
            transition: all 0.2s ease;
            font-family: var(--ms-font);
            font-size: 13px;
            height: 30px;
            line-height: 28px;
            text-align: center;
            vertical-align: middle;
        }
        .custom-control-panel input[type="number"]:focus,
        .custom-control-panel input[type="text"]:focus,
        .custom-control-panel input[type="color"]:focus {
            outline: none;
            border-color: var(--ms-accent);
            background: var(--ms-bg-elev-2);
            box-shadow: 0 0 10px rgba(255, 92, 143, 0.20);
        }
        .custom-control-panel input[type="color"] {
            padding: 2px;
            min-width: 56px;
            cursor: pointer;
        }
         /* Specific width for offset/position inputs */
        .custom-control-panel input[data-key-name="subtitleOffset"],
        .custom-control-panel input[data-key-name="subtitlePosition"] {
             width: 100%;
        }
        /* v1.5.39: 主面板按鈕改用「升級」彈窗方案框的粉色漸變 */
        .custom-control-panel button {
            background: linear-gradient(135deg, var(--ms-accent), #d63b6f);
            border: 1px solid transparent;
            color: var(--ms-text);
            padding: 6px 4px;
            border-radius: var(--ms-radius-sm);
            cursor: pointer;
            margin: 0;
            font-family: var(--ms-font);
            /* v1.5.54: 中文 14px / 英文 12px（英文標籤較長，12px 才放得落 3 欄） */
            font-size: 14px;
            font-weight: 500;
            line-height: 1.25;
            transition: all 0.2s ease;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
            white-space: normal;
            overflow-wrap: break-word;
            word-break: break-word;
            min-height: 34px;
            max-width: 100%;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .custom-control-panel button:hover {
            background: linear-gradient(135deg, var(--ms-accent-hi), var(--ms-accent));
            border-color: transparent;
            color: #fff;
            transform: translateY(-1px);
            box-shadow: 0 4px 16px rgba(255, 92, 143, 0.25);
        }
        .custom-control-panel button:active {
            transform: translateY(0);
            box-shadow: 0 1px 4px rgba(255, 92, 143, 0.18);
        }
        .custom-control-panel .input-group {
            margin-bottom: 0;
            display: grid;
            /* v1.5.53: 56px -> 52px，給標籤更多空間（英文標籤較長） */
            grid-template-columns: minmax(0, 1fr) 52px;
            align-items: center;
            gap: 5px;
            min-width: 0;
        }
        .custom-control-panel .input-group > label {
            font-size: 12px;
            line-height: 1.25;
            /* v1.5.67: 英文標籤（SUBTITLE LANGUAGE / UI LANGUAGE）會換成兩行，
               white-space 要 normal 才換得到 */
            white-space: normal;
            overflow-wrap: break-word;
            word-break: break-word;
            min-width: 0;
        }
        .custom-control-panel .button-group {
            grid-column: 1 / -1;
            margin-top: 2px;
            /* v1.5.66: 移除 border-top —— 標題列已有 border-bottom，兩條線太亂 */
            padding-top: 10px;
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
            min-width: 0;
            width: 100%;
            box-sizing: border-box;
        }
        .custom-control-panel .button-group > button {
            min-width: 0;
            width: 100%;
        }
        /* v1.5.54: 英文 UI 的字縮小 —— 英文標籤（Extract / Settings）比中文長 */
        body[data-ui-lang="en"] .custom-control-panel button {
            font-size: 12px;
        }
        body[data-ui-lang="en"] .custom-control-panel .input-group > label {
            font-size: 10px;
        }
        body[data-ui-lang="en"] .custom-control-panel .plan-label,
        body[data-ui-lang="en"] .custom-control-panel .plan-price {
            font-size: 12px;
        }
        .custom-subtitle {
            position: absolute;
            left: 50%;
            transform: translateX(-50%);
            color: #ffffff;
            font-size: 26px;
            font-weight: 600;
            text-shadow: 2px 2px 8px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.5);
            background: rgba(0,0,0,0.0);
            padding: 5px 12px;
            border-radius: var(--ms-radius-sm);
            max-width: 85%;
            text-align: center;
            transition: opacity 0.3s, bottom 0.2s ease-out;
            z-index: 10000;
            pointer-events: none;
        }
        .subtitle-list {
            position: fixed;
            left: 12px;
            bottom: 140px;
            background: var(--ms-bg);
            color: var(--ms-text);
            max-height: min(320px, calc(100vh - 180px));
            width: min(280px, calc(100vw - 24px));
            overflow-y: auto;
            padding: 12px;
            border-radius: var(--ms-radius);
            z-index: 10001;
            border: 1px solid var(--ms-line);
            box-shadow: var(--ms-shadow);
            backdrop-filter: blur(12px);
            font-family: var(--ms-font);
        }
        .subtitle-item {
            padding: 8px 10px;
            cursor: pointer;
            border-bottom: 1px solid var(--ms-line);
            font-size: 12px;
            border-radius: var(--ms-radius-sm);
            margin-bottom: 4px;
            transition: all 0.2s ease;
            color: var(--ms-text-muted);
        }
        .subtitle-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
        }
        .subtitle-item:hover {
            background: var(--ms-accent-tint);
            color: var(--ms-text);
            transform: translateX(4px);
        }
        .show-controls-button {
            position: fixed;
            left: 14px;
            bottom: 16px;
            background: linear-gradient(135deg, var(--ms-accent), #c9265e);
            color: #fff;
            width: 56px;
            height: 56px;
            padding: 0;
            border: 1px solid var(--ms-accent-hi);
            border-radius: 999px;
            cursor: pointer;
            z-index: 9998;
            font-family: var(--ms-font);
            font-size: 15px;  /* v1.5.39: 12px -> 15px */
            font-weight: 700;
            box-shadow: 0 4px 20px rgba(254, 98, 142, 0.45);
            transition: all 0.3s ease;
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            user-select: none;
            -webkit-user-select: none;
            touch-action: none;
            cursor: grab;
        }
        .show-controls-button:hover {
            background: linear-gradient(135deg, var(--ms-accent-hi), var(--ms-accent));
            border-color: #fff;
            transform: translateY(-2px) scale(1.02);
            box-shadow: 0 6px 24px rgba(254, 98, 142, 0.55);
        }
        .show-controls-button.dragging {
            transition: none;
            transform: none;
            cursor: grabbing;
        }
        .custom-control-panel button.full-width {
            grid-column: 1 / -1;
        }
        /* Panel close button (✕) */
        /* v1.5.39: 用 !important 鎖死尺寸 —— 否則被 .custom-control-panel button
           的 min-height:34px / padding:7px 8px 撐大（用戶反映 X 太大蓋住分隔線） */
        .custom-control-panel .panel-close-btn {
            position: absolute !important;
            /* v1.5.66: top 8px -> 12px，同面板 padding-top 一致，同標題列垂直對齊 */
            top: 12px !important;
            right: 8px !important;
            width: 22px !important;
            height: 22px !important;
            min-height: 0 !important;
            max-height: 22px !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 6px !important;
            background: transparent !important;
            color: var(--ms-text-dim) !important;
            font-size: 15px !important;
            font-weight: 400 !important;
            line-height: 1 !important;
            cursor: pointer !important;
            z-index: 10 !important;
            transition: all 0.2s ease;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-shadow: none !important;
        }
        .custom-control-panel .panel-close-btn:hover {
            background: var(--ms-danger) !important;
            color: #fff !important;
        }
        /* Language selector */
        .lang-select {
            width: 100%;
            height: 30px;
            color: var(--ms-text);
            background: var(--ms-bg-elev);
            border: 1px solid var(--ms-line);
            border-radius: var(--ms-radius-sm);
            /* v1.5.56: 垂直置中（之前 padding 2px + line-height 1 令文字偏上） */
            padding: 0 6px;
            box-sizing: border-box;
            font-size: 13px;
            cursor: pointer;
            line-height: 28px;
            vertical-align: middle;
        }
        /* v1.5.39: option 要明確指定顏色，否則部分瀏覽器（Windows/Chrome）
           用系統預設白底 -> 白底白字睇唔到 */
        .lang-select option {
            background: var(--ms-bg-elev);
            color: var(--ms-text);
        }
        .lang-select:focus {
            outline: none;
            border-color: var(--ms-accent);
        }
        /* v1.5.63: 面板頂部標題列（app 名稱 + 版本號） */
        .custom-control-panel .panel-header {
            grid-column: 1 / -1;
            display: flex;
            align-items: center;        /* v1.5.66: baseline -> center，同 ✕ 垂直對齊 */
            gap: 6px;
            /* v1.5.66: 右邊留 30px 給 ✕（top:8 right:8 寬 22）+ 少許間距 */
            padding: 0 30px 0 0;
            /* 高度對齊 ✕（22px），令整行高度一致 */
            min-height: 22px;
            margin: 0 0 8px 0;
            /* 只保留一條分隔線（原本 panel-header 一條 + button-group 一條 = 兩條） */
            border-bottom: 1px solid var(--ms-line);
            min-width: 0;
        }
        .custom-control-panel .panel-app-name {
            font-size: 13px;
            font-weight: 600;
            color: var(--ms-accent);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .custom-control-panel .panel-app-version {
            font-size: 11px;
            color: var(--ms-text-muted);
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
        }
        body[data-ui-lang="en"] .custom-control-panel .panel-app-name {
            font-size: 12px;
        }

        /* Auth status bar */
        .auth-status {
            grid-column: 1 / -1;
            font-size: 12px;         /* v1.5.39: 10px -> 12px */
            color: var(--ms-text-muted);
            text-align: center;
            padding: 4px 0;
            border-top: 1px solid var(--ms-line);
            margin-top: 2px;
        }
        /* v1.5.39: 第一行 info（長 email 用省略號）、第二行 actions（不換行） */
        .auth-status .auth-info {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.5;
        }
        .auth-status .auth-quota {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            line-height: 1.4;
            font-size: 11px;
            color: var(--ms-accent);   /* v1.5.55: 配額用粉色突出 */
        }
        .auth-status .auth-actions {
            display: block;
            white-space: nowrap;
            line-height: 1.6;
        }
        .auth-status .auth-action {
            color: var(--ms-accent);
            cursor: pointer;
            text-decoration: underline;
            margin-left: 10px;          /* gap between each action & before first action */
            padding: 1px 2px;
            white-space: nowrap;        /* 每個 action 自身不換行 */
            display: inline-block;      /* 令 nowrap 生效 */
        }
        .auth-status .auth-action:hover {
            color: var(--ms-accent-hi);
        }
        /* Separate the two logged-in actions clearly (升級 vs 登出) */
        /* v1.5.39: 回報 panel 的 select / textarea 深底樣式
           之前用 rgba(255,255,255,0.08) 半透明，下拉彈出時變白底白字睇唔到 */
        .report-overlay select,
        .report-overlay textarea {
            background: #24151c !important;
            color: #ECEFF4 !important;
            border-color: var(--ms-line-strong) !important;
        }
        .report-overlay select option {
            background: #24151c !important;
            color: #ECEFF4 !important;
        }
        .report-overlay textarea::placeholder {
            color: #a8b0c0 !important;
            opacity: 1;
        }
        .report-overlay select:focus,
        .report-overlay textarea:focus {
            outline: none;
            border-color: var(--ms-accent) !important;
        }
        .auth-status .upgrade-link {
            margin-right: 4px;
        }
        .auth-status.logged-in .auth-action:first-of-type {
            margin-left: 0;             /* v1.5.39: 已改為獨立一行，唔需要額外 gap */
        }
        /* v1.5.39: 原本 rgba(60,200,120,0.8) 在櫻紅底上偏灰，
           改用實色 emerald-400 #4ADE80（對比度 ≈ 9.4:1，遠超 WCAG AA） */
        .auth-status.logged-in {
            color: #4ADE80;
        }
        /* v1.5.43: 畫面調節滑桿（內嵌喺面板內，同設置一樣） */
        .custom-control-panel .pa-slider {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            height: 4px;
            border-radius: 2px;
            background: var(--ms-bg-elev-2);
            outline: none;
            cursor: pointer;
        }
        .custom-control-panel .pa-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--ms-accent);
            border: 2px solid #fff;
            cursor: grab;
        }
        .custom-control-panel .pa-slider::-webkit-slider-thumb:active {
            cursor: grabbing;
        }
        .custom-control-panel .pa-slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--ms-accent);
            border: 2px solid #fff;
            cursor: grab;
        }
        .custom-control-panel .pa-value {
            font-variant-numeric: tabular-nums;
        }
        /* Auth modal overlay */
        .auth-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .auth-modal {
            background: linear-gradient(135deg, rgba(26, 15, 20, 0.98), rgba(36, 21, 28, 0.98)); /* 同 --ms-bg / --ms-bg-elev */
            color: var(--ms-text);
            padding: 24px;
            border-radius: var(--ms-radius);
            width: min(320px, calc(100vw - 40px));
            box-shadow: var(--ms-shadow);
            border: 1px solid var(--ms-line);
        }
        .auth-modal h3 {
            margin: 0 0 16px 0;
            font-size: 16px;
            text-align: center;
        }
        .auth-modal input {
            width: 100%;
            box-sizing: border-box;
            padding: 10px 12px;
            margin-bottom: 10px;
            border: 1px solid var(--ms-line);
            border-radius: var(--ms-radius-sm);
            background: var(--ms-bg-elev);
            color: var(--ms-text);
            font-size: 14px;
        }
        .auth-modal input:focus {
            outline: none;
            border-color: var(--ms-accent);
        }
        .auth-modal .auth-btn {
            width: 100%;
            padding: 10px;
            border: none;
            border-radius: var(--ms-radius-sm);
            background: linear-gradient(135deg, var(--ms-accent), #d63b6f);
            color: var(--ms-text);
            font-size: 14px;
            cursor: pointer;
            margin-bottom: 8px;
        }
        .auth-modal .auth-btn:hover {
            background: linear-gradient(135deg, var(--ms-accent-hi), var(--ms-accent));
        }
        /* v1.5.40: 4 個方案按鈕
           - 前三項劃線（beta 期間唔賣，顯示原價）
           - 第四項 Founder LTD 可買，加黃色邊框突出 */
        /* v1.5.40: 劃線由 2px 粗紅線改為 1px 幼線 + 半透明，
           避免遮住原價數字（用戶反映睇唔到） */
        .auth-modal .auth-btn.plan-disabled {
            background: #2e1a24;
            border: 1px solid var(--ms-line);
            color: #8f7682;
            cursor: not-allowed;
            position: relative;
        }
        /* v1.5.40: 改用 text-decoration —— 每行文字各自有一條中線
           （偽元素方案是一條橫跨整個按鈕的線，不是穿過每個字） */
        .auth-modal .auth-btn.plan-disabled .plan-label,
        .auth-modal .auth-btn.plan-disabled .plan-price {
            text-decoration: line-through;
            text-decoration-color: rgba(229, 72, 77, 0.75);
            text-decoration-thickness: 1px;
        }
        .auth-modal .auth-btn.plan-disabled:hover {
            background: #2e1a24;
            filter: none;
        }
        .auth-modal .auth-btn.plan-enabled {
            background: linear-gradient(135deg, #FE628E, #c9265e);
            border: 2px solid #f0a020;
            box-shadow: 0 0 12px rgba(240, 160, 32, 0.45);
            font-size: 15px;
            font-weight: 700;
            padding: 12px;
        }
        .auth-modal .auth-btn.plan-enabled:hover {
            background: linear-gradient(135deg, #FF8FAB, #FE628E);
            box-shadow: 0 0 18px rgba(240, 160, 32, 0.7);
        }
        .auth-modal .auth-btn .plan-label {
            display: block;
            line-height: 1.3;
        }
        /* v1.5.40: Founder 確認框的電郵顯示 */
        .founder-email-box {
            display: flex;
            align-items: center;
            gap: 8px;
            background: #1a0f14;
            border: 1px solid var(--ms-accent);
            border-radius: var(--ms-radius-sm);
            padding: 10px 12px;
            margin: 4px 0 0;
        }
        .founder-email-box #founder-email-text {
            flex: 1;
            min-width: 0;
            font-size: 14px;
            font-weight: 600;
            color: #ECEFF4;
            word-break: break-all;
            user-select: all;
            -webkit-user-select: all;
        }
        .founder-copy-btn {
            flex: 0 0 auto;
            padding: 4px 10px;
            border: 1px solid var(--ms-line-strong);
            border-radius: 6px;
            background: var(--ms-bg-elev-2);
            color: var(--ms-text-muted);
            font-size: 11px;
            cursor: pointer;
            font-family: var(--ms-font);
        }
        .founder-copy-btn:hover {
            background: var(--ms-accent);
            color: #fff;
            border-color: var(--ms-accent);
        }
        .auth-modal .auth-btn .plan-price {
            display: block;
            font-size: 12px;
            font-weight: 500;
            opacity: 0.85;
            margin-top: 2px;
        }
        .auth-modal .auth-btn.plan-enabled .plan-price {
            font-size: 13px;
            opacity: 1;
        }
        .auth-modal .auth-toggle {
            text-align: center;
            font-size: 12px;
            color: var(--ms-text-muted);
        }
        .auth-modal .auth-toggle span {
            color: var(--ms-accent);
            cursor: pointer;
            text-decoration: underline;
        }
        .auth-modal .auth-close {
            position: absolute;
            top: 8px;
            right: 10px;
            background: none;
            border: none;
            color: rgba(255,255,255,0.5);
            font-size: 18px;
            cursor: pointer;
        }
        .auth-modal .auth-error {
            color: var(--ms-danger);
            font-size: 12px;
            text-align: center;
            margin-bottom: 8px;
        }
        .auth-modal-wrapper {
            position: relative;
        }
        .auth-pw-wrap {
            position: relative;
            width: 100%;
            margin-bottom: 10px;
        }
        .auth-pw-wrap input {
            width: 100%;
            padding-right: 40px;  /* room for eye button */
            margin-bottom: 0;
        }
        .auth-eye-btn {
            position: absolute;
            right: 4px;
            top: 50%;
            transform: translateY(-50%);
            width: 34px;
            height: 34px;
            padding: 0;
            border: none;
            background: none;
            font-size: 18px;
            cursor: pointer;
            opacity: 0.6;
            border-radius: var(--ms-radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            color: inherit;
            line-height: 1;
        }
        .auth-eye-btn:hover {
            opacity: 1;
            background: rgba(255,255,255,0.08);
        }
        @media (max-width: 640px) {
            .custom-control-panel {
                left: 10px;
                width: auto;
                max-height: calc(100vh - 108px);
                bottom: 74px;
            }
            .subtitle-list {
                left: 10px;
                width: auto;
            }
            .show-controls-button {
                left: 12px;
                bottom: 14px;
            }
        }
        /* List page subtitle badge */
        .ms-subtitle-badge {
            position: absolute !important;
            top: 8px !important;
            right: 8px !important;
            z-index: 10 !important;
            border: none !important;
            padding: 3px 7px !important;
            font-size: 11px !important;
            border-radius: 4px !important;
            color: white !important;
            pointer-events: none !important;
            font-weight: 600 !important;
            line-height: 1.4 !important;
        }
    `);

    // --- Global Variables ---
    let accelerationRate = parseFloat(localStorage.getItem('missavAccelerationRate')) || 3;
    let skipTime = parseFloat(localStorage.getItem('missavSkipTime')) || 5;
    let subtitleOffset = parseFloat(localStorage.getItem('missavSubtitleOffset')) || 0;
    let subtitleVerticalPositionPercent = parseFloat(localStorage.getItem('missavSubtitlePosition')) || 15; // Default 15% from bottom
    let subtitleFontSize = parseFloat(localStorage.getItem('missavSubtitleSize')) || 26;
    let subtitleColor = normalizeHexColor(localStorage.getItem('missavSubtitleColor')) || '#ffffff';
    let isAccelerating = false;
    let floatingButtonPosition = null;
    let floatingButtonDragState = null;
    let suppressFloatingButtonClick = false;
    let videoElement = null;
    let playerMonitorInterval = null;
    let hasShownPlayerReadyToast = false;
    let subtitleTrack = null;
    let subtitleTrackOwner = null;
    let playerBridgeState = {
        currentTime: 0,
        paused: true,
        ended: false,
        seeking: false,
        reason: ''
    };
    let isBridgeActive = false;
    let subtitles = [];
    let originalSubtitleText = '';
    // --- PocketBase Auth State ---
    let pbAuthToken = localStorage.getItem('missavPbAuthToken') || null;
    let pbUser = null;
    let pbUserPlan = 'free';
    let preferredLanguage = localStorage.getItem('missavPreferredLanguage') || 'cantonese';
    // Video picture adjustments (VLC-style) — CSS filter on the <video> element
    let videoBrightness = clamp(parseFloat(localStorage.getItem('missavVideoBrightness')) || 1.0, 0.5, 2.0);
    let videoContrast = clamp(parseFloat(localStorage.getItem('missavVideoContrast')) || 1.0, 0.5, 2.0);
    let videoSaturation = clamp(parseFloat(localStorage.getItem('missavVideoSaturate')) || 1.0, 0, 2.0);
    // Which adjustment the next hotkey press targets (cycle: brightness → contrast → saturation)
    let videoFilterTarget = 'brightness';
    let todayFetchCount = 0;
    let shortcutKeys = {
        accelerate: localStorage.getItem('missavAccelerateKey') || 'z',
        forward: localStorage.getItem('missavForwardKey') || 'c',
        backward: localStorage.getItem('missavBackwardKey') || 'x'
    };

    // --- UI Elements ---
    let controlPanel;
    let subtitleElement;
    let videoContainer;
    let subtitleList = null;
    let showControlsButton = null;

    // --- Functions ---

    function addStyle(css) {
        const style = document.createElement('style');
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
        return style;
    }

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function normalizeHexColor(value) {
        if (typeof value !== 'string') return null;

        const normalized = value.trim().toLowerCase();
        if (/^#[0-9a-f]{6}$/i.test(normalized)) {
            return normalized;
        }

        if (/^#[0-9a-f]{3}$/i.test(normalized)) {
            return `#${normalized.slice(1).split('').map((char) => char + char).join('')}`;
        }

        return null;
    }

    function getViewportMargin() {
        return window.innerWidth <= 640 ? 10 : 12;
    }

    function loadFloatingButtonPosition() {
        try {
            const raw = localStorage.getItem(FLOATING_BUTTON_POSITION_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (!Number.isFinite(parsed?.left) || !Number.isFinite(parsed?.top)) {
                return null;
            }
            return { left: parsed.left, top: parsed.top };
        } catch (error) {
            console.warn('Missav Script: Failed to load floating button position.', error);
            return null;
        }
    }

    function saveFloatingButtonPosition() {
        if (!floatingButtonPosition) return;

        try {
            localStorage.setItem(FLOATING_BUTTON_POSITION_KEY, JSON.stringify(floatingButtonPosition));
        } catch (error) {
            console.warn('Missav Script: Failed to save floating button position.', error);
        }
    }

    function clampFloatingButtonPosition(position) {
        const margin = getViewportMargin();
        const buttonWidth = showControlsButton?.offsetWidth || 52;
        const buttonHeight = showControlsButton?.offsetHeight || 52;

        return {
            left: clamp(position.left, margin, Math.max(margin, window.innerWidth - buttonWidth - margin)),
            top: clamp(position.top, margin, Math.max(margin, window.innerHeight - buttonHeight - margin))
        };
    }

    function getDefaultFloatingButtonPosition() {
        const margin = getViewportMargin();
        const buttonHeight = showControlsButton?.offsetHeight || 52;
        return clampFloatingButtonPosition({
            left: margin + 2,
            top: window.innerHeight - buttonHeight - 16
        });
    }

    function applyFloatingButtonPosition() {
        if (!showControlsButton) return;

        if (!floatingButtonPosition) {
            floatingButtonPosition = loadFloatingButtonPosition() || getDefaultFloatingButtonPosition();
        }

        floatingButtonPosition = clampFloatingButtonPosition(floatingButtonPosition);
        showControlsButton.style.left = `${floatingButtonPosition.left}px`;
        showControlsButton.style.top = `${floatingButtonPosition.top}px`;
        showControlsButton.style.right = 'auto';
        showControlsButton.style.bottom = 'auto';
    }

    function getBallAnchorRect() {
        if (!showControlsButton) return null;
        applyFloatingButtonPosition();

        if (showControlsButton.style.display !== 'none') {
            const rect = showControlsButton.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                return rect;
            }
        }

        const buttonWidth = showControlsButton.offsetWidth || 52;
        const buttonHeight = showControlsButton.offsetHeight || 52;
        const position = floatingButtonPosition || getDefaultFloatingButtonPosition();

        return {
            left: position.left,
            top: position.top,
            right: position.left + buttonWidth,
            bottom: position.top + buttonHeight,
            width: buttonWidth,
            height: buttonHeight
        };
    }

    function positionControlPanel() {
        if (!controlPanel || controlPanel.style.display === 'none') return;

        const anchorRect = getBallAnchorRect();
        if (!anchorRect) return;

        const margin = getViewportMargin();
        const gap = FLOATING_UI_GAP;
        const panelWidth = Math.min(controlPanel.offsetWidth || 292, Math.max(220, window.innerWidth - margin * 2));
        controlPanel.style.width = `${panelWidth}px`;
        controlPanel.style.maxHeight = `${Math.max(200, window.innerHeight - margin * 2)}px`;

        const panelHeight = Math.min(controlPanel.scrollHeight, window.innerHeight - margin * 2);
        const alignRight = anchorRect.left > window.innerWidth / 2;
        const preferredLeft = alignRight ? anchorRect.right - panelWidth : anchorRect.left;
        const left = clamp(preferredLeft, margin, Math.max(margin, window.innerWidth - panelWidth - margin));

        const spaceAbove = anchorRect.top - margin - gap;
        const spaceBelow = window.innerHeight - anchorRect.bottom - margin - gap;
        const shouldOpenAbove = spaceAbove >= panelHeight || spaceAbove >= spaceBelow;
        const preferredTop = shouldOpenAbove
            ? anchorRect.top - panelHeight - gap
            : anchorRect.bottom + gap;
        const top = clamp(preferredTop, margin, Math.max(margin, window.innerHeight - panelHeight - margin));

        controlPanel.style.left = `${left}px`;
        controlPanel.style.top = `${top}px`;
        controlPanel.style.right = 'auto';
        controlPanel.style.bottom = 'auto';
    }

    function cleanupFloatingButtonDrag() {
        document.removeEventListener('pointermove', handleFloatingButtonPointerMove);
        document.removeEventListener('pointerup', handleFloatingButtonPointerUp);
        document.removeEventListener('pointercancel', handleFloatingButtonPointerUp);
    }

    function handleFloatingButtonPointerMove(event) {
        if (!floatingButtonDragState) return;

        const deltaX = event.clientX - floatingButtonDragState.startX;
        const deltaY = event.clientY - floatingButtonDragState.startY;
        if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
            suppressFloatingButtonClick = true;
        }

        floatingButtonPosition = clampFloatingButtonPosition({
            left: floatingButtonDragState.originLeft + deltaX,
            top: floatingButtonDragState.originTop + deltaY
        });

        applyFloatingButtonPosition();
        positionControlPanel();
        positionSubtitleList();
    }

    function handleFloatingButtonPointerUp(event) {
        if (showControlsButton?.classList.contains('dragging')) {
            showControlsButton.classList.remove('dragging');
        }

        if (showControlsButton && floatingButtonDragState && event.pointerId !== undefined && showControlsButton.hasPointerCapture?.(event.pointerId)) {
            showControlsButton.releasePointerCapture(event.pointerId);
        }

        cleanupFloatingButtonDrag();

        if (floatingButtonDragState && suppressFloatingButtonClick) {
            saveFloatingButtonPosition();
        }

        floatingButtonDragState = null;
    }

    function handleFloatingButtonPointerDown(event) {
        if (event.button !== undefined && event.button !== 0) return;
        if (!showControlsButton) return;

        applyFloatingButtonPosition();
        const rect = showControlsButton.getBoundingClientRect();
        floatingButtonDragState = {
            startX: event.clientX,
            startY: event.clientY,
            originLeft: rect.left,
            originTop: rect.top
        };
        suppressFloatingButtonClick = false;
        showControlsButton.classList.add('dragging');

        if (event.pointerId !== undefined) {
            showControlsButton.setPointerCapture?.(event.pointerId);
        }

        document.addEventListener('pointermove', handleFloatingButtonPointerMove);
        document.addEventListener('pointerup', handleFloatingButtonPointerUp);
        document.addEventListener('pointercancel', handleFloatingButtonPointerUp);
    }

    function handleFloatingButtonClick(event) {
        if (suppressFloatingButtonClick) {
            suppressFloatingButtonClick = false;
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        showControlPanel();
    }

    function handleViewportChange() {
        applyFloatingButtonPosition();
        positionControlPanel();
        positionSubtitleList();
    }

    function openInNewTab(url) {
        try {
            if (typeof GM !== 'undefined' && typeof GM.openInTab === 'function') {
                return GM.openInTab(url, false);
            }
            if (typeof GM_openInTab === 'function') {
                return GM_openInTab(url, { active: true, insert: true });
            }
        } catch (error) {
            console.warn('Missav Script: GM.openInTab failed, falling back to window.open.', error);
        }

        return window.open(url, '_blank', 'noopener');
    }

    function gmRequest(details) {
        return new Promise((resolve, reject) => {
            const timeoutSeconds = details.timeout ? Math.ceil(details.timeout / 1000) : 0;
            const userOnload = details.onload;
            const userOnerror = details.onerror;
            const userOntimeout = details.ontimeout;
            const request = {
                ...details,
                onload: (response) => {
                    if (userOnload) userOnload(response);
                    resolve(response);
                },
                onerror: (error) => {
                    if (userOnerror) userOnerror(error);
                    reject(error instanceof Error ? error : new Error(t('err.network')));
                },
                ontimeout: () => {
                    if (userOntimeout) userOntimeout();
                    reject(new Error(t('err.timeout', { seconds: timeoutSeconds || '' })));
                }
            };

            try {
                if (typeof GM !== 'undefined' && typeof GM.xmlHttpRequest === 'function') {
                    GM.xmlHttpRequest(request);
                    return;
                }

                if (typeof GM_xmlhttpRequest === 'function') {
                    GM_xmlhttpRequest(request);
                    return;
                }
            } catch (error) {
                reject(error);
                return;
            }

            reject(new Error(t('err.gmNotSupported')));
        });
    }

    function parseJsonResponse(response) {
        if (response?.response && typeof response.response === 'object') {
            return response.response;
        }

        if (typeof response?.responseText === 'string' && response.responseText.trim()) {
            return JSON.parse(response.responseText);
        }

        throw new Error(t('err.badJson'));
    }

    function getResponseText(response) {
        if (typeof response?.responseText === 'string') {
            return response.responseText;
        }

        if (typeof response?.response === 'string') {
            return response.response;
        }

        return '';
    }

    function findPageVideo(root = document) {
        for (const selector of VIDEO_QUERY_SELECTORS) {
            const candidate = root.querySelector(selector);
            if (candidate instanceof HTMLVideoElement) {
                return candidate;
            }
        }

        const fallbackVideo = root.querySelector('video');
        return fallbackVideo instanceof HTMLVideoElement ? fallbackVideo : null;
    }

    function findVideoContainer(video = null) {
        const currentVideo = video || findVideoElement() || findPageVideo();

        if (currentVideo) {
            for (const selector of VIDEO_ANCESTOR_SELECTORS) {
                const candidate = currentVideo.closest(selector);
                if (candidate && candidate !== document.body && candidate !== document.documentElement) {
                    return candidate;
                }
            }

            if (currentVideo.parentElement) {
                return currentVideo.parentElement;
            }
        }

        for (const selector of VIDEO_CONTAINER_SELECTORS) {
            const candidate = document.querySelector(selector);
            if (candidate) {
                return candidate;
            }
        }

        return null;
    }

    function scoreVideoElement(video) {
        if (!video) return -Infinity;

        const rect = video.getBoundingClientRect();
        const style = getComputedStyle(video);
        const isVisible = style.display !== 'none'
            && style.visibility !== 'hidden'
            && parseFloat(style.opacity || '1') !== 0
            && rect.width >= 160
            && rect.height >= 90;
        const hasSource = Boolean(video.currentSrc || video.src);
        const isLikelyPlayer = video.id === 'player'
            || video.closest('.plyr')
            || video.closest('.player')
            || video.closest('.video-js')
            || video.closest('.jwplayer')
            || video.closest('[class*="video-player"]');
        const isPlaying = !video.paused && !video.ended;

        return (isLikelyPlayer ? 1_000_000 : 0)
            + (isVisible ? 100_000 : 0)
            + (isPlaying ? 10_000 : 0)
            + (hasSource ? 1_000 : 0)
            + Math.round(rect.width * rect.height);
    }

    function injectPlayerBridge() {
        if (document.getElementById(PLAYER_BRIDGE_ID)) return;

        const bridgeScript = document.createElement('script');
        bridgeScript.id = PLAYER_BRIDGE_ID;
        bridgeScript.textContent = `
            (() => {
                const EVENT_NAME = ${JSON.stringify(PLAYER_STATE_EVENT)};
                const STATE_ATTR = ${JSON.stringify(PLAYER_STATE_ATTR)};
                const VIDEO_SELECTORS = ${JSON.stringify(VIDEO_QUERY_SELECTORS)};
                if (window.__MISSAV_PLAYER_BRIDGE__) return;
                window.__MISSAV_PLAYER_BRIDGE__ = true;

                let boundPlayer = null;
                let media = null;
                let rafId = null;
                let rvfcId = null;

                const mediaEvents = ['play', 'playing', 'pause', 'seeking', 'seeked', 'waiting', 'ended', 'loadedmetadata', 'ratechange'];
                const findMediaElement = () => {
                    for (const selector of VIDEO_SELECTORS) {
                        const candidate = document.querySelector(selector);
                        if (candidate instanceof HTMLVideoElement) {
                            return candidate;
                        }
                    }
                    return document.querySelector('video');
                };

                const emit = (reason) => {
                    const currentTime = media && typeof media.currentTime === 'number'
                        ? media.currentTime
                        : boundPlayer && typeof boundPlayer.currentTime === 'number'
                            ? boundPlayer.currentTime
                            : 0;

                    const root = document.documentElement;
                    if (root) {
                        root.setAttribute(STATE_ATTR, JSON.stringify({
                            currentTime,
                            paused: media ? !!media.paused : !(boundPlayer && !boundPlayer.paused),
                            ended: media ? !!media.ended : false,
                            seeking: media ? !!media.seeking : false,
                            reason
                        }));
                    }

                    document.dispatchEvent(new CustomEvent(EVENT_NAME));
                };

                const stopLoop = () => {
                    if (media && typeof media.cancelVideoFrameCallback === 'function' && rvfcId !== null) {
                        try { media.cancelVideoFrameCallback(rvfcId); } catch (error) {}
                    }
                    if (rafId !== null) {
                        cancelAnimationFrame(rafId);
                    }
                    rafId = null;
                    rvfcId = null;
                };

                const frameStep = () => {
                    emit('frame');
                    startLoop();
                };

                const startLoop = () => {
                    stopLoop();
                    if (!media || media.paused || media.ended || document.visibilityState === 'hidden') {
                        return;
                    }

                    if (typeof media.requestVideoFrameCallback === 'function') {
                        rvfcId = media.requestVideoFrameCallback(() => frameStep());
                    } else {
                        rafId = requestAnimationFrame(frameStep);
                    }
                };

                const onMediaEvent = (event) => {
                    emit(event.type);
                    if (event.type === 'pause' || event.type === 'waiting' || event.type === 'ended') {
                        stopLoop();
                        return;
                    }
                    startLoop();
                };

                const cleanupMedia = () => {
                    stopLoop();
                    if (media) {
                        mediaEvents.forEach((eventName) => media.removeEventListener(eventName, onMediaEvent));
                    }
                };

                const bindMedia = (nextMedia, player = null) => {
                    if (!nextMedia) return false;

                    if (boundPlayer === player && media === nextMedia && nextMedia.isConnected) {
                        return true;
                    }

                    cleanupMedia();
                    boundPlayer = player;
                    media = nextMedia;
                    mediaEvents.forEach((eventName) => media.addEventListener(eventName, onMediaEvent, { passive: true }));
                    emit('bind');
                    startLoop();
                    return true;
                };

                const bindPlayer = (player) => {
                    if (!player) return false;
                    const nextMedia = player.media || findMediaElement();
                    return bindMedia(nextMedia, player);
                };

                const getPlayerCandidates = () => {
                    const candidates = [];
                    if (window.player) candidates.push(window.player);
                    if (window.plyr) candidates.push(window.plyr);
                    if (typeof window.videojs === 'function' && typeof window.videojs.getPlayers === 'function') {
                        candidates.push(...Object.values(window.videojs.getPlayers()));
                    }
                    return candidates.filter(Boolean);
                };

                document.addEventListener('visibilitychange', () => {
                    emit('visibilitychange');
                    if (document.visibilityState === 'hidden') {
                        stopLoop();
                    } else {
                        startLoop();
                    }
                });

                setInterval(() => {
                    for (const candidate of getPlayerCandidates()) {
                        if (bindPlayer(candidate)) {
                            return;
                        }
                    }

                    if (bindMedia(findMediaElement())) {
                        return;
                    }

                    if (media && media.isConnected) {
                        emit('poll');
                    }
                }, 1000);
            })();
        `;

        bridgeScript.onload = () => bridgeScript.remove();
        (document.documentElement || document.head || document.body).appendChild(bridgeScript);
    }

    function handlePlayerStateEvent() {
        const detailText = document.documentElement?.getAttribute(PLAYER_STATE_ATTR);
        if (!detailText) return;

        let detail;
        try {
            detail = JSON.parse(detailText);
        } catch (error) {
            console.warn('Missav Script: Failed to parse bridged player state.', error);
            return;
        }

        playerBridgeState = {
            currentTime: Number.isFinite(detail.currentTime) ? detail.currentTime : 0,
            paused: Boolean(detail.paused),
            ended: Boolean(detail.ended),
            seeking: Boolean(detail.seeking),
            reason: typeof detail.reason === 'string' ? detail.reason : ''
        };
        isBridgeActive = true;

        const currentVideo = findVideoElement();
        if (currentVideo) {
            bindVideoElement(currentVideo);
        }

        updateSubtitle();
    }

    function setupPlayerBridge() {
        document.removeEventListener(PLAYER_STATE_EVENT, handlePlayerStateEvent);
        document.addEventListener(PLAYER_STATE_EVENT, handlePlayerStateEvent);
        injectPlayerBridge();
    }

    function getCueConstructor() {
        if (typeof VTTCue !== 'undefined') return VTTCue;
        if (typeof TextTrackCue !== 'undefined') return TextTrackCue;
        return null;
    }

    function setSubtitleText(text) {
        if (!subtitleElement) return;

        const normalizedText = typeof text === 'string' ? text : '';
        if (subtitleElement.textContent !== normalizedText) {
            subtitleElement.textContent = normalizedText;
        }
        subtitleElement.style.display = normalizedText ? 'block' : 'none';
    }

    function handleTrackCueChange() {
        if (!subtitleTrack) {
            setSubtitleText('');
            return;
        }

        const activeText = Array
            .from(subtitleTrack.activeCues || [])
            .map((cue) => cue.text)
            .filter(Boolean)
            .join('\n');

        setSubtitleText(activeText);
    }

    function positionSubtitleList() {
        if (!subtitleList) return;

        const margin = getViewportMargin();
        const gap = FLOATING_UI_GAP;
        const panelVisible = controlPanel && controlPanel.style.display !== 'none';
        const anchorRect = panelVisible
            ? controlPanel.getBoundingClientRect()
            : getBallAnchorRect();

        if (!anchorRect) return;

        subtitleList.style.width = `${Math.min(280, Math.max(220, window.innerWidth - margin * 2))}px`;
        const listWidth = subtitleList.offsetWidth || 280;
        const maxHeight = Math.max(160, window.innerHeight - margin * 2);
        subtitleList.style.maxHeight = `${maxHeight}px`;
        const listHeight = Math.min(subtitleList.scrollHeight, maxHeight);

        let left = anchorRect.left;
        let top = anchorRect.top - listHeight - gap;

        if (panelVisible && window.innerWidth > 640) {
            const spaceRight = window.innerWidth - anchorRect.right - margin;
            const spaceLeft = anchorRect.left - margin;

            if (spaceRight >= listWidth + gap) {
                left = anchorRect.right + gap;
                top = anchorRect.top;
            } else if (spaceLeft >= listWidth + gap) {
                left = anchorRect.left - listWidth - gap;
                top = anchorRect.top;
            }
        }

        left = clamp(left, margin, Math.max(margin, window.innerWidth - listWidth - margin));
        top = clamp(top, margin, Math.max(margin, window.innerHeight - listHeight - margin));

        subtitleList.style.left = `${left}px`;
        subtitleList.style.top = `${top}px`;
        subtitleList.style.right = 'auto';
        subtitleList.style.bottom = 'auto';
    }

    function clearSubtitleTrack() {
        if (!subtitleTrack) return;

        try {
            subtitleTrack.removeEventListener('cuechange', handleTrackCueChange);
            Array.from(subtitleTrack.cues || []).forEach((cue) => {
                try {
                    subtitleTrack.removeCue(cue);
                } catch (error) {
                    console.warn('Missav Script: Failed to remove cue.', error);
                }
            });
        } catch (error) {
            console.warn('Missav Script: Failed to clear subtitle track.', error);
        }

        subtitleTrack = null;
        subtitleTrackOwner = null;
        setSubtitleText('');
    }

    function syncSubtitleTrack() {
        if (!videoElement || !subtitles.length) {
            clearSubtitleTrack();
            return false;
        }

        const CueConstructor = getCueConstructor();
        if (!CueConstructor) {
            console.warn('Missav Script: VTTCue/TextTrackCue is not available, falling back to manual sync.');
            return false;
        }

        if (!subtitleTrack || subtitleTrackOwner !== videoElement) {
            clearSubtitleTrack();
            subtitleTrack = videoElement.addTextTrack('subtitles', 'Missav Subtitle', 'zh');
            subtitleTrack.mode = 'hidden';
            subtitleTrack.addEventListener('cuechange', handleTrackCueChange);
            subtitleTrackOwner = videoElement;
        } else {
            Array.from(subtitleTrack.cues || []).forEach((cue) => {
                try {
                    subtitleTrack.removeCue(cue);
                } catch (error) {
                    console.warn('Missav Script: Failed to reset cue.', error);
                }
            });
        }

        subtitles.forEach((sub) => {
            const startTime = Math.max(0, sub.start);
            const endTime = Math.max(startTime + 0.01, sub.end);
            const cue = new CueConstructor(startTime, endTime, sub.text);
            subtitleTrack.addCue(cue);
        });

        subtitleTrack.mode = 'hidden';
        handleTrackCueChange();
        return true;
    }

    function findVideoElement() {
        const videos = Array.from(document.querySelectorAll('video'));
        if (videos.length === 0) return null;

        return videos
            .sort((left, right) => scoreVideoElement(right) - scoreVideoElement(left))[0] || null;
    }

    function handleVideoTimeUpdate() {
        requestAnimationFrame(updateSubtitle);
    }

    function bindVideoElement(video) {
        if (!video) return false;

        if (videoElement && videoElement !== video) {
            videoElement.removeEventListener('timeupdate', handleVideoTimeUpdate);
            videoElement.removeEventListener('seeking', handleVideoTimeUpdate);
            videoElement.removeEventListener('seeked', handleVideoTimeUpdate);
            videoElement.removeEventListener('loadedmetadata', handleVideoTimeUpdate);
        }

        if (videoElement === video) {
            return true;
        }

        // v1.5.77: 跳過 hover 預覽影片。
        //   missav 列表頁每個卡片都有一個 <video class="preview hidden">，
        //   滑鼠經過就插入 DOM，findVideoElement() 會選中它，
        //   令 bindVideoElement 被反覆呼叫，console 被「非影片頁」+「video bound」洗版。
        //   預覽影片的特徵：
        //     · className 含 "preview"
        //     · data-src 指向 /preview.mp4
        //     · muted + loop + playsinline 但冇 controls
        //   真正播放器的 src 是 blob: 或 .m3u8，不會是 preview.mp4。
        try {
            var cn = String(video.className || "");
            var srcAttr = String(video.getAttribute('data-src') || '');
            var curSrc = String(video.currentSrc || video.src || '');
            if (cn.indexOf('preview') >= 0
                || srcAttr.indexOf('preview.mp4') >= 0
                || curSrc.indexOf('preview.mp4') >= 0) {
                return false;
            }
        } catch (errPrev) {
            // 檢查失敗就照常處理，唔影響主流程
        }

        videoElement = video;
        applyVideoPictureFilter();
        // Auto-fetch subtitle on entering a video page (after a short delay so the
        // video ID / player is ready). Silent when not logged in or quota exhausted.
        const autoId = getCurrentVideoID();
        if (autoId) {
            setTimeout(() => autoTryFetch(autoId), 800);
        }
        videoElement.addEventListener('timeupdate', handleVideoTimeUpdate);
        videoElement.addEventListener('seeking', handleVideoTimeUpdate);
        videoElement.addEventListener('seeked', handleVideoTimeUpdate);
        videoElement.addEventListener('loadedmetadata', handleVideoTimeUpdate);

        // v1.0.1: 綁定播放器後確保字幕元素已掛到這個容器。
        //   之前字幕元素只在 initializeScript() 時嘗試掛一次，
        //   SPA 換頁或 <video> 較晚出現時就永久失效。
        try { tryMountSubtitle(); } catch (eMount) { console.warn('tryMountSubtitle failed:', eMount); }

        // v1.5.77: log 由 console.log 改成 debug 並省略元素內容（原本每次綁定都印整個 DOM 物件）
        console.debug('Missav Script: video bound');
        requestAnimationFrame(updateSubtitle);

        if (!hasShownPlayerReadyToast) {
            hasShownPlayerReadyToast = true;
            showToast(t('player.ready'), 1500);
        }

        return true;
    }

    /** Updates the subtitle element's vertical position style. */
    function updateSubtitlePositionStyle(positionPercent) {
        if (subtitleElement && typeof positionPercent === 'number') {
            // Ensure position is within reasonable bounds (e.g., 0% to 90%)
            const clampedPosition = Math.max(0, Math.min(90, positionPercent));
            subtitleElement.style.bottom = `${clampedPosition}%`;
        }
    }

    function updateSubtitleAppearanceStyle() {
        if (!subtitleElement) return;

        const clampedFontSize = clamp(
            Number.isFinite(subtitleFontSize) ? subtitleFontSize : 26,
            12,
            72
        );
        const normalizedColor = normalizeHexColor(subtitleColor) || '#ffffff';

        subtitleFontSize = clampedFontSize;
        subtitleColor = normalizedColor;
        subtitleElement.style.fontSize = `${clampedFontSize}px`;
        subtitleElement.style.color = normalizedColor;
    }

    /** Applies VLC-style picture adjustments (brightness/contrast/saturation) to the <video>. */
    function applyVideoPictureFilter() {
        if (!videoElement) return;
        // Only apply filter when any value deviates from default (1.0) — avoid touching
        // the site's own video styling when everything is neutral.
        const b = clamp(Number.isFinite(videoBrightness) ? videoBrightness : 1.0, 0.5, 1.5);
        const c = clamp(Number.isFinite(videoContrast) ? videoContrast : 1.0, 0.5, 1.5);
        const s = clamp(Number.isFinite(videoSaturation) ? videoSaturation : 1.0, 0, 2.0);
        videoBrightness = b; videoContrast = c; videoSaturation = s;

        if (Math.abs(b - 1.0) < 0.001 && Math.abs(c - 1.0) < 0.001 && Math.abs(s - 1.0) < 0.001) {
            videoElement.style.filter = '';
            return;
        }
        videoElement.style.filter = `brightness(${b}) contrast(${c}) saturate(${s})`;
    }

    /** Saves picture adjustments to localStorage only.
     *  Not synced to cloud — every video has different tone, user re-adjusts per video. */
    function persistVideoPictureFilter() {
        localStorage.setItem('missavVideoBrightness', videoBrightness);
        localStorage.setItem('missavVideoContrast', videoContrast);
        localStorage.setItem('missavVideoSaturate', videoSaturation);
    }

    /**
     * Creates and appends the main control panel to the page.
     */
    function createControlPanel() {
        if (document.querySelector('.custom-control-panel')) return;

        controlPanel = document.createElement('div');
        controlPanel.className = 'custom-control-panel';

        const createInputGroup = (labelText, inputType, value, onInputHandler, keyName, options = {}) => {
            const group = document.createElement('div');
            group.className = 'input-group';
            const label = document.createElement('label');
            label.textContent = labelText;
            const input = document.createElement('input');
            input.type = inputType;
            input.value = value;
            input.setAttribute('data-key-name', keyName);
            if (inputType === 'number') {
                input.min = options.min ?? ''; // Set min if provided
                input.max = options.max ?? ''; // Set max if provided
                input.step = options.step ?? 'any'; // Set step
            }
            if (inputType === 'color') {
                input.value = normalizeHexColor(value) || '#ffffff';
            }
            input.oninput = onInputHandler;
            group.append(label, input);
            return group;
        };

        // Shortcut Key Inputs
        controlPanel.append(
            createInputGroup(t('label.speedKey'), 'text', shortcutKeys.accelerate, (e) => {
                shortcutKeys.accelerate = e.target.value.toLowerCase();
            }, 'accelerate'),
            createInputGroup(t('label.forwardKey'), 'text', shortcutKeys.forward, (e) => {
                shortcutKeys.forward = e.target.value.toLowerCase();
            }, 'forward'),
            createInputGroup(t('label.backKey'), 'text', shortcutKeys.backward, (e) => {
                shortcutKeys.backward = e.target.value.toLowerCase();
            }, 'backward')
        );

        // Playback & Subtitle Settings Inputs
        controlPanel.append(
            createInputGroup(t('label.speedRate'), 'number', accelerationRate, (e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) accelerationRate = val;
            }, 'accelerationRate', { min: 0.1, step: 0.1 }), // Added min/step
            createInputGroup(t('label.stepSeconds'), 'number', skipTime, (e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) skipTime = val;
            }, 'skipTime', { min: 0.1, step: 0.1 }), // Added min/step
            createInputGroup(t('label.subtitleOffset'), 'number', subtitleOffset, async (e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                    subtitleOffset = val;
                    if (originalSubtitleText) {
                        try {
                            subtitles = await parseSRT(originalSubtitleText);
                            clearSubtitleTrack();
                            updateSubtitle();
                        } catch (error) {
                            showToast(t('status.offsetFailed', {message: error.message}));
                        }
                    }
                }
            }, 'subtitleOffset', { step: 0.1 }), // Added step
             // --- NEW: Subtitle Position Input ---
             createInputGroup(t('label.subtitlePosition'), 'number', subtitleVerticalPositionPercent, (e) => {
                 const val = parseFloat(e.target.value);
                 if (!isNaN(val)) {
                     subtitleVerticalPositionPercent = val;
                     updateSubtitlePositionStyle(subtitleVerticalPositionPercent); // Update style immediately
                 }
             }, 'subtitlePosition', { min: 0, max: 90, step: 1 }), // Added min/max/step
            createInputGroup(t('label.subtitleSize'), 'number', subtitleFontSize, (e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                    subtitleFontSize = clamp(val, 12, 72);
                    updateSubtitleAppearanceStyle();
                }
            }, 'subtitleSize', { min: 12, max: 72, step: 1 }),
            createInputGroup(t('label.subtitleColor'), 'color', subtitleColor, (e) => {
                const nextColor = normalizeHexColor(e.target.value);
                if (nextColor) {
                    subtitleColor = nextColor;
                    updateSubtitleAppearanceStyle();
                }
            }, 'subtitleColor')
        );

        // --- Language Selector (after subtitle color) ---
        const langGroup = document.createElement('div');
        langGroup.className = 'input-group';
        const langLabel = document.createElement('label');
        langLabel.textContent = t('label.subtitleLang');
        const langSelect = document.createElement('select');
        langSelect.className = 'lang-select';
        LANGUAGE_OPTIONS.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = (opt.flag ? opt.flag + ' ' : '') + opt.label;
            if (opt.value === preferredLanguage) option.selected = true;
            langSelect.appendChild(option);
        });
        langSelect.onchange = (e) => {
            const prev = preferredLanguage;
            preferredLanguage = e.target.value;
            localStorage.setItem('missavPreferredLanguage', preferredLanguage);
            // v1.5.57: 語言變了就重算 badge（舊 badge 可能是另一個語言的結果）
            if (prev !== preferredLanguage) {
                setTimeout(refreshAllBadges, 50);
            }
        };
        langGroup.append(langLabel, langSelect);
        controlPanel.appendChild(langGroup);  // Must append first before querySelectorAll

        // --- UI 語言切換器（v1.5.50）---
        const uiLangGroup = document.createElement('div');
        uiLangGroup.className = 'input-group';
        const uiLangLabel = document.createElement('label');
        uiLangLabel.textContent = t('label.uiLang');
        const uiLangSelect = document.createElement('select');
        uiLangSelect.className = 'lang-select';
        const UI_LANG_OPTIONS = [
            { v: 'zh-tw', n: '\u{1F1F9}\u{1F1FC} \u7E41\u9AD4\u4E2D\u6587' },
            { v: 'en',    n: '\u{1F1EC}\u{1F1E7} English' }
        ];
        // 去重（zh-tw 出現兩次，只保留一個）
        const uiSeen = {};
        UI_LANG_OPTIONS.forEach(o => {
            if (uiSeen[o.v]) return;
            uiSeen[o.v] = true;
            const opt = document.createElement('option');
            opt.value = o.v;
            opt.textContent = o.n;
            if (o.v === uiLang) opt.selected = true;
            uiLangSelect.appendChild(opt);
        });
        uiLangSelect.onchange = (e) => {
            setUiLang(e.target.value);
            // 重新載入頁面套用新語言
            location.reload();
        };
        uiLangGroup.append(uiLangLabel, uiLangSelect);
        controlPanel.appendChild(uiLangGroup);
        
        // --- Settings Container (collapsible) — wraps all input rows ---
        const settingsContainer = document.createElement('div');
        settingsContainer.id = 'missav-settings-rows';
        settingsContainer.style.display = 'none';
        // Move the existing shortcut keys + playback inputs + lang select into settingsContainer
        // All input-group elements are currently direct children of controlPanel
        const existingGroups = controlPanel.querySelectorAll(':scope > .input-group');
        existingGroups.forEach(g => settingsContainer.appendChild(g));
        // Also move the two controlPanel.append(...) groups that were already added
        // (the shortcut keys and playback settings)
        controlPanel.appendChild(settingsContainer);

        // --- Buttons ---
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-group';

        const subtitleInput = document.createElement('input');
        subtitleInput.type = 'file';
        subtitleInput.accept = '.srt';
        subtitleInput.style.display = 'none';
        subtitleInput.onchange = handleLocalSubtitleFile;

        const createButton = (text, onClickHandler) => {
            const button = document.createElement('button');
            button.textContent = text;
            button.onclick = onClickHandler;
            return button;
        };

        buttonContainer.append(
            createButton(t('btn.localSubtitle'), () => subtitleInput.click()),
            createButton(t('btn.fetchSubtitle'), handleFetchSubtitle),
            createButton(t('btn.clearSubtitle'), clearSubtitles),
            createButton(t('btn.settings'), toggleSettings),
            createButton(t('btn.report'), showReportModal),
            createButton(t('btn.adjust'), togglePictureAdjust)
        );
        buttonContainer.appendChild(subtitleInput);

        controlPanel.appendChild(buttonContainer);

        // --- Picture Adjust Container (collapsible) v1.5.43 ---
        // 同「設置」一樣內嵌喺面板內，唔用浮動彈窗
        const pictureContainer = document.createElement("div");
        pictureContainer.id = "missav-picture-rows";
        pictureContainer.style.display = "none";
        pictureContainer.style.gridColumn = "1 / -1";
        pictureContainer.style.gap = "6px";
        pictureContainer.style.padding = "6px 0";

        const mkSliderRow = function (labelText, val, minV, maxV, stepV, storeKey) {
            const row = document.createElement("div");
            row.style.display = "grid";
            row.style.gridTemplateColumns = "52px 1fr 40px";
            row.style.alignItems = "center";
            row.style.gap = "6px";

            const lab = document.createElement("span");
            lab.textContent = labelText;
            lab.style.fontSize = "11px";
            lab.style.color = "var(--ms-text-muted)";
            lab.style.whiteSpace = "nowrap";

            const input = document.createElement("input");
            input.type = "range";
            input.min = String(minV);
            input.max = String(maxV);
            input.step = String(stepV);
            input.value = String(val);
            input.className = "pa-slider";
            input.dataset.storeKey = storeKey;

            const num = document.createElement("span");
            num.textContent = Number(val).toFixed(2);
            num.style.fontSize = "11px";
            num.style.color = "var(--ms-accent)";
            num.style.textAlign = "right";
            num.className = "pa-value";

            input.addEventListener("input", function (e) {
                const v = parseFloat(e.target.value);
                num.textContent = v.toFixed(2);
                if (storeKey === "missavVideoBrightness") { videoBrightness = v; }
                if (storeKey === "missavVideoContrast") { videoContrast = v; }
                if (storeKey === "missavVideoSaturate") { videoSaturation = v; }
                applyVideoPictureFilter();
                persistVideoPictureFilter();
            });

            row.appendChild(lab);
            row.appendChild(input);
            row.appendChild(num);
            return row;
        };

        pictureContainer.appendChild(mkSliderRow(t('label.brightness'), videoBrightness, 0.5, 1.5, 0.05, "missavVideoBrightness"));
        pictureContainer.appendChild(mkSliderRow(t('label.contrast'), videoContrast, 0.5, 1.5, 0.05, "missavVideoContrast"));
        pictureContainer.appendChild(mkSliderRow(t('label.saturation'), videoSaturation, 0, 2.0, 0.05, "missavVideoSaturate"));

        // v1.5.78: 熱鍵改動時同步更新滑桿與數值顯示。
        //   之前熱鍵只改 videoBrightness 等變數 + applyVideoPictureFilter()，
        //   但滑桿 UI 停留在舊值，用戶見到「熱鍵改了但滑桿不動」。
        //   把同步函數掛在 controlPanel 上，熱鍵 handler 可以直接叫用，
        //   而且面板未建立時是 undefined，安全跳過。
        controlPanel.syncPictureSliders = function () {
            try {
                var rows = pictureContainer.querySelectorAll(".pa-slider");
                for (var i = 0; i < rows.length; i++) {
                    var key = rows[i].dataset.storeKey;
                    var v = null;
                    if (key === "missavVideoBrightness") v = videoBrightness;
                    else if (key === "missavVideoContrast") v = videoContrast;
                    else if (key === "missavVideoSaturate") v = videoSaturation;
                    if (v === null || v === undefined) continue;
                    var sv = String(v);
                    if (rows[i].value !== sv) rows[i].value = sv;
                }
                var nums = pictureContainer.querySelectorAll(".pa-value");
                if (nums.length === 3) {
                    nums[0].textContent = Number(videoBrightness).toFixed(2);
                    nums[1].textContent = Number(videoContrast).toFixed(2);
                    nums[2].textContent = Number(videoSaturation).toFixed(2);
                }
            } catch (errSync) {
                console.warn("syncPictureSliders failed:", errSync);
            }
        };

        const paReset = document.createElement("button");
        paReset.textContent = t('btn.reset');
        paReset.style.gridColumn = "1 / -1";
        paReset.style.padding = "5px";
        paReset.style.fontSize = "11px";
        paReset.style.fontFamily = "var(--ms-font)";
        paReset.style.background = "var(--ms-bg-elev)";
        paReset.style.color = "var(--ms-text-muted)";
        paReset.style.border = "1px solid var(--ms-line)";
        paReset.style.borderRadius = "var(--ms-radius-sm)";
        paReset.style.cursor = "pointer";
        paReset.style.marginTop = "4px";
        paReset.addEventListener("click", function (evt) {
            evt.preventDefault();
            evt.stopPropagation();
            var savedScroll = controlPanel ? controlPanel.scrollTop : 0;
            videoBrightness = 1.0;
            videoContrast = 1.0;
            videoSaturation = 1.0;
            applyVideoPictureFilter();
            persistVideoPictureFilter();
            // v1.5.78: 改用統一的 syncPictureSliders（保持一致）
            if (controlPanel && controlPanel.syncPictureSliders) controlPanel.syncPictureSliders();
            if (controlPanel) { controlPanel.scrollTop = savedScroll; }
        });
        pictureContainer.appendChild(paReset);

        controlPanel.appendChild(pictureContainer);


        // --- Auth Status Bar ---
        const authBar = document.createElement('div');
        authBar.className = 'auth-status';
        authBar.id = 'missav-auth-status';
        controlPanel.appendChild(authBar);

        // v1.5.63: 面板頂部標題列（app 名稱 + 版本），左邊；✕ 在右邊
        const panelHeader = document.createElement('div');
        panelHeader.className = 'panel-header';
        const appName = document.createElement('span');
        appName.className = 'panel-app-name';
        appName.textContent = t('app.name');
        const appVer = document.createElement('span');
        appVer.className = 'panel-app-version';
        appVer.textContent = 'v' + APP_VERSION;
        panelHeader.appendChild(appName);
        panelHeader.appendChild(appVer);
        // v1.5.65: 用 prepend 放到最前面（appendChild 會排到最後）
        if (controlPanel.firstChild) {
            controlPanel.insertBefore(panelHeader, controlPanel.firstChild);
        } else {
            controlPanel.appendChild(panelHeader);
        }

        // ✕ Close button (top-right corner)
        const closeBtn = document.createElement('button');
        closeBtn.className = 'panel-close-btn';
        closeBtn.textContent = '✕';
        closeBtn.title = t('btn.closePanel');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            hideControlPanel();
        });
        controlPanel.appendChild(closeBtn);

        document.body.appendChild(controlPanel);
        updateAuthStatusBar();
    }

    /**
     * Creates the initially hidden button to show the control panel.
     */
    function createShowControlsButton() {
        if (showControlsButton) return;

        showControlsButton = document.createElement('button');
        showControlsButton.className = 'show-controls-button';
        showControlsButton.textContent = t('badge.subtitle');
        showControlsButton.style.display = 'flex';
        showControlsButton.addEventListener('pointerdown', handleFloatingButtonPointerDown);
        showControlsButton.addEventListener('click', handleFloatingButtonClick);
        document.body.appendChild(showControlsButton);
        applyFloatingButtonPosition();
    }

    /** Hides the main control panel and shows the 'Show Controls' button. */
    function hideControlPanel() {
        if (controlPanel) controlPanel.style.display = 'none';
        if (showControlsButton) showControlsButton.style.display = 'flex';
        if (subtitleList) subtitleList.style.display = 'none';
        document.removeEventListener('keydown', handlePanelEscape);
        document.removeEventListener('click', handleClickOutsidePanel, true);
    }

    /** Shows the main control panel and hides the 'Show Controls' button. */
    function showControlPanel() {
        if (controlPanel) controlPanel.style.display = 'grid';
        positionControlPanel();
        if (showControlsButton) showControlsButton.style.display = 'none';
        // v1.5.40: 開面板時再確認一次 Founder 補領（有 cooldown，不會頻繁打）
        autoClaimFounder(false);
        if (subtitleList) {
            subtitleList.style.display = 'block';
            positionSubtitleList();
        }
        document.addEventListener('keydown', handlePanelEscape);
        // Add click outside listener (delay to avoid catching the toggle click)
        setTimeout(() => {
            document.addEventListener('click', handleClickOutsidePanel, true);
        }, 100);
    }

    /** ESC key handler for panel: hides panel when ESC is pressed */
    function handlePanelEscape(e) {
        if (e.key === 'Escape' && controlPanel && controlPanel.style.display !== 'none') {
            hideControlPanel();
        }
    }

    /** Click outside panel handler: hides panel when clicking outside */
    function handleClickOutsidePanel(e) {
        if (!controlPanel || controlPanel.style.display === 'none') return;
        // Don't close if clicking inside the panel
        if (controlPanel.contains(e.target)) return;
        // Don't close if clicking the floating button
        if (showControlsButton && showControlsButton.contains(e.target)) return;
        // Don't close if clicking subtitle list
        if (subtitleList && subtitleList.contains(e.target)) return;
        // Don't close if clicking auth modal
        if (e.target.closest('.auth-overlay')) return;
        
        hideControlPanel();
    }

    /** Toggle settings rows visibility */
    function toggleSettings() {
        const container = document.getElementById('missav-settings-rows');
        if (!container) return;
        
        const isHidden = container.style.display === 'none' || container.style.display === '';
        
        if (isHidden) {
            container.style.display = 'grid';
            container.style.gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
            container.style.gap = '8px 10px';
            container.style.alignItems = 'end';
            container.style.padding = '6px 0';
            container.style.gridColumn = '1 / -1';
            container.style.width = '100%';
            
            // Ensure all child .input-group have correct styling
            container.querySelectorAll(':scope > .input-group').forEach(el => {
                el.style.display = 'grid';
                el.style.gridTemplateColumns = 'minmax(0, 1fr) 56px';
                el.style.alignItems = 'center';
                el.style.gap = '6px';
                el.style.minWidth = '0';
            });
            
            // Increase panel max-height to fit settings
            if (controlPanel) {
                controlPanel.style.maxHeight = 'min(560px, calc(100vh - 80px))';
                // Allow panel to grow upward from its current position
                controlPanel.style.bottom = 'auto';
            }
            
            // Reposition panel to ensure it's fully visible
            positionControlPanel();
            
            // Add save button below settings
            // v1.5.45: 先移除所有舊的「保存設置」按鈕（之前 querySelector 只移除一個，多次展開會累積）
            const oldBtns = container.querySelectorAll('.settings-save-btn');
            for (let bi = 0; bi < oldBtns.length; bi++) { oldBtns[bi].remove(); }
            const saveBtn = document.createElement('button');
            saveBtn.className = 'full-width settings-save-btn';
            saveBtn.textContent = t('btn.saveSettings');
            saveBtn.onclick = saveSettings;
            container.appendChild(saveBtn);
        } else {
            container.style.display = 'none';
            // Remove save button
            const saveBtns = container.querySelectorAll('.settings-save-btn');
            for (let sj = 0; sj < saveBtns.length; sj++) { saveBtns[sj].remove(); }
        }
    }

    /**
     * v1.5.43: 畫面調節面板開關
     * 同「設置」一樣內嵌喺面板內（唔用浮動彈窗），解決：
     *   1. 手機 / iOS Safari 冇鍵盤快捷鍵（w/e/r/t/y/u）
     *   2. 浮動彈窗定位錯亂
     */
    function togglePictureAdjust() {
        const container = document.getElementById("missav-picture-rows");
        if (!container) return;

        const isHidden = container.style.display === "none" || container.style.display === "";

        if (isHidden) {
            container.style.display = "grid";
            container.style.gridColumn = "1 / -1";
            container.style.width = "100%";
            // 收起設置（避免兩個都開）
            const settingsEl = document.getElementById("missav-settings-rows");
            if (settingsEl) settingsEl.style.display = "none";
        } else {
            container.style.display = "none";
        }
    }

    /**
     * v1.5.42: 畫面調節面板
     * 解決 iOS Safari / 手機冇鍵盤快捷鍵（w/e/r/t/y/u）嘅問題。
     * 提供 3 個滑桿：亮度 / 對比度 / 飽和度。
     */
    let pictureAdjustPanel = null;


    /** Sets up the subtitle display element and attaches it to the video container. */
    // v1.0.1: 字幕元素只建立一次，掛載可重試。
    //   原本 setupSubtitleDisplay() 會建立 subtitleElement 並啟動 setInterval 找容器，
    //   30 秒後若仍未找到就 clearInterval 放棄。但 AV01 是 SPA，<video> 常在腳本
    //   初始化之後才真正掛進 DOM（src 一開始是 blob: 或空），於是永遠掛不上字幕，
    //   實測 https://www.av01.media/hk/video/208097/mngs-060 就是這個情況：
    //   面板正常、片號解析正確、容器存在，但 .custom-subtitle 完全不存在。
    //   改成：只建元素（ensureSubtitleElement），掛載交給 tryMountSubtitle 反覆重試，
    //   並由 bindVideoElement / MutationObserver 呼叫，不再有 30 秒死線。
    function ensureSubtitleElement() {
        if (subtitleElement) return subtitleElement;
        subtitleElement = document.createElement('div');
        subtitleElement.className = 'custom-subtitle';
        subtitleElement.style.display = 'none'; // Hide initially
        updateSubtitlePositionStyle(subtitleVerticalPositionPercent);
        updateSubtitleAppearanceStyle();
        return subtitleElement;
    }

    // 嘗試把字幕元素掛到正確的播放器容器。成功回傳 true。
    var subtitleMountTimer = null;
    var subtitleMountAttempts = 0;

    function tryMountSubtitle() {
        var el = ensureSubtitleElement();
        var container = findVideoContainer();

        if (container) {
            // 已經掛在正確容器就唔重複做
            if (el.parentElement === container) {
                if (subtitleMountTimer) {
                    clearInterval(subtitleMountTimer);
                    subtitleMountTimer = null;
                }
                return true;
            }

            // 掛在不對的地方（例如舊的預覽容器）先拔走
            if (el.parentElement) {
                try { el.parentElement.removeChild(el); } catch (eRm) {}
            }

            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
            container.appendChild(el);

            if (subtitleMountTimer) {
                clearInterval(subtitleMountTimer);
                subtitleMountTimer = null;
            }
            console.log('Missav Script: subtitle mounted into', container.className || container.tagName);
            subtitleMountAttempts = 0;

            // 掛好之後立刻刷新一次目前字幕（否則要等下一次 timeupdate）
            try { updateSubtitle(); } catch (eUpd) {}
            return true;
        }

        return false;
    }

    // 啟動重試：每 500ms 試一次，最多 120 次（60 秒）。
    // 之後仍然失敗就只記錄，不再彈 toast（AV01 有時影片很慢才出現）。
    function startSubtitleMountRetry() {
        ensureSubtitleElement();
        if (tryMountSubtitle()) return;

        if (subtitleMountTimer) return; // 已在重試中
        subtitleMountAttempts = 0;

        subtitleMountTimer = setInterval(function () {
            subtitleMountAttempts++;
            if (tryMountSubtitle()) return;

            if (subtitleMountAttempts >= 120) {
                clearInterval(subtitleMountTimer);
                subtitleMountTimer = null;
                console.warn('Missav Script: 字幕容器在 60 秒內未出現，停止重試（播放器出現時會再嘗試）');
            }
        }, 500);
    }

    // 保留舊名稱（初始化流程與其他呼叫點都用它）
    function setupSubtitleDisplay() {
        startSubtitleMountRetry();
    }

    /** Handles the selection of a local SRT file. */
    async function handleLocalSubtitleFile(event) {
        const file = event.target.files[0];
        if (!file) return;
        event.target.value = null; // Reset input

        try {
            const text = await file.text();
            originalSubtitleText = text;
            subtitles = await parseSRT(text);
            clearSubtitleTrack();
            if (subtitleList) closeSubtitleList(); // Close search results if open
            showToast(t('status.loaded'));
        } catch (error) {
            console.error("Subtitle load error:", error);
            showToast(t('status.loadFailed', {message: error.message}));
            clearSubtitles();
        }
    }

    // ─── PocketBase Auth & Fetch Functions ─────────────────────────────────

    /** Get auth headers for PocketBase API calls */
    function pbHeaders(contentType) {
        const headers = {};
        if (contentType) {
            headers['Content-Type'] = contentType;
        }
        if (pbAuthToken) {
            headers['Authorization'] = pbAuthToken;
        }
        return headers;
    }

    /** Update the auth status bar in the control panel */
    function updateAuthStatusBar() {
        const bar = document.getElementById('missav-auth-status');
        if (!bar) return;

        // Clear existing content and listeners
        bar.innerHTML = '';
        bar.className = 'auth-status';

        if (pbAuthToken && pbUser) {
            const planLabel = effectivePlanLabel();
            const limit = currentQuotaLimit();
            bar.className = 'auth-status logged-in';

            // v1.5.39: 拆成兩行 —— email 長時「登出」會被擠到第二行斷開字
            // info 一行（可省略號截斷），actions 另一行
            // v1.5.55: 拆成三行 —— email 一行、配額一行、actions 一行
            // （之前 email + 配額塞同一行，長 email 會用 ellipsis 遮住配額）
            const emailRow = document.createElement('div');
            emailRow.className = 'auth-info';
            emailRow.textContent = pbUser.email || pbUser.username || 'User';
            emailRow.title = pbUser.email || pbUser.username || '';
            bar.appendChild(emailRow);

            const quotaRow = document.createElement('div');
            quotaRow.className = 'auth-quota';
            quotaRow.textContent = '(' + planLabel + ') | ' + t('status.today') + ' ' + todayFetchCount + '/' + limit;
            bar.appendChild(quotaRow);

            const actionRow = document.createElement('div');
            actionRow.className = 'auth-actions';
            bar.appendChild(actionRow);

            // 升級會員 / 續期 link — offers all paid users (free upgrade, member renew/upgrade)
            const upgradeLink = document.createElement('span');
            upgradeLink.className = 'auth-action upgrade-link';
            upgradeLink.textContent = t('btn.upgrade');
            upgradeLink.addEventListener('click', showUpgradeModal);
            upgradeLink.style.cursor = 'pointer';
            actionRow.appendChild(upgradeLink);

            const logoutLink = document.createElement('span');
            logoutLink.className = 'auth-action';
            logoutLink.textContent = t('btn.logout');
            logoutLink.addEventListener('click', logoutAndRefresh);
            actionRow.appendChild(logoutLink);
        } else {
            const loginLink = document.createElement('span');
            loginLink.className = 'auth-action';
            loginLink.textContent = t('btn.loginRegister');
            loginLink.addEventListener('click', showAuthModal);
            bar.appendChild(loginLink);
        }
    }

    /** Show membership/upgrade modal — pick plan, opens LSn checkout carrying user_id. */
    function showUpgradeModal() {
        const existing = document.querySelector('.auth-overlay');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'auth-overlay';
        overlay.innerHTML = `
            <div class="auth-modal">
                <div class="auth-modal-wrapper">
                    <h3>${t('upgrade.title')}</h3>
                    <p style="font-size:12px;color:#c9b3bd;margin:0 0 12px;line-height:1.5">
                        ${t('upgrade.betaLine')}<br>
                        <span style="color:#f0a020">${t('upgrade.emailHint')} <strong>${pbUser && pbUser.email ? pbUser.email : ''}</strong></span>
                    </p>
                    ${getPlans().map(p => `
                        <button class="auth-btn ${p.enabled ? 'plan-enabled' : 'plan-disabled'}"
                                data-variant="${p.variant}"
                                data-enabled="${p.enabled ? '1' : '0'}"
                                ${p.enabled ? '' : 'aria-disabled="true"'}>
                            <span class="plan-label">${p.label}</span>
                            <span class="plan-price">${p.price}</span>
                        </button>
                    `).join('')}
                    <div class="auth-toggle">
                        <span id="upgrade-cancel" style="cursor:pointer;color:#8af">${t('btn.cancel')}</span>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        overlay.querySelector('#upgrade-cancel').addEventListener('click', () => overlay.remove());

        overlay.querySelectorAll('[data-variant]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const variant = btn.getAttribute('data-variant');
                const enabled = btn.getAttribute('data-enabled') === '1';

                // 未登入一律要先登入（webhook 靠 email 比對，冇帳號開通唔到）
                if (!pbAuthToken || !pbUser || !pbUser.id) {
                    showToast(t('err.mustLoginUpgrade'));
                    return;
                }

                // v1.5.40: 劃線方案（即將加價）唔可以買，只提示
                if (!enabled) {
                    showToast(t('upgrade.betaOnly'), 5000);
                    return;
                }

                // v1.5.40: 先彈確認框顯示 email，用戶確認後才開 BMC
                const checkoutUrl = buildCheckoutUrl(variant);
                if (!checkoutUrl) { showToast(t('upgrade.notOpen'), 4000); return; }
                showFounderConfirm(checkoutUrl);
            });
        });
    }

    /**
     * v1.5.40: Founder 付款前的確認框。
     *
     * 目的：BMC 付款頁有自己的 Email 欄，而 URL 不能帶 ?email=（實測會令
     * Stripe 表單永遠卡在 loading）。所以必須在跳出之前把用戶的登入電郵
     * 大字顯示出來，讓他自己複製去貼，避免填錯令 webhook 對不上帳號。
     */
    function showFounderConfirm(checkoutUrl) {
        const existing = document.querySelector('.auth-overlay');
        if (existing) existing.remove();

        const email = (pbUser && pbUser.email) ? pbUser.email : t('upgrade.notAvailable');
        const overlay = document.createElement('div');
        overlay.className = 'auth-overlay';
        overlay.innerHTML = `
            <div class="auth-modal">
                <div class="auth-modal-wrapper">
                    <h3>${t('founder.title')}</h3>
                    <p style="font-size:13px;color:#c9b3bd;margin:0 0 10px;line-height:1.6">
                        ${t('founder.bodyBefore')} <strong style="color:#ECEFF4">${t('founder.bodyEmphasis')}</strong> ${t('founder.bodyAfter')}
                    </p>
                    <div class="founder-email-box">
                        <span id="founder-email-text">${email}</span>
                        <button type="button" class="founder-copy-btn" id="founder-copy-btn">${t('btn.copy')}</button>
                    </div>
                    <p style="font-size:11px;color:#e5484d;margin:8px 0 12px;line-height:1.5">
                        ${t('founder.warning')}
                    </p>
                    <button class="auth-btn plan-enabled" id="founder-go">${t('founder.goPay')}</button>
                    <div class="auth-toggle">
                        <span id="founder-cancel" style="cursor:pointer;color:#8af">取消</span>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        // 點背景關閉
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        overlay.querySelector('#founder-cancel').addEventListener('click', () => overlay.remove());

        // 複製按鈕
        const copyBtn = overlay.querySelector('#founder-copy-btn');
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(email);
                copyBtn.textContent = t('status.copied');
                setTimeout(() => { copyBtn.textContent = t('btn.copy'); }, 1500);
            } catch (e) {
                // 退路：選取文字讓用戶手動複製
                const range = document.createRange();
                range.selectNodeContents(overlay.querySelector('#founder-email-text'));
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
                showToast(t('status.selectToCopy'), 4000);
            }
        });

        // 前往付款
        overlay.querySelector('#founder-go').addEventListener('click', () => {
            openInNewTab(checkoutUrl);
            overlay.remove();
            showToast(t('upgrade.afterPay'), 8000);
        });
    }

    /** Show login/register modal */
    function showAuthModal() {
        const existing = document.querySelector('.auth-overlay');
        if (existing) existing.remove();

        let isLogin = true;
        let errorMsg = '';

        const overlay = document.createElement('div');
        overlay.className = 'auth-overlay';

        const renderModal = () => {
            overlay.innerHTML = `
                <div class="auth-modal">
                    <div class="auth-modal-wrapper">
                        <h3>${isLogin ? t('btn.login') : t('btn.register')}</h3>
                        ${errorMsg ? `<div class="auth-error">${errorMsg}</div>` : ''}
                        <input type="email" id="auth-email" placeholder="Email" />
                        <div class="auth-pw-wrap">
                            <input type="password" id="auth-password" placeholder="${t('label.password')}" />
                            <button type="button" class="auth-eye-btn" id="auth-eye-1" tabindex="-1">👁</button>
                        </div>
                        <div class="auth-pw-wrap" id="auth-confirm-wrap" style="${isLogin ? 'display:none' : ''}">
                            <input type="password" id="auth-confirm" placeholder="${t('label.confirmPassword')}" />
                            <button type="button" class="auth-eye-btn" id="auth-eye-2" tabindex="-1">👁</button>
                        </div>
                        <button class="auth-btn" id="auth-submit-btn">${isLogin ? t('btn.login') : t('btn.register')}</button>
                        <div class="auth-toggle">
                            ${isLogin ? t('auth.noAccount', {register: '<span id="auth-toggle-link">' + t('auth.registerLink') + '</span>'}) : t('auth.hasAccount', {login: '<span id="auth-toggle-link">' + t('auth.loginLink') + '</span>'})}
                        </div>
                    </div>
                </div>
            `;

            overlay.querySelector('#auth-submit-btn').onclick = async () => {
                const email = overlay.querySelector('#auth-email').value.trim();
                const password = overlay.querySelector('#auth-password').value;

                if (!email || !password) {
                    errorMsg = t('err.needEmailPassword');
                    renderModal();
                    return;
                }

                if (!isLogin) {
                    const confirm = overlay.querySelector('#auth-confirm').value;
                    if (password !== confirm) {
                        errorMsg = t('err.passwordMismatch');
                        renderModal();
                        return;
                    }
                    if (password.length < 8) {
                        errorMsg = t('err.passwordTooShort');
                        renderModal();
                        return;
                    }
                }

                errorMsg = '';
                overlay.querySelector('#auth-submit-btn').disabled = true;
                overlay.querySelector('#auth-submit-btn').textContent = t('status.processing');

                try {
                    if (isLogin) {
                        await pbLogin(email, password);
                    } else {
                        await pbRegister(email, password);
                    }
                    overlay.remove();
                    updateAuthStatusBar();
                    showToast(isLogin ? t('status.loggedIn') : t('status.registered'));
                } catch (err) {
                    errorMsg = err.message;
                    renderModal();
                }
            };

            overlay.querySelector('#auth-toggle-link').onclick = () => {
                isLogin = !isLogin;
                errorMsg = '';
                renderModal();
            };

            // Password visibility toggle
            const addEyeToggle = (btnId, inputId) => {
                const btn = overlay.querySelector(btnId);
                const input = overlay.querySelector(inputId);
                if (!btn || !input) return;
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const showing = input.type === 'text';
                    input.type = showing ? 'password' : 'text';
                    btn.textContent = showing ? '👁' : '🚫';
                });
            };
            addEyeToggle('#auth-eye-1', '#auth-password');
            addEyeToggle('#auth-eye-2', '#auth-confirm');
        };

        renderModal();
        document.body.appendChild(overlay);

        // Close on click outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    /** Login to PocketBase */
    async function pbLogin(email, password) {
        const resp = await gmRequest({
            method: 'POST',
            url: `${PB_URL}/api/collections/${PB_USERS_COLLECTION}/auth-with-password`,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({ identity: email, password }),
            timeout: 15000
        });

        if (resp.status < 200 || resp.status >= 300) {
            try {
                const err = JSON.parse(resp.responseText);
                throw new Error(err.message || t('err.loginFailed'));
            } catch (e) {
                if (e.message && e.message !== t('err.loginFailed')) throw e;
                throw new Error(t('err.loginFailed'));
            }
        }

        const data = JSON.parse(resp.responseText);
        pbAuthToken = data.token;
        localStorage.setItem('missavPbAuthToken', pbAuthToken);
        // v1.5.34: 用 applyUserRecord() 一次過寫 pbUser / pbUserPlan / paid_until / localStorage
        applyUserRecord(data.record);
        // Sync quota from server
        syncQuotaFromServer();
    }

    /** Register to PocketBase */
    async function pbRegister(email, password) {
        const resp = await gmRequest({
            method: 'POST',
            url: `${PB_URL}/api/collections/${PB_USERS_COLLECTION}/records`,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify({
                email,
                password,
                passwordConfirm: password,
                plan: 'free',
                status: 'active'
            }),
            timeout: 15000
        });

        if (resp.status < 200 || resp.status >= 300) {
            try {
                const err = JSON.parse(resp.responseText);
                throw new Error(err.message || t('err.registerFailed'));
            } catch (e) {
                if (e.message && e.message !== t('err.registerFailed')) throw e;
                throw new Error(t('err.registerFailed'));
            }
        }

        // Auto login after register
        await pbLogin(email, password);
    }

    /** 清除本機登入狀態（auth token 已失效時用），唔會出 toast */
    function clearStaleAuth() {
        pbAuthToken = null;
        pbUser = null;
        pbUserPlan = 'free';
        try {
            localStorage.removeItem('missavPbAuthToken');
            localStorage.removeItem('missavPbUser');
        } catch (e) {}
    }

    /** 由 PB 記錄套用 plan / paid_until（auth-refresh、login、refresh 共用），永遠裝埋 paid_until 落 pbUser */
    function applyUserRecord(record) {
        if (!record) return null;
        pbUser = { ...(pbUser || {}), ...record };
        pbUser.paid_until = record.paid_until || '';
        pbUserPlan = record.plan || 'free';
        try {
            localStorage.setItem('missavPbUser', JSON.stringify({
                id: record.id,
                email: record.email,
                plan: pbUserPlan,
                paid_until: pbUser.paid_until
            }));
        } catch (e) {}
        return pbUser;
    }

    /**
     * 確保 pbUserPlan / pbUser.paid_until 係最新（v1.5.34）。
     * 背景：PB auth token 會過期。以前 restoreAuth() 只讀 localStorage 舊快照，
     * 然後 syncQuotaFromServer() 一 401 就靜靜 return —— pbUserPlan 永遠卡死喺
     * localStorage 嘅舊值（例如 'free'），明明係終身會員都會被 access_level 攔住。
     * 而家：401 → 清除死 token；網絡出錯 → 保留舊值；成功 → 用伺服器 plan/paid_until。
     * @returns {Promise<boolean>} true = pbUserPlan 同 paid_until 可信
     */
    /**
     * v1.5.40: Founder 自動補領。
     *
     * 背景：BMC 付款頁有自己的 Email 欄，用戶可能填的電郵與 missav helper
     * 註冊電郵不同，導致 webhook 找不到對應帳號、granted_at 一直為空。
     * 這裡在每次載入或開面板時主動打 PB /api/founder-claim，由伺服器驗證：
     *   - user_id 存在
     *   - users.email 與請求的 email 一致
     *   - tip_accumulator 累計 >= 30
     * 伺服器才是唯一有權寫 plan / paid_until 的一方 —— 前端不改任何 plan。
     */
    let founderClaimInFlight = false;
    let founderClaimLastTs = 0;
    const FOUNDER_CLAIM_COOLDOWN_MS = 10 * 60 * 1000;   // 10 分鐘內不重複問

    async function autoClaimFounder(force) {
        if (!pbAuthToken || !pbUser || !pbUser.email) return;
        if (founderClaimInFlight) return;
        // 已經是會員就不用問
        if (isMemberActive()) return;
        const now = Date.now();
        if (!force && now - founderClaimLastTs < FOUNDER_CLAIM_COOLDOWN_MS) return;

        founderClaimInFlight = true;
        founderClaimLastTs = now;
        try {
            const resp = await gmRequest({
                method: 'POST',
                url: BMC_CLAIM_URL,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ user_id: pbUser.id, email: pbUser.email }),
                timeout: 10000
            });
            if (resp.status < 200 || resp.status >= 300) return;
            let r;
            try { r = JSON.parse(resp.responseText || '{}'); } catch (e) { return; }
            if (!r || !r.ok) return;

            if (r.granted) {
                showToast(t('status.founderGranted'), 4000);
                await refreshMembership();
                setTimeout(() => location.reload(), 1200);
            } else if (r.reason === 'below threshold' && r.total > 0) {
                // 有付款記錄但未夠 —— 提示進度（不重複騷擾：只在 force 時提示）
                if (force) {
                    showToast(`${t('upgrade.accumulated', {total: r.total.toFixed(2), remaining: (r.threshold - r.total).toFixed(2)})}`, 5000);
                }
            } else if (force && r.reason === 'no record') {
                showToast(t('upgrade.noRecord'), 6000);
            }
        } catch (e) {
            // 靜默失敗：網絡問題不應打斷使用
            console.debug('autoClaimFounder:', e && e.message);
        } finally {
            founderClaimInFlight = false;
        }
    }

    async function refreshMembership() {
        if (!pbAuthToken || !pbUser?.id) return false;
        try {
            const resp = await gmRequest({
                method: 'POST',
                url: `${PB_URL}/api/collections/${PB_USERS_COLLECTION}/auth-refresh`,
                headers: { 'Authorization': pbAuthToken },
                timeout: 10000
            });
            if (resp.status === 401 || resp.status === 403 || resp.status === 404) {
                // token 已失效（或者帳號已刪）—— 用死 token 只會不停 401，直接登出
                clearStaleAuth();
                updateAuthStatusBar();
                return false;
            }
            if (resp.status < 200 || resp.status >= 300) return false;
            const data = JSON.parse(resp.responseText);
            if (data.token) {
                pbAuthToken = data.token;
                localStorage.setItem('missavPbAuthToken', pbAuthToken);
            }
            if (data.record) {
                applyUserRecord(data.record);
                todayFetchCount = data.record.downloads_today || 0;
            }
            updateAuthStatusBar();
            return true;
        } catch (e) {
            // 網絡問題 / 超時 —— 唔可以當成「會員過期」，保留本機舊值
            console.log('refreshMembership failed (network):', e.message);
            return false;
        }
    }

    /** 同步今日配額同會員狀態（page load / login 後）。失敗時唔會靜靜卡死。 */
    async function syncQuotaFromServer() {
        if (!pbAuthToken || !pbUser?.id) {
            console.log('syncQuota: skipped, no auth token or user');
            return;
        }
        // Check if it's a new day — reset local counter
        const today = new Date().toDateString();
        const lastDate = localStorage.getItem('missavLastFetchDate');
        if (lastDate !== today) {
            todayFetchCount = 0;
            localStorage.setItem('missavLastFetchDate', today);
            // Don't PATCH server — server downloads_today reset by external cron script
        }
        try {
            // v1.5.34: 統一用 refreshMembership() —— 401 會清死 token，唔會靜靜卡死喺舊 plan
            const ok = await refreshMembership();
            if (!ok) {
                console.log('syncQuota: 會員狀態未能確認（token 失效或網絡問題）');
                return;
            }
            console.log('syncQuota: refreshed', todayFetchCount, pbUserPlan);

            // Also sync settings from cloud to local
            syncSettingsFromCloud();
        } catch (e) {
            console.log('syncQuota error:', e);
        }
    }

    /** Sync settings from PocketBase cloud to localStorage */
    function syncSettingsFromCloud() {
        if (!pbAuthToken || !pbUser?.id) return;
        
        gmRequest({
            method: 'GET',
            url: `${PB_URL}/api/collections/missav_settings/records?filter=${encodeURIComponent(`(user="${pbUser.id}")`)}&perPage=1`,
            headers: { 'Authorization': pbAuthToken },
            timeout: 8000,
            onload: (resp) => {
                try {
                    if (resp.status < 200 || resp.status >= 300) return;
                    const data = JSON.parse(resp.responseText);
                    if (!data.items || data.items.length === 0) return;
                    const s = data.items[0];
                    
                    // Apply cloud settings to localStorage
                    if (s.accelerationRate != null) { accelerationRate = s.accelerationRate; localStorage.setItem('missavAccelerationRate', s.accelerationRate); }
                    if (s.skipTime != null) { skipTime = s.skipTime; localStorage.setItem('missavSkipTime', s.skipTime); }
                    if (s.subtitleOffset != null) { subtitleOffset = s.subtitleOffset; localStorage.setItem('missavSubtitleOffset', s.subtitleOffset); }
                    if (s.subtitlePosition != null) { subtitleVerticalPositionPercent = s.subtitlePosition; localStorage.setItem('missavSubtitlePosition', s.subtitlePosition); }
                    if (s.subtitleFontSize != null) { subtitleFontSize = s.subtitleFontSize; localStorage.setItem('missavSubtitleSize', s.subtitleFontSize); }
                    if (s.subtitleColor) { subtitleColor = s.subtitleColor; localStorage.setItem('missavSubtitleColor', s.subtitleColor); }
                    if (s.accelerateKey) { shortcutKeys.accelerate = s.accelerateKey; localStorage.setItem('missavAccelerateKey', s.accelerateKey); }
                    if (s.forwardKey) { shortcutKeys.forward = s.forwardKey; localStorage.setItem('missavForwardKey', s.forwardKey); }
                    if (s.backwardKey) { shortcutKeys.backward = s.backwardKey; localStorage.setItem('missavBackwardKey', s.backwardKey); }
                    // v1.5.58: 唔再從雲端同步字幕語言。
                    //   原因：syncSettingsFromCloud 係異步的，會在頁面載入後
                    //   才回來並「靜默覆蓋」preferredLanguage，導致：
                    //     - badge 用本地語言查完，之後被雲端舊值覆蓋
                    //     - 用戶切換語言後 F5，badge 顏色與面板顯示不一致
                    //   語言屬於裝置偏好（手機同電腦可以唔同），純 localStorage 更合理。
                    //   雲端仍會寫入該欄位（saveSettings 會送），只係唔再讀回來覆蓋。
                    
                    console.log('syncSettings: applied cloud settings');
                } catch (e) {
                    console.log('syncSettings error:', e);
                }
            }
        });
    }

    /** Logout */
    function logoutAndRefresh() {
        pbAuthToken = null;
        pbUser = null;
        pbUserPlan = 'free';
        localStorage.removeItem('missavPbAuthToken');
        localStorage.removeItem('missavPbUser');
        updateAuthStatusBar();
        showToast(t('status.loggedOut'));
    }

    /** Report types for dropdown */
    const REPORT_TYPES = [
        { value: 'request_subtitle', label: t('report.requestSubtitle') },
        { value: 'wrong_text', label: t('report.wrongText') },
        { value: 'inaccurate_translation', label: t('report.inaccurate') },
        { value: 'timing_out_of_sync', label: t('report.timingOutOfSync') },
        { value: 'poor_quality', label: t('report.poorQuality') },
        { value: 'audio_subtitle_mismatch', label: t('report.audioMismatch') },
        { value: 'other', label: t('report.other') }
    ];

    /** Show report/request modal */
    function showReportModal() {
        if (!pbAuthToken) {
            showToast(t('err.mustLogin'));
            return;
        }
        
        const existing = document.querySelector('.report-overlay');
        if (existing) existing.remove();
        
        const videoId = getCurrentVideoID() || t('report.unknown');
        let selectedType = 'request_subtitle';
        let errorMsg = '';
        
        const overlay = document.createElement('div');
        overlay.className = 'auth-overlay report-overlay';
        
        const render = () => {
            overlay.innerHTML = `
                <div class="auth-modal">
                    <div class="auth-modal-wrapper">
                        <h3>${t('report.title')}</h3>
                        ${errorMsg ? `<div class="auth-error">${errorMsg}</div>` : ''}
                        <div style="margin-bottom:10px;font-size:12px;color:rgba(232,232,232,0.6);">
                            ${t('report.videoCode')}: <strong>${videoId}</strong>
                            <span style="margin-left:10px;">${t('report.version')}: <strong>${APP_VERSION}</strong></span>
                        </div>
                        <select id="report-type" style="width:100%;box-sizing:border-box;padding:10px 12px;margin-bottom:10px;border:1px solid var(--ms-line-strong);border-radius:6px;background:#24151c;color:#ECEFF4;font-size:14px;font-family:inherit;">
                            ${REPORT_TYPES.map(t => `<option value="${t.value}" ${t.value === selectedType ? 'selected' : ''} style="background:#24151c;color:#ECEFF4;">${t.label}</option>`).join('')}
                        </select>
                        <textarea id="report-comment" placeholder="${t('label.detailOptional')}" class="report-textarea" style="width:100%;box-sizing:border-box;padding:10px 12px;margin-bottom:10px;border:1px solid var(--ms-line-strong);border-radius:6px;background:#24151c;color:#ECEFF4;font-size:14px;min-height:80px;font-family:inherit;resize:vertical;"></textarea>
                        <button class="auth-btn" id="report-submit-btn">${t('btn.submit')}</button>
                        <div class="auth-toggle">
                            <span id="report-close-link">${t('btn.cancel')}</span>
                        </div>
                    </div>
                </div>
            `;
            
            overlay.querySelector('#report-type').onchange = (e) => { selectedType = e.target.value; };
            overlay.querySelector('#report-close-link').onclick = () => overlay.remove();
            
            overlay.querySelector('#report-submit-btn').onclick = async () => {
                const comment = overlay.querySelector('#report-comment').value.trim();
                
                overlay.querySelector('#report-submit-btn').disabled = true;
                overlay.querySelector('#report-submit-btn').textContent = t('status.submitting');
                
                try {
                    await gmRequest({
                        method: 'POST',
                        url: `${PB_URL}/api/collections/reports/records`,
                        headers: { 'Authorization': pbAuthToken, 'Content-Type': 'application/json' },
                        data: JSON.stringify({
                            user: pbUser.id,
                            video_id: videoId,
                            report_type: selectedType,
                            comment: comment || '',
                            source_site: window.location.hostname,
                            // v1.5.64: 帶版本 / UI 語言 / UA，方便重現問題
                            app_version: APP_VERSION,
                            ui_lang: uiLang,
                            user_agent: (navigator.userAgent || '').substring(0, 400)
                        }),
                        timeout: 10000
                    });
                    
                    overlay.remove();
                    showToast(t('status.reportSubmitted'));
                } catch (err) {
                    errorMsg = err.message || t('err.submitFailed');
                    render();
                }
            };
        };
        
        render();
        document.body.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
    }

    /**
     * Auto-fetch subtitle when entering a video page (no button click needed).
     * Silently tries PocketBase first; if none and language is 廣東話/繁體中文,
     * falls back to 迅雷 and auto-loads the first result (already handled by
     * tryFetchFromXunlei). No-op when not logged in or quota exhausted.
     */
    let autoFetchInFlight = false;
    let autoFetchStartTs = 0;
    async function autoTryFetch(videoId) {
        if (autoFetchInFlight) return;
        if (!pbAuthToken || !pbUser) return;          // not logged in — stay silent
        if (!videoId) return;

        // v1.5.71: setTimeout 排隊後用戶可能已 SPA 導航到其他頁面
        // （例如由片頁 /dm177/xxx 去女優頁 /dm177/actresses/xxx）。
        // 這裡再檢查一次當前頁面的片號；唔一致就靜靜放棄，避免在非影片頁彈
        // 「未找到 DM-177 嘅字幕」。
        var currentIdNow = getCurrentVideoID();
        if (!currentIdNow || currentIdNow.toLowerCase() !== String(videoId).toLowerCase()) {
            console.debug('autoTryFetch: 頁面已改變（排隊=' + videoId
                + '，現在=' + (currentIdNow || '非影片頁') + '），取消');
            return;
        }

        autoFetchInFlight = true;
        autoFetchStartTs = Date.now();
        try {
            // v1.5.34: 先確認會員狀態（兼確認 token 未死），再判配額。
            // 舊次序：先用過期 plan 算 limit=3，quota 一爆就靜靜 return，
            // 連 PB 有冇字幕都唔查（badge 綠燈但主片冇字幕 = 最常見症狀）。
            await refreshMembership();
            if (!pbAuthToken || !pbUser) return;       // token 已失效 → clearStaleAuth 已登出

            // Quota check (local + server) — reuse the same gate as manual fetch
            const limit = currentQuotaLimit();
            if (todayFetchCount >= limit || pbUser.downloads_today >= limit) {
                console.log(`autoTryFetch: 今日配額已滿 (${todayFetchCount}/${limit}), 只顯示提示`);
                showToast(`${t('quota.exhausted', {count: todayFetchCount, limit: limit})}`, 4000);
                return;
            }

            // Step 1: PocketBase silently — if found, load without toast spam
            const slugKey = `${videoId.toLowerCase()}__${preferredLanguage.toLowerCase()}`;
            const searchResp = await gmRequest({
                method: 'GET',
                url: `${PB_URL}/api/collections/${PB_SUBTITLES_COLLECTION}/records?filter=${encodeURIComponent(`(slug_lang_key="${slugKey}")`)}&perPage=1`,
                headers: { 'Authorization': pbAuthToken },
                timeout: 15000
            });
            if (searchResp.status === 401 || searchResp.status === 403) {
                // token 喺 fetch 途中死咗 → 清走，下次登入會攞新 token
                clearStaleAuth();
                updateAuthStatusBar();
                return;
            }
            if (searchResp.status >= 200 && searchResp.status < 300) {
                const data = JSON.parse(searchResp.responseText);
                if (data.items && data.items.length > 0) {
                    await tryFetchFromPocketBase(videoId);   // loads + counts quota + writes access_log
                    return;
                }
            }
            // Step 2: 迅雷 fallback (廣東話/繁體中文 only)
        if (canUseXunlei(preferredLanguage)) {
                await tryFetchFromXunlei(videoId);
            }
        } catch (e) {
            console.warn('autoTryFetch silent error:', e);
        } finally {
            autoFetchInFlight = false;
        }
    }

    /** Handle "Fetch subtitle" button click — PB first, then 迅雷 fallback for 廣東話/繁體中文 */
    async function handleFetchSubtitle() {
        if (!pbAuthToken) {
            showToast(t('err.mustLogin'));
            return;
        }

        const videoId = getCurrentVideoID();
        if (!videoId) {
            showToast(t('err.noVideoId'));
            return;
        }

        // Check quota (local cache — instant)
        const limit = currentQuotaLimit();
        if (todayFetchCount >= limit) {
            showToast(`${t('quota.exhausted', {count: limit, limit: limit})}`);
            return;
        }
        
        // Server-side quota check (防 bypass)
        try {
            const serverResp = await gmRequest({
                method: 'GET',
                url: `${PB_URL}/api/collections/${PB_USERS_COLLECTION}/records/${pbUser.id}?fields=downloads_today`,
                headers: { 'Authorization': pbAuthToken },
                timeout: 5000
            });
            if (serverResp.status >= 200 && serverResp.status < 300) {
                const serverData = JSON.parse(serverResp.responseText);
                const serverCount = serverData?.downloads_today || 0;
                // Sync local to match server
                todayFetchCount = serverCount;
                if (serverCount >= limit) {
                    showToast(`${t('quota.exhausted', {count: limit, limit: limit})}`);
                    updateAuthStatusBar();
                    return;
                }
            }
        } catch (e) {
            // Server check failed — fallback to local check only
            console.log('server quota check failed, using local:', e.message);
        }

        showToast(t('fetch.fetching', {videoId: videoId, lang: currentLangLabel()}));

        // Step 1: Try PocketBase first
        const pbResult = await tryFetchFromPocketBase(videoId);
        if (pbResult) return; // Success — subtitle loaded

        // Step 2: Fallback to 迅雷 API (only for 廣東話 or 繁體中文)
        if (canUseXunlei(preferredLanguage)) {
            await tryFetchFromXunlei(videoId);
        }
        // For English/Korean — no fallback, toast already shown by tryFetchFromPocketBase
    }

    /** Try fetching subtitle from PocketBase. Returns true if loaded. */
    async function tryFetchFromPocketBase(videoId) {
        try {
            const slugKey = `${videoId.toLowerCase()}__${preferredLanguage.toLowerCase()}`;
            const searchResp = await gmRequest({
                method: 'GET',
                url: `${PB_URL}/api/collections/${PB_SUBTITLES_COLLECTION}/records?filter=${encodeURIComponent(`(slug_lang_key="${slugKey}")`)}&perPage=1`,
                headers: { 'Authorization': pbAuthToken },
                timeout: 15000
            });

            if (searchResp.status < 200 || searchResp.status >= 300) return false;

            const data = JSON.parse(searchResp.responseText);
            if (!data.items || data.items.length === 0) {
                var toastMsg;
                if (canUseXunlei(preferredLanguage)) {
                    toastMsg = t('fetch.tryXunlei');
                } else {
                    toastMsg = t('fetch.notFound', { videoId: videoId, lang: currentLangLabel() });
                }
                showToast(toastMsg);
                return false;
            }

            const record = data.items[0];

            // v1.5.74: 移除 client 端 access_level 檢查。
            //   原因：舊設計用 access_level='member' 只開放給付費會員，
            //   但現在改成「所有字幕開放，免費 3 次 / 會員 100 次」的配額模型。
            //   兩者衝突：所有字幕都是 access_level='member'，免費會員全部被擋，
            //   連免費額度都用不到（實測：免費會員今日 0/3 仍被攔）。
            //   配額現在由 server 端 /api/subtitle-file/{id} 自訂路由強制執行，
            //   前端不需再判斷 access_level。保留 refreshMembership() 以便
            //   後續 403 訊息能顯示正確的 plan 狀態。
            await refreshMembership();

            // v1.5.73: 改用自訂路由 /api/subtitle-file/{id}
            //   原因：PB Cloud v0.40.5 唔支援 onFileDownloadRequest / onFileTokenRequest，
            //   無法在 /api/files/ 路徑攔截配額。改成自訂路由後，配額檢查在 server 端強制執行，
            //   而且 subtitles.srt_file 欄位已設為 hidden，用戶無法拿到真實檔名直接下載。
            //   回應若為 403，代表今日配額已用完。
            const fileUrl = `${PB_URL}/api/subtitle-file/${encodeURIComponent(record.id)}`;

            const srtResp = await gmRequest({
                method: 'GET',
                url: fileUrl,
                headers: { 'Authorization': pbAuthToken },
                timeout: 20000
            });

            if (srtResp.status === 403) {
                // 配額用盡（server 端回 403）
                var quotaMsg = t('quota.exhausted', { count: todayFetchCount, limit: currentQuotaLimit() });
                try {
                    const j = JSON.parse(srtResp.responseText);
                    if (j && j.message) quotaMsg = String(j.message);
                } catch (e2) {}
                showToast(quotaMsg, 6000);
                return false;
            }

            if (srtResp.status < 200 || srtResp.status >= 300) {
                throw new Error(t('srt.downloadFailed', {status: srtResp.status}));
            }

            const srtContent = srtResp.responseText;
            if (!srtContent.trim()) throw new Error(t('srt.contentEmpty'));

            originalSubtitleText = srtContent;
            subtitles = await parseSRT(srtContent);
            clearSubtitleTrack();
            if (subtitleList) closeSubtitleList();

            todayFetchCount++;
            updateAuthStatusBar();
            hideControlPanel();  // 收起 panel，變返浮動波
            showToast(`${t('status.subtitleLoaded', {title: record.title || videoId, lang: currentLangLabel()})}`, 5000);

            // Write access_log in background
            try {
                gmRequest({
                    method: 'POST',
                    url: `${PB_URL}/api/collections/access_logs/records`,
                    headers: { 'Authorization': pbAuthToken, 'Content-Type': 'application/json' },
                    data: JSON.stringify({ user: pbUser.id, video_id: videoId, language: preferredLanguage, action: 'fetch', result: 'success' }),
                    timeout: 5000
                });
            } catch (e) {}
            // Also update downloads_today on server
            try {
                gmRequest({
                    method: 'PATCH',
                    url: `${PB_URL}/api/collections/${PB_USERS_COLLECTION}/records/${pbUser.id}`,
                    headers: { 'Authorization': pbAuthToken, 'Content-Type': 'application/json' },
                    data: JSON.stringify({ downloads_today: todayFetchCount }),
                    timeout: 5000
                });
            } catch (e) {}

            return true;

        } catch (error) {
            console.error('PB fetch error:', error);
            showToast(t('fetch.failed', {message: error.message}));
            return false;
        }
    }

    /** Fallback: search 迅雷 API and show list for user to pick */
    async function tryFetchFromXunlei(videoId) {
        try {
            const data = await fetchSubtitleAPI(`https://api-shoulei-ssl.xunlei.com/oracle/subtitle?name=${encodeURIComponent(videoId)}`);

            if (data?.code === 0 && data.data?.length > 0) {
                const relevantSubs = data.data.filter(item =>
                    item.url && item.url.toLowerCase().includes('.srt')
                    && isExactSubtitleMatch(item, videoId)
                );

                if (relevantSubs.length > 0) {
                    // Auto-load the first relevant result — API results are usually the same/very similar, no need for a pick-list
                    showToast(t('fetch.xunleiLoading', { name: relevantSubs[0].extra_name || relevantSubs[0].name || t('badge.subtitle') }));
                    await loadRemoteSubtitle(relevantSubs[0].url);
                    return;
                }
            }

            showToast(t('fetch.xunleiNotFound', {videoId: videoId}));

        } catch (error) {
            console.error('Xunlei fallback error:', error);
            showToast(t('fetch.xunleiError', {message: error.message}));
        }
    }
    /** Restore auth from localStorage on script init */
    function restoreAuth() {
        const savedToken = localStorage.getItem('missavPbAuthToken');
        const savedUser = localStorage.getItem('missavPbUser');
        if (savedToken && savedUser) {
            pbAuthToken = savedToken;
            try {
                pbUser = JSON.parse(savedUser);
                pbUserPlan = pbUser.plan || 'free';
                // Sync quota from server (async, non-blocking)
                // v1.5.34: 改為 0ms 立即刷新 —— 舊做法 100ms 太遲，
                // bindVideoElement() 800ms 後 autoTryFetch() 就可能用住舊 plan 撞 access_level 攔截
                setTimeout(syncQuotaFromServer, 0);
            } catch (e) {
                pbUser = null;
                pbUserPlan = 'free';
                pbAuthToken = null;
            }
        }
    }

    /** Parses SRT text into subtitle objects, applying the current offset. */
    async function parseSRT(text) {
        // ... (parseSRT function remains the same)
         return new Promise((resolve) => {
            const subs = text
                .replace(/\r/g, '') // Remove carriage returns
                .split(/\n\n+/) // Split into blocks
                .filter(Boolean) // Remove empty blocks
                .map(block => {
                    try {
                        const lines = block.split('\n');
                        if (lines.length < 2) return null; // Need at least time + text

                        let timeLineIndex = lines[0].includes('-->') ? 0 : (lines.length > 1 && lines[1].includes('-->') ? 1 : -1); // Allow time on line 0 or 1

                        if (timeLineIndex === -1) return null; // Invalid time line format

                        const [startStr, endStr] = lines[timeLineIndex].split(' --> ');
                        const start = parseTime(startStr) + subtitleOffset;
                        const end = parseTime(endStr) + subtitleOffset;
                        const textContent = lines.slice(timeLineIndex + 1).join('\n').trim();

                        if (isNaN(start) || isNaN(end) || start < 0 || end < 0 || start > end || !textContent) return null; // More validation

                        return { start, end, text: textContent };
                    } catch (e) {
                        console.warn("Skipping invalid SRT block:", block, e);
                        return null; // Skip malformed blocks
                    }
                })
                .filter(Boolean); // Remove any null results from map
            resolve(subs);
        });
    }

    /** Parses SRT time string (HH:MM:SS,ms) into seconds. */
    function parseTime(timeStr) {
        // ... (parseTime function remains the same)
        try {
             const [hms, msPart] = timeStr.split(/[,.]/);
             const ms = msPart ? parseInt(msPart.padEnd(3, '0').slice(0, 3), 10) : 0; // Ensure 3 digits for ms, handle missing ms
             const [h, m, s] = hms.split(':');
             const hours = parseInt(h, 10) || 0;
             const minutes = parseInt(m, 10) || 0;
             const seconds = parseInt(s, 10) || 0;

             if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(ms)) {
                 throw new Error("Invalid time component");
             }
             return (hours * 3600) + (minutes * 60) + seconds + (ms / 1000);
         } catch (e) {
             console.error("Failed to parse time string:", timeStr, e);
             return NaN; // Return NaN on failure
         }
    }

    /** Updates the displayed subtitle based on the current video time. */
    function updateSubtitle() {
        if (!subtitleElement) return;

        if (!subtitles || subtitles.length === 0) {
            setSubtitleText('');
            return;
        }

        try {
            const currentTime = isBridgeActive
                ? playerBridgeState.currentTime
                : (videoElement ? videoElement.currentTime : NaN);

            if (!Number.isFinite(currentTime)) {
                setSubtitleText('');
                return;
            }
            // Find the first matching subtitle (handles potential overlaps)
            const currentSub = subtitles.find(sub => currentTime >= sub.start && currentTime <= sub.end);

            setSubtitleText(currentSub ? currentSub.text : '');

        } catch (e) {
            console.error("Error updating subtitle:", e);
        }
    }

    /** Initializes connection with the HTML5 video element. */
    function initPlayer() {
        let attempts = 0;

        if (playerMonitorInterval) {
            clearInterval(playerMonitorInterval);
            playerMonitorInterval = null;
        }

        const checkPlayerInterval = setInterval(() => {
            attempts += 1;
            const currentVideo = findVideoElement();

            if (currentVideo && bindVideoElement(currentVideo)) {
                clearInterval(checkPlayerInterval);
                playerMonitorInterval = setInterval(() => {
                    const refreshedVideo = findVideoElement();
                    if (!refreshedVideo) return;

                    if (!videoElement || !videoElement.isConnected || refreshedVideo !== videoElement) {
                        bindVideoElement(refreshedVideo);
                    }
                }, 1000);
                return;
            }

            if (attempts >= 30) {
                clearInterval(checkPlayerInterval);
                console.error('Missav Script: Failed to find HTML5 video after 15 seconds.');
                showToast(t('err.noPlayer'), 5000);
            }
        }, 500);
    }

    /** Sets up global keyboard shortcuts. */
    function setupShortcuts() {
        // ... (setupShortcuts function remains the same)
         document.addEventListener('keydown', (e) => {
            if (e.target.closest && e.target.closest('.custom-control-panel input')) {
                 return; // Ignore if typing in panel inputs
             }
            if (!videoElement || typeof videoElement.currentTime !== 'number') return;

            const key = e.key.toLowerCase();

            try {
                 if (key === shortcutKeys.accelerate && !isAccelerating) {
                    videoElement.playbackRate = accelerationRate;
                    isAccelerating = true;
                } else if (key === shortcutKeys.forward) {
                    videoElement.currentTime += skipTime;
                } else if (key === shortcutKeys.backward) {
                    videoElement.currentTime = Math.max(0, videoElement.currentTime - skipTime);
                }
                // VLC-style picture adjustments: w/e = brightness, r/t = contrast, y/u = saturation
                else if (key === 'w' || key === 'e') {
                    videoBrightness = clamp((videoBrightness + (key === 'e' ? 0.1 : -0.1)).toFixed(2), 0.5, 1.5);
                    applyVideoPictureFilter(); persistVideoPictureFilter();
                    if (controlPanel && controlPanel.syncPictureSliders) controlPanel.syncPictureSliders();
                    showToast(t('label.brightness') + ' ' + videoBrightness.toFixed(2), 800);
                } else if (key === 'r' || key === 't') {
                    videoContrast = clamp((videoContrast + (key === 't' ? 0.1 : -0.1)).toFixed(2), 0.5, 1.5);
                    applyVideoPictureFilter(); persistVideoPictureFilter();
                    if (controlPanel && controlPanel.syncPictureSliders) controlPanel.syncPictureSliders();
                    showToast(t('label.contrast') + ' ' + videoContrast.toFixed(2), 800);
                } else if (key === 'y' || key === 'u') {
                    videoSaturation = clamp((videoSaturation + (key === 'u' ? 0.1 : -0.1)).toFixed(2), 0, 2.0);
                    applyVideoPictureFilter(); persistVideoPictureFilter();
                    if (controlPanel && controlPanel.syncPictureSliders) controlPanel.syncPictureSliders();
                    showToast(t('label.saturation') + ' ' + videoSaturation.toFixed(2), 800);
                }
            } catch (err) {
                console.error("Shortcut error:", err);
             }
        });

        document.addEventListener('keyup', (e) => {
            if (e.key.toLowerCase() === shortcutKeys.accelerate && isAccelerating) {
                 if (videoElement) {
                    try { videoElement.playbackRate = 1; } catch(err) { console.error("Error resetting speed:", err); }
                 }
                isAccelerating = false;
            }
        });
    }

    /** Searches subtitles using Xunlei API. */
    async function searchSubtitleOnline2() {
        // ... (searchSubtitleOnline2 function remains the same)
         const videoID = getCurrentVideoID();
        if (!videoID) {
            showToast(t('err.noVideoId'));
            return;
        }

        showToast(t('online.searching', {videoID: videoID}));
        closeSubtitleList();

        try {
            const apiUrl = `https://api-shoulei-ssl.xunlei.com/oracle/subtitle?name=${encodeURIComponent(videoID)}`;
            const data = await fetchSubtitleAPI(apiUrl);

            if (data?.code === 0 && data.data?.length > 0) {
                const relevantSubs = data.data.filter(item =>
                    item.url && item.url.toLowerCase().includes('.srt')
                    && isExactSubtitleMatch(item, videoID)
                );
                if (relevantSubs.length > 0) {
                    showSubtitleList(relevantSubs);
                } else {
                    showToast(t('online.noSrtFound', {videoID: videoID}));
                }
            } else {
                 showToast(t('online.noMatch', { videoID: videoID }) + (data && data.code ? ' (Code: ' + data.code + ')' : ''));
            }
        } catch (error) {
            console.error("Subtitle search error (Source 2):", error);
            showToast(t('online.searchError', {message: error.message}));
        }
    }

    /** Fetches data via GM.xmlHttpRequest. */
    function fetchSubtitleAPI(url) {
        return gmRequest({
            method: 'GET',
            url,
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Cache-Control': 'no-cache'
            },
            responseType: 'json',
            timeout: 15000
        }).then((response) => {
            if (response.status < 200 || response.status >= 300) {
                throw new Error(t('err.server', {status: response.status}));
            }

            return parseJsonResponse(response);
        });
    }

    /** Exact match filter for subtitle search results */
    function isExactSubtitleMatch(item, videoID) {
        const name = (item.name || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
        const extra = (item.extra_name || '').toUpperCase().replace(/[^A-Z0-9-]/g, '');
        const vidNorm = videoID.toUpperCase().replace(/-/g, '');
        const nameNorm = name.replace(/-/g, '');
        const extraNorm = extra.replace(/-/g, '');
        return name.includes(videoID.toUpperCase()) || extra.includes(videoID.toUpperCase())
            || nameNorm.includes(vidNorm) || extraNorm.includes(vidNorm);
    }

    /** Displays list of found subtitles. */
    function showSubtitleList(items) {
        // ... (showSubtitleList function remains the same, including close logic)
         closeSubtitleList(); // Ensure only one list is open

        subtitleList = document.createElement('div');
        subtitleList.className = 'subtitle-list';

        const title = document.createElement('div');
        title.textContent = t('online.selectSubtitle');
        title.style.cssText = 'color:#ccc; margin-bottom:8px; font-weight: bold;';
        subtitleList.appendChild(title);

        if (items.length === 0) {
            const noSubs = document.createElement('div');
            noSubs.textContent = t('online.notFound');
            noSubs.style.padding = '5px';
            subtitleList.appendChild(noSubs);
        } else {
            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'subtitle-item';
                div.textContent = `${item.name}${item.extra_name ? ` (${item.extra_name})` : ''}`;
                div.title = `${t('online.clickToLoad', {name: item.name})}`;
                div.onclick = (e) => {
                    e.stopPropagation();
                    loadRemoteSubtitle(item.url);
                };
                subtitleList.appendChild(div);
            });
        }

         const closeBtn = document.createElement('button');
         closeBtn.textContent = t('online.closeList');
         closeBtn.style.cssText = 'margin-top: 10px; padding: 4px 6px; font-size: 11px; background: #555; border: none; color: white; border-radius: 3px; cursor: pointer; display: block; margin-left: auto; margin-right: auto;';
         closeBtn.onclick = closeSubtitleList;
         subtitleList.appendChild(closeBtn);

         document.body.appendChild(subtitleList);
         positionSubtitleList();

         setTimeout(() => {
             document.addEventListener('click', handleClickOutsideList, true);
         }, 0);
    }

    /** Closes the subtitle list. */
    function handleClickOutsideList(event) {
        if (subtitleList
            && !subtitleList.contains(event.target)
            && !event.target.closest('.custom-control-panel button')
            && !event.target.closest('.show-controls-button')) {
            closeSubtitleList();
        }
    }

    /** Removes subtitle list and listener. */
    function closeSubtitleList() {
        if (subtitleList) {
            subtitleList.remove();
            subtitleList = null;
        }
        document.removeEventListener('click', handleClickOutsideList, true);
    }

    /** Loads subtitle from remote URL. */
    async function loadRemoteSubtitle(url) {
        showToast(t('online.loading'));
        closeSubtitleList();

        try {
            const response = await gmRequest({
                method: 'GET',
                url,
                headers: {
                    Accept: 'text/plain,*/*'
                },
                responseType: 'text',
                timeout: 20000
            });

            if (response.status < 200 || response.status >= 300) {
                throw new Error(t('online.downloadFailed', {status: response.status}));
            }

            const srtContent = getResponseText(response);
            if (!srtContent.trim()) {
                throw new Error(t('online.emptyContent'));
            }

            originalSubtitleText = srtContent;
            subtitles = await parseSRT(srtContent);
            clearSubtitleTrack();
            hideControlPanel();  // 收起 panel，變返浮動波
            showToast(t('online.loaded'));
        } catch (error) {
            console.error("Error loading remote subtitle:", error);
            showToast(t('online.loadFailed', {message: error.message}));
            clearSubtitles();
        }
    }

    /** Clears current subtitles. */
    function clearSubtitles() {
        subtitles = [];
        originalSubtitleText = '';
        clearSubtitleTrack();
        setSubtitleText('');
        showToast(t('status.cleared'), 1500);
    }

    /** Extracts video ID from URL. */
    function getCurrentVideoID() {
        try {
            // v1.5.68: 排除 missav 的非影片頁面
            //   missav URL 結構：/{paginator}/{slug}
            //     片頁：/dm31/abw-018            -> ABW-018
            //     列表：/dm539/new               -> 誤判成 DM-539（分頁器ID 被當片號）
            //     列表：/dm539/chinese-subtitle  -> 誤判成 DM-539
            //     列表：/dm278/chinese-subtitle  -> 誤判成 DM-278
            //   所以先檢查「最後一段」係唔係頁面類型關鍵字，
            //   係的話直接返回空字串（唔觸發自動擷取）。
            var pathSegs = window.location.pathname.split('/').filter(function (s) { return s.length > 0; });
            var lastSegRaw = pathSegs.length ? pathSegs[pathSegs.length - 1] : '';
            var NON_VIDEO_SLUGS = [
                // ---- 頁面類型 ----
                'new', 'release', 'recent-release', 'latest', 'popular',
                'trending', 'hot', 'top', 'best', 'random', 'page', 'index',
                'all', 'dm', 'vip',
                // ---- 分類 ----
                'chinese-subtitle', 'english-subtitle', 'uncensored',
                'uncensored-leak', 'censored', 'amateur', 'actress', 'actresses',
                'series', 'maker', 'label', 'genre', 'genres', 'tags', 'tag',
                'category', 'categories', 'studio', 'studios', 'director',
                'directors', 'distributor', 'publisher',
                // ---- 片商（重要：/dm597/fc2 這類）----
                'fc2', 'fc2-ppv', 'caribbeancom', '1pondo', '10musume',
                'pacopacomama', 'heyzo', 'heydouga', 'tokyo-hot',
                'tokyohot', 'mesubuta', 'gachinco', 'muramura',
                'ara', 'av', 'jav', 'javhd', 'javbus',
                // ---- 功能頁 ----
                'search', 'playlist', 'favorite', 'favorites', 'history',
                'ranking', 'rankings', 'articles', 'news', 'blog',
                'contact', 'dmca', 'about', 'terms', 'privacy',
                'login', 'register', 'signup', 'account', 'profile',
                'settings', 'subscription', 'pricing', 'membership',
                // ---- 其他 ----
                'porn', 'pornstar', 'pornstars', 'idol', 'idols',
                'channel', 'channels', 'site', 'sites', 'language',
                'languages', 'en', 'zh', 'ja', 'ko', 'tw', 'cn', 'hk',
                // v1.5.71: 補齊複數 / 其他 missav 分類
                'makers', 'labels', 'genres-2', 'tags-2', 'videos',
                'video', 'movies', 'movie', 'works', 'products',
                'deals', 'deal', 'sale', 'sales', 'recommend', 'recommends',
                'recommendation', 'recommendations', 'related', 'similar'
            ];
            var lastLow = lastSegRaw.toLowerCase();
            if (NON_VIDEO_SLUGS.indexOf(lastLow) >= 0) {
                // v1.5.77: 由每次呼叫都打印，改成靜默返回。
                //   列表頁有 hover 預覽時會反覆呼叫，console 被洗版。
                return '';
            }
            // v1.5.70: 也檢查前一段。
            //   /pornstar/yua-mikami -> 前一段 "pornstar" 係排除關鍵字，唔係片號
            //   /actress/yua-mikami -> 同理
            //   /videos/abc-123     -> 前一段 "videos" 唔在清單，正常解析
            if (pathSegs.length >= 2) {
                var prevLow = pathSegs[pathSegs.length - 2].toLowerCase();
                if (NON_VIDEO_SLUGS.indexOf(prevLow) >= 0
                    && prevLow !== 'videos' && prevLow !== 'video') {
                    console.debug('Missav Helper: 非影片頁（前一段=' + prevLow + '），跳過片號解析');
                    return '';
                }
            }
            // 純數字（例如 /dm539/2）都唔係片號
            if (/^\d{1,4}$/.test(lastSegRaw)) {
                console.debug('Missav Helper: 純數字頁（' + lastSegRaw + '），跳過片號解析');
                return '';
            }
            // v1.5.72: 根本修正 —— 最後一段冇數字 = 分類頁。
            //   missav 的片號一定包含數字（abw-018 / fc2-ppv-3258261 / h_066x1002
            //   / 55t2800600 / sgki-110-lada），而分類頁的 slug 多數係純字母：
            //     /dm273/monthly-hot   -> monthly-hot
            //     /dm170/weekly-hot    -> weekly-hot
            //     /dm597/fc2           -> fc2
            //     /dm177/actresses/xxx -> xxx（前一段 actresses）
            //   之前靠「關鍵字白名單」，missav 出新分類就會漏（monthly-hot、
            //   weekly-hot、daily-hot 全都中過）。改成「冇數字就唔係片號」，
            //   以後加新分類唔需要再更新 script。
            if (!/[0-9]/.test(lastSegRaw)) {
                // v1.5.77: 靜默返回（同上）
                return '';
            }
            // v1.5.59: AV01 專用解析 —— URL 格式 /{lang}/video/{id}/{code}
            //   例 /hk/video/223718/sgki-110-lada -> SGKI-110
            //   片號在最後一段，可能帶 -lada / -uncensored-leak 等後綴（同 missav 一樣處理）
            //   如果 URL 解析失敗，退回讀 h1（AV01 的 h1 一定以「片號 •」開頭）
            if (IS_AV01) {
                const segs = window.location.pathname.split('/').filter(s => s.length > 0);
                const lastSeg = segs.length ? segs[segs.length - 1] : '';

                // FC2 系列（例 fc2-ppv-3258261 / fc2ppv-3258261）
                const fc2 = lastSeg.match(/^fc2[-_]?(ppv)?[-_]?(\d{5,})/i);
                if (fc2) return 'FC2-PPV-' + fc2[2];

                // 數字開頭（例 55t2800600）
                const numM = lastSeg.match(/^(\d{2,}[a-zA-Z]{0,6}\d{3,})(?:[-_].*)?$/);
                if (numM) return numM[1].toUpperCase();

                // H_ 混合格式（例 h_066x1002）
                const hM = lastSeg.match(/^(h_\d+[a-z0-9]*)/i);
                if (hM) return hM[1].toUpperCase();

                // 標準格式（例 sgki-110-lada / abc-123-uncensored-leak）
                const urlMatch = lastSeg.match(/^([a-zA-Z]{2,12})[-_]?(\d{2,8})/);
                if (urlMatch) return (urlMatch[1] + '-' + urlMatch[2]).toUpperCase();

                // 退回 h1（AV01 的 h1 以「片號 •」開頭）
                const h1 = document.querySelector('h1');
                if (h1) {
                    const t = h1.textContent.trim();
                    const h1Fc2 = t.match(/^(fc2[-_]?(?:ppv)?[-_]?\d{5,})/i);
                    if (h1Fc2) return h1Fc2[1].toUpperCase().replace(/^FC2[-_]?PPV[-_]?/i, 'FC2-PPV-');
                    const h1Match = t.match(/^([A-Za-z0-9]+-\d+)/);
                    if (h1Match) return h1Match[1].toUpperCase();
                }
                console.warn('AV01: 無法解析片號', lastSeg);
                return '';
            }

            const path = window.location.pathname;
            const segments = path.split('/').filter(s => s.length > 0);

            if (segments.length === 0) return '';

            const lastSegment = segments[segments.length - 1];

            // Special case: FC2-PPV format — contains hyphens but doesn't match letter-digit pattern
            // e.g. fc2-ppv-3258261, fc2ppv-3258261
            const fc2Match = lastSegment.match(/^fc2[-_]?(ppv)?[-_]?(\d{5,})$/i);
            if (fc2Match) {
                return `FC2-PPV-${fc2Match[2]}`;
            }

            // v1.5.38: 數字開頭嘅片號（唔符合 ABC-123 格式）
            // 例：55T2800600、3430890-はるな特典４K（純數字 + 任意後綴）
            // 呢類之前兩個正則都唔匹配 → 返回空字串 → 冇 badge
            const numMatch = lastSegment.match(/^(\d{2,}[a-zA-Z]{0,6}\d{3,})(?:[-_].*)?$/);
            if (numMatch) return numMatch[1].toUpperCase();

            // v1.5.38: H_ 開頭嘅混合格式（PB 內有 507 條）
            // 例：h_066x1002 → H_066X1002、h_086jrzd68 → H_086JRZD68
            // 注意：唔可以行下面嘅標準正則，因為 "h_0..." 會被當成 H-0 而解析錯
            const hMatch = lastSegment.match(/^(h_\d+[a-z0-9]*)$/i);
            if (hMatch) return hMatch[1].toUpperCase();

            // Check last segment first (most common case): ABC-123 or ABC_123 or ABC123
            // v1.5.38: 原本 (\d{2,5}) 只食 5 位數字，令 CD-2600001 / CPZ-6900006 /
            // MYT-250001 等 6+ 位片號被截斷（CD-2600001 → CD-26000）→ 查錯記錄。
            // 同時加：
            //   · 字母數由 2-6 放寬到 2-10（PARATHD-4322 / MURIKURI-010）
            //   · 容許尾隨 -數字 後綴（GOKU-044-2 / DV-1292-3）
            // 實測 PB 內 27,848 條標準格式，覆蓋率 99.90%（原本 97.1%）
            let idMatch = lastSegment.match(/^([a-zA-Z]{2,10})[-_]?(\d{2,8}(?:[-_]\d+)?)/i);
            if (idMatch) return `${idMatch[1].toUpperCase()}-${idMatch[2].replace(/_/g, '-').toUpperCase()}`;

            // Check second to last segment (e.g., /videos/abc-123/play)
            if (segments.length >= 2) {
                const secondLastSegment = segments[segments.length - 2];
                idMatch = secondLastSegment.match(/^([a-zA-Z]{2,10})[-_]?(\d{2,8}(?:[-_]\d+)?)/i);
                if (idMatch) return `${idMatch[1].toUpperCase()}-${idMatch[2].replace(/_/g, '-').toUpperCase()}`;
            }

            // Fallback: Return last segment if it contains a hyphen and is long enough (might be an ID like fc2-ppv-xxx)
            if(lastSegment.includes('-') && lastSegment.length > 3) return lastSegment.toUpperCase();

            // Final fallback: Check entire path for the pattern
            idMatch = path.match(/([a-zA-Z]{2,10})[-_]?(\d{2,8}(?:[-_]\d+)?)/i);
            if (idMatch) return `${idMatch[1].toUpperCase()}-${idMatch[2].replace(/_/g, '-').toUpperCase()}`;

            console.warn("Could not determine Video ID from path:", path);
            return ''; // Return empty if no ID found

        } catch (error) {
            console.error("Error getting Video ID:", error);
            return '';
        }
    }

    /** Saves settings to localStorage and syncs to PocketBase cloud. */
    function saveSettings() {
        try {
            subtitleFontSize = clamp(
                Number.isFinite(subtitleFontSize) ? subtitleFontSize : 26,
                12,
                72
            );
            subtitleColor = normalizeHexColor(subtitleColor) || '#ffffff';
            localStorage.setItem('missavAccelerationRate', accelerationRate);
            localStorage.setItem('missavSkipTime', skipTime);
            localStorage.setItem('missavSubtitleOffset', subtitleOffset);
            localStorage.setItem('missavSubtitlePosition', subtitleVerticalPositionPercent);
            localStorage.setItem('missavSubtitleSize', subtitleFontSize);
            localStorage.setItem('missavSubtitleColor', subtitleColor);
            localStorage.setItem('missavAccelerateKey', shortcutKeys.accelerate);
            localStorage.setItem('missavForwardKey', shortcutKeys.forward);
            localStorage.setItem('missavBackwardKey', shortcutKeys.backward);
            localStorage.setItem('missavPreferredLanguage', preferredLanguage);
            showToast(t('status.settingsSaved'));

            // Sync to PocketBase cloud (if logged in) — fire & forget with fetch
            if (pbAuthToken && pbUser?.id) {
                const settingsPayload = {
                    accelerationRate: accelerationRate,
                    skipTime: skipTime,
                    subtitleOffset: subtitleOffset,
                    subtitlePosition: subtitleVerticalPositionPercent,
                    subtitleFontSize: subtitleFontSize,
                    subtitleColor: subtitleColor,
                    accelerateKey: shortcutKeys.accelerate,
                    forwardKey: shortcutKeys.forward,
                    backwardKey: shortcutKeys.backward,
                    preferredLanguage: preferredLanguage,
                    updatedFromScriptAt: new Date().toISOString()
                };

                // Try to find existing record, then create or update
                // Use gmRequest (not fetch) — PocketHost truncates tokens on browser fetch()
                gmRequest({
                    method: 'GET',
                    url: `${PB_URL}/api/collections/missav_settings/records?filter=${encodeURIComponent(`(user="${pbUser.id}")`)}&perPage=1`,
                    headers: { 'Authorization': pbAuthToken },
                    timeout: 8000,
                    onload: (resp) => {
                        try {
                            if (resp.status < 200 || resp.status >= 300) return;
                            const data = JSON.parse(resp.responseText);
                            if (data.items && data.items.length > 0) {
                                const recordId = data.items[0].id;
                                gmRequest({
                                    method: 'PATCH',
                                    url: `${PB_URL}/api/collections/missav_settings/records/${recordId}`,
                                    headers: { 'Authorization': pbAuthToken, 'Content-Type': 'application/json' },
                                    data: JSON.stringify(settingsPayload),
                                    timeout: 8000
                                }).catch(() => {});
                            } else {
                                gmRequest({
                                    method: 'POST',
                                    url: `${PB_URL}/api/collections/missav_settings/records`,
                                    headers: { 'Authorization': pbAuthToken, 'Content-Type': 'application/json' },
                                    data: JSON.stringify({ user: pbUser.id, ...settingsPayload }),
                                    timeout: 8000
                                }).catch(() => {});
                            }
                        } catch (e) {}
                    },
                    onerror: () => {},
                    ontimeout: () => {}
                });
            }
        } catch (e) {
            console.error("Error saving settings:", e);
            showToast(t('status.saveFailed'));
        }
    }

    // ─── List Page Subtitle Badge System ──────────────────────────────────

// v1.5.48: jable 卡片選擇器獨立，唔可以同 missav 混合
//   原因：.video-img-box 同時用於 VIDEO_CONTAINER_SELECTORS（搵播片容器）
//   如果混在一起，missav 影音頁的 .video-img-box 會被誤判為列表卡片
// v1.5.59: 卡片選擇器（站點判斷的常數已移到檔頭）
const VIDEO_CARD_SELECTOR_MISSAV = '.card, .aspect-w-16, a[x-show*="item.dvd_id"]';
const VIDEO_CARD_SELECTOR_JABLE = '.video-img-box';
// v1.5.60: AV01 卡片本體係 <div class="group">（實測）
//   結構：<a href="/{lang}/video/{id}/{code}"> > div.group > div.flex-none...
//   badge 疊在 .aspect-video-av01-cover（img 的父層，position: relative）
const VIDEO_CARD_SELECTOR_AV01 = '.group';
const VIDEO_CARD_SELECTOR = IS_JABLE ? VIDEO_CARD_SELECTOR_JABLE
                           : IS_AV01 ? VIDEO_CARD_SELECTOR_AV01
                           : VIDEO_CARD_SELECTOR_MISSAV;
    const BADGE_CACHE_KEY = 'missav_badge_cache';
    const BADGE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

    /** Get badge cache */
    function getBadgeCache() {
        try {
            const raw = localStorage.getItem(BADGE_CACHE_KEY);
            return raw ? JSON.parse(raw) : {};
        } catch (e) { return {}; }
    }

    /** v1.5.57: badge cache key 加入語言 —— 唔同語言的可用字幕唔同，
     *  之前只用 vid 做 key，切換語言後仍然顯示舊語言的結果（例如英文用戶
     *  見到「補充」= 迅雷有字幕，但英文根本冇 fallback）。 */
    function badgeCacheKey(vid, lang) {
        return String(vid).toUpperCase() + '__' + String(lang || preferredLanguage).toLowerCase();
    }

    /** Set badge cache for a video ID + language */
    function setBadgeCache(vid, status, lang) {
        try {
            const cache = getBadgeCache();
            cache[badgeCacheKey(vid, lang)] = { status, timestamp: Date.now() };
            localStorage.setItem(BADGE_CACHE_KEY, JSON.stringify(cache));
        } catch (e) {}
    }

    /** v1.5.57: 依語言修正 badge 狀態
     *  - 非中文語言（無迅雷 fallback）唔應該顯示 xunlei_hit
     *  - 這種情況當成 'none'（該語言冇字幕） */
    function normalizeBadgeStatus(status, lang) {
        const code = lang || preferredLanguage;
        if (status === 'xunlei_hit' && !canUseXunlei(code)) {
            return 'none';
        }
        return status;
    }

    /** Parse video ID from a card link href */
    function parseVideoIDFromCard(link) {
        if (!link) return '';
        const path = new URL(link.href, location.origin).pathname;
        const segments = path.split('/').filter(s => s.length > 0);
        if (segments.length === 0) return '';
        const last = segments[segments.length - 1];
        // First try FC2 pattern
        const fc2Match = last.match(/^fc2[-_]?(ppv)?[-_]?(\d{5,})$/i);
        if (fc2Match) return `FC2-PPV-${fc2Match[2]}`;
        // v1.5.38: 數字開頭（例 55t2800600）
        const numMatch = last.match(/^(\d{2,}[a-zA-Z]{0,6}\d{3,})(?:[-_].*)?$/);
        if (numMatch) return numMatch[1].toUpperCase();
        // v1.5.38: H_ 混合格式（例 h_066x1002 → H_066X1002）
        const hMatch = last.match(/^(h_\d+[a-z0-9]*)$/i);
        if (hMatch) return hMatch[1].toUpperCase();
        // Standard JAV code（同 getCurrentVideoID 用同一條正則，見該處註解）
        const idMatch = last.match(/^([a-zA-Z]{2,10})[-_]?(\d{2,8}(?:[-_]\d+)?)/i);
        if (idMatch) return `${idMatch[1].toUpperCase()}-${idMatch[2].replace(/_/g, '-').toUpperCase()}`;
        // Hyphen fallback
        if (last.includes('-') && last.length > 3) return last.toUpperCase();
        return '';
    }

    /** Set badge color & text */
    function setBadge(badge, status) {
        if (status === 'loading') {
            badge.textContent = t('badge.loading');
            badge.style.background = 'var(--ms-accent, #FE628E)';
        } else if (status === 'pb_hit') {
            badge.textContent = t('badge.subtitle');
            badge.style.background = 'var(--ms-ok, #2eb872)';
        } else if (status === 'pb_partial') {
            // v1.5.36: PB 有字幕但檔案 < 2KB（內容殘缺），用橙色同「補充」嘅黃色分開
            badge.textContent = t('badge.partial');
            badge.style.background = 'var(--ms-partial, #fd7e14)';
        } else if (status === 'xunlei_hit') {
            badge.textContent = t('badge.extra');
            badge.style.background = 'var(--ms-warn, #f0a020)';
        } else {
            badge.textContent = t('badge.none');
            badge.style.background = 'var(--ms-text-dim, #a8b0c0)';
        }
    }

    /** Process a single card: check PB then Xunlei */
    function processListCard(card) {
        if (card.querySelector('.ms-subtitle-badge')) return;
        
        // v1.5.48: jable 卡片內有多個 <a>（圖片、女優、標題），要先揀 /videos/ 連結
        //   missav 卡片只有一個 <a>，行為完全不變
        let link = null;
        if (IS_JABLE) {
            // jable / fs1.app：卡片內有多個 <a>，要揀 /videos/ 那個
            link = card.querySelector('a[href*="/videos/"]');
        } else if (IS_AV01) {
            // v1.5.60: AV01：卡片內的第一個 /video/ 連結
            link = card.querySelector('a[href*="/video/"]');
        }
        if (!link) link = card.querySelector('a');
        if (!link) return;
        
        const vid = parseVideoIDFromCard(link);
        if (!vid) {
            // v1.5.38: 解析失敗 → 印 debug 方便診斷（以前完全靜默）
            console.debug('Missav Helper: 無法解析番號，跳過 badge:', link && link.href);
            return;
        }
        
        const badge = document.createElement('div');
        badge.className = 'ms-subtitle-badge';
        setBadge(badge, 'loading');
        
        // Find container for badge — reference from 字幕小姐 working code
        let container = null;
        if (card.matches('.card')) {
            container = card.querySelector('.card-img-top');
        } else if (card.matches('a[x-show*="item.dvd_id"]')) {
            // Right sidebar cards — mount badge directly on the a tag
            if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
            container = card;
        } else if (IS_AV01) {
            // v1.5.60: AV01 卡片 —— badge 疊在封面圖容器上
            container = card.querySelector('.aspect-video-av01-cover');
            if (!container) container = card.querySelector('img')?.parentElement;
            if (!container) container = card;
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
        } else if (IS_JABLE && card.matches('.video-img-box')) {
            // v1.5.48: jable 卡片 -- badge 疊在 .img-box 上
            //   加 IS_JABLE 判斷，避免 missav 的 .video-img-box 被誤判
            container = card.querySelector('.img-box');
            if (!container) container = card;
            if (getComputedStyle(container).position === 'static') {
                container.style.position = 'relative';
            }
        } else {
            container = card.querySelector('.aspect-w-16, .card-image, img')?.parentElement;
        }
        if (container) {
            container.appendChild(badge);
        } else {
            // Fallback: append to card itself
            if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
            card.appendChild(badge);
        }
        
        // Check 1-hour cache first
        const cache = getBadgeCache();
        // v1.5.57: 用 vid__lang 做 key（舊格式 cache[vid] 唔再使用，自然過期）
        const cached = cache[badgeCacheKey(vid, preferredLanguage)];
        if (cached && cached.status && cached.timestamp && (Date.now() - cached.timestamp < BADGE_CACHE_TTL_MS)) {
            setBadge(badge, cached.status);
            return; // Skip API call — use cached result
        }

        // Priority gate: if the main video's auto-fetch is still in flight, defer
        // this sidebar/list badge API call so the main subtitle loads first.
        // Retry every 300ms until the main fetch is done (or 3s timeout).
        const gateWait = () => {
            if (autoFetchInFlight && Date.now() - autoFetchStartTs < 3000) {
                setTimeout(() => {
                    if (!autoFetchInFlight || Date.now() - autoFetchStartTs >= 3000) {
                        proceedBadge();
                    } else {
                        gateWait();
                    }
                }, 300);
                return;
            }
            proceedBadge();
        };
        const proceedBadge = () => {
            // v1.5.75: 改用批量隊列（50ms 內合併成一次查詢）
            enqueueBadge(vid, badge);
        };
        gateWait();
        return;
    }

    // ============================================================
    // v1.5.75: 列表頁 badge 批量查詢
    // ------------------------------------------------------------
    // 之前：每張卡片各自打一次 PB API。列表頁 56 個卡片 = 56 次請求，
    //       每次 ~200ms，全部完成要 5-11 秒，用戶感覺好慢。
    // 現在：把一輪卡片收集到隊列，50ms 內合併成一個查詢（用 OR 條件），
    //       一次拿到所有片號的 quality，然後逐個套用 badge。
    //       56 次 -> 1 次，速度快 50 倍以上。
    // ============================================================
    var badgeBatchQueue = {};
    var badgeBatchTimer = null;
    var BADGE_BATCH_DELAY_MS = 50;

    function flushBadgeBatch() {
        badgeBatchTimer = null;

        var vids = [];
        for (var k in badgeBatchQueue) {
            if (Object.prototype.hasOwnProperty.call(badgeBatchQueue, k)) vids.push(k);
        }
        var queue = badgeBatchQueue;
        badgeBatchQueue = {};

        if (!vids.length) return;

        // 未登入：全部走迅雷（或直接標 none）
        if (!pbAuthToken) {
            vids.forEach(function (v) {
                (queue[v] || []).forEach(function (el) {
                    if (!document.body.contains(el)) return;
                    if (canUseXunlei(preferredLanguage)) {
                        checkXunleiForBadge(v, el);
                    } else {
                        setBadge(el, 'none');
                        setBadgeCache(v, 'none', preferredLanguage);
                    }
                });
            });
            return;
        }

        var langLower = String(preferredLanguage).toLowerCase();

        // v1.5.76: 分批查詢，避免 URL 過長。
        //   每個條件約 50 字元，8KB URL 上限約 160 個片號。
        //   保守取 100 個一批；正常列表頁（24-68 個）仍然只需 1 次請求。
        var BATCH_MAX = 100;
        var found = {};
        var chunks = [];
        var cur = [];
        for (var ci = 0; ci < vids.length; ci++) {
            cur.push(vids[ci]);
            if (cur.length >= BATCH_MAX) {
                chunks.push(cur);
                cur = [];
            }
        }
        if (cur.length) chunks.push(cur);

        var pending = chunks.length;
        var anyFailed = false;

        var applyResults = function () {
            vids.forEach(function (v) {
                var els = queue[v] || [];
                var key = v.toLowerCase();
                var status = found[key] || '';

                els.forEach(function (el) {
                    if (!document.body.contains(el)) return;
                    if (anyFailed && !status) {
                        fallbackToXunlei(v, el);
                        return;
                    }
                    if (status) {
                        setBadge(el, status);
                        setBadgeCache(v, status, preferredLanguage);
                    } else {
                        fallbackToXunlei(v, el);
                    }
                });
            });

            console.debug('Missav Helper: badge batch done',
                vids.length, 'vids in', chunks.length, 'chunk(s) ->',
                Object.keys(found).length, 'hits');
        };

        var onChunkDone = function () {
            pending--;
            if (pending <= 0) applyResults();
        };

        var fetchChunk = function (chunk) {
            var parts = [];
            for (var i = 0; i < chunk.length; i++) {
                parts.push('(slug_lang_key="' + String(chunk[i]).toLowerCase() + '__' + langLower + '")');
            }
            var filter = parts.join(' || ');

            gmRequest({
                method: 'GET',
                url: PB_URL + '/api/collections/' + PB_SUBTITLES_COLLECTION
                    + '/records?perPage=500&fields=slug_lang_key,quality&filter=' + encodeURIComponent(filter),
                headers: { 'Authorization': pbAuthToken },
                timeout: 12000,
                onload: function (resp) {
                    if (resp.status >= 200 && resp.status < 300) {
                        try {
                            var data = JSON.parse(resp.responseText);
                            var items = (data && data.items) || [];
                            for (var j = 0; j < items.length; j++) {
                                var sl = String(items[j].slug_lang_key || '');
                                var vidPart = sl.split('__')[0];
                                if (!vidPart) continue;
                                var q = items[j].quality;
                                if (found[vidPart] !== 'pb_partial') {
                                    found[vidPart] = (q === 'partial') ? 'pb_partial' : 'pb_hit';
                                }
                            }
                        } catch (eParse) {
                            anyFailed = true;
                        }
                    } else {
                        anyFailed = true;
                    }
                    onChunkDone();
                },
                onerror: function () {
                    anyFailed = true;
                    onChunkDone();
                },
                ontimeout: function () {
                    anyFailed = true;
                    onChunkDone();
                }
            });
        };

        for (var bi = 0; bi < chunks.length; bi++) {
            fetchChunk(chunks[bi]);
        }
    }

    function enqueueBadge(vid, badgeEl) {
        var key = String(vid);
        if (!badgeBatchQueue[key]) badgeBatchQueue[key] = [];
        badgeBatchQueue[key].push(badgeEl);
        if (!badgeBatchTimer) {
            badgeBatchTimer = setTimeout(flushBadgeBatch, BADGE_BATCH_DELAY_MS);
        }
    }


    /** Check PocketBase for badge */
    function checkPocketBaseForBadge(vid, slugKey, badge) {
        gmRequest({
            method: 'GET',
            // v1.5.36: 加 quality 欄位 —— 殘缺字幕 (<2KB) 顯示橙色「殘次」
            url: `${PB_URL}/api/collections/${PB_SUBTITLES_COLLECTION}/records?filter=${encodeURIComponent(`(slug_lang_key="${slugKey}")`)}&perPage=1&fields=id,quality`,
            headers: { 'Authorization': pbAuthToken },
            timeout: 8000,
            onload: (resp) => {
                try {
                    if (resp.status < 200 || resp.status >= 300) {
                        fallbackToXunlei(vid, badge);
                        return;
                    }
                    const data = JSON.parse(resp.responseText);
                    if (data.items && data.items.length > 0) {
                        // quality='partial' → 橙色殘次；其他（含舊記錄冇此欄位）→ 綠色字幕
                        const status = data.items[0].quality === 'partial' ? 'pb_partial' : 'pb_hit';
                        setBadge(badge, status);
                        setBadgeCache(vid, status, preferredLanguage);
                        return;
                    }
                } catch (e) {}
                fallbackToXunlei(vid, badge);
            },
            onerror: () => fallbackToXunlei(vid, badge),
            ontimeout: () => fallbackToXunlei(vid, badge)
        });
    }

    /** Fallback to Xunlei for badge */
    function fallbackToXunlei(vid, badge) {
        if (!canUseXunlei(preferredLanguage)) {
            setBadge(badge, 'none');
            setBadgeCache(vid, 'none', preferredLanguage);
            return;
        }
        checkXunleiForBadge(vid, badge);
    }

    /**
     * v1.0.3: 迅雷 API 不穩定，同一個請求相隔幾秒可以回 0 條或幾條。
     *
     * 實測 DLDSS-572（間隔 3 秒連打三次）：
     *   #1 data=0
     *   #2 data=2   <- DLDSS-572.srt，isExactSubtitleMatch 為 true
     *   #3 data=0
     * 對照組 DLDSS-571 一次就回 49 條，IESP-764 回 3 條，MIDE-839 回 6 條，
     * 所以不是我們的查詢字串有問題，是迅雷後端多節點、快取不一致。
     *
     * 後果：badge 第一次撞到沒有該片字幕的節點就顯示灰「無」，
     * 但用戶撳入去擷取時再查一次（tryFetchFromXunlei）剛好撞到有資料的
     * 節點就載入成功 —— 正是用戶回報的現象。
     *
     * 處理：回空結果時重試，最多 XUNLEI_BADGE_RETRIES 次。
     * 正常有資料的情況只打一次，唔會拖慢。
     */
    var XUNLEI_BADGE_RETRIES = 2;        // 額外重試次數（總共 3 次請求）
    var XUNLEI_BADGE_RETRY_DELAY = 800;  // 每次重試間隔（毫秒）

    /** Check Xunlei for badge */
    function checkXunleiForBadge(vid, badge) {
        var attemptsLeft = XUNLEI_BADGE_RETRIES;

        function finish(status) {
            setBadge(badge, status);
            setBadgeCache(vid, status, preferredLanguage);
        }

        function attempt() {
            gmRequest({
                method: 'GET',
                url: `https://api-shoulei-ssl.xunlei.com/oracle/subtitle?name=${encodeURIComponent(vid)}`,
                // v1.0.2: 同 tryFetchFromXunlei 用同一組 header。
                //   之前呢度只寫 Accept: 'application/json'，而且冇 responseType，
                //   於是 Tampermonkey 有時回傳已解析的物件（response.response），
                //   有時只回字串。下面直接 JSON.parse(xunResp.responseText) 就會在
                //   responseText 係 undefined 時拋錯，catch 之後 badge 被設成 'none'。
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Cache-Control': 'no-cache'
                },
                responseType: 'json',
                timeout: 8000,
                onload: (xunResp) => {
                    try {
                        if (xunResp.status < 200 || xunResp.status >= 300) {
                            finish('none');
                            return;
                        }
                        const xunData = parseJsonResponse(xunResp);
                        const list = (xunData && Array.isArray(xunData.data)) ? xunData.data : [];

                        // 有資料才判斷，空陣列代表這次可能撞到舊節點，重試
                        if (list.length === 0) {
                            if (attemptsLeft > 0) {
                                attemptsLeft--;
                                setTimeout(attempt, XUNLEI_BADGE_RETRY_DELAY);
                                return;
                            }
                            finish('none');
                            return;
                        }

                        if (xunData && xunData.code === 0) {
                            const hasMatch = list.some(item =>
                                item.url && item.url.toLowerCase().includes('.srt')
                                && isExactSubtitleMatch(item, vid)
                            );
                            // v1.5.57: 依語言修正（非中文語言唔顯示 xunlei_hit）
                            const status = normalizeBadgeStatus(hasMatch ? 'xunlei_hit' : 'none', preferredLanguage);
                            finish(status);
                        } else {
                            finish('none');
                        }
                    } catch (e) {
                        // 解析失敗同空結果一樣處理：重試一次看看
                        if (attemptsLeft > 0) {
                            attemptsLeft--;
                            setTimeout(attempt, XUNLEI_BADGE_RETRY_DELAY);
                            return;
                        }
                        finish('none');
                    }
                },
                onerror: () => {
                    if (attemptsLeft > 0) {
                        attemptsLeft--;
                        setTimeout(attempt, XUNLEI_BADGE_RETRY_DELAY);
                        return;
                    }
                    finish('none');
                },
                ontimeout: () => {
                    if (attemptsLeft > 0) {
                        attemptsLeft--;
                        setTimeout(attempt, XUNLEI_BADGE_RETRY_DELAY);
                        return;
                    }
                    finish('none');
                }
            });
        }

        attempt();
    }

    /** v1.5.57: 切換字幕語言時，重算所有已顯示的 badge。
     *  原因：badge 結果依語言而變（唔同語言有唔同字幕、只有中文有迅雷 fallback），
     *  切換語言後舊 badge 會誤導用戶。 */
    function refreshAllBadges() {
        const badges = document.querySelectorAll('.ms-subtitle-badge');
        if (!badges.length) return;
        badges.forEach(badge => {
            // 移除舊 badge，並移除卡片的 processed 標記，讓 processListCard 重新處理
            const card = badge.closest('.card, .video-img-box, a[x-show*="item.dvd_id"]')
                      || badge.parentElement;
            if (card) {
                card.classList.remove('ms-badge-processed');
                badge.remove();
            } else {
                badge.remove();
            }
        });
        // 重新處理所有卡片
        document.querySelectorAll(VIDEO_CARD_SELECTOR).forEach(processListCard);
        console.debug('Missav Helper: refreshed', badges.length, 'badges for language', preferredLanguage);
    }

    /** Initialize list page badge system */
    function initListPageBadges() {
        // Process existing cards
        document.querySelectorAll(VIDEO_CARD_SELECTOR).forEach(processListCard);
        
        // Watch for new cards (infinite scroll)
        const observer = new MutationObserver(() => {
            document.querySelectorAll(`${VIDEO_CARD_SELECTOR}:not(.ms-badge-processed)`).forEach(card => {
                card.classList.add('ms-badge-processed');
                processListCard(card);
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
        
        // Polling fallback for lazy-loaded cards
        setInterval(() => {
            document.querySelectorAll(`${VIDEO_CARD_SELECTOR}:not(.ms-badge-processed)`).forEach(card => {
                card.classList.add('ms-badge-processed');
                processListCard(card);
            });
        }, 2000);
    }

    /** Displays a toast message — stacked so newer ones don't cover older ones. */
    function showToast(message, duration = 3000) {
        // Create a shared container for all toasts (so they stack upward, not overlap)
        let container = document.getElementById('missav-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'missav-toast-container';
            container.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                display: flex;
                flex-direction: column;
                gap: 8px;
                align-items: flex-end;
                z-index: 10002;
                pointer-events: none;
            `;
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.textContent = message;
        toast.style.cssText = `
            background: var(--ms-bg-elev-2);
            color: var(--ms-text);
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 13px;
            opacity: 0;
            border: 1px solid rgba(74, 158, 255, 0.15);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
            max-width: 300px;
            text-align: center;
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
            pointer-events: none;
            transform: translateY(6px);
            transition: opacity 0.25s ease, transform 0.25s ease;
            white-space: normal;
            word-break: break-word;
            overflow-wrap: anywhere;
            overflow: visible;
            text-overflow: clip;
        `;
        container.appendChild(toast);

        // Fade in
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                toast.style.opacity = '1';
                toast.style.transform = 'translateY(0)';
            });
        });

        // Fade out & remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(6px)';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, duration);
    }

    // --- Initialization ---
    function initializeScript() {
        console.log("Missav Script: Initializing Safari compatibility build...");
        restoreAuth();               // Restore PocketBase auth from localStorage
        setupSubtitleDisplay();    // Prepare subtitle div (applies initial position)
        createControlPanel();      // Create the main controls (including position input)
        createShowControlsButton();// Create the hidden 'show' button
        hideControlPanel();        // Start collapsed to save space
        window.addEventListener('resize', handleViewportChange);
        setupPlayerBridge();       // Bridge actual page player state into Userscripts context
        setupShortcuts();          // Setup keyboard listeners
        initPlayer();              // Connect to the video element
        initListPageBadges();      // List page subtitle badges
        console.log("Missav Script: Initialization complete.");

        // v1.5.40: 延遲 3 秒後靜默補領 Founder（付款後 webhook 未能對上的情況）
        setTimeout(() => { autoClaimFounder(false); }, 3000);
    }

    // Use MutationObserver or fallback timer to start initialization
    let initStarted = false;
    const observer = new MutationObserver((mutationsList, obs) => {
        const playerElement = findVideoElement();
        if (playerElement && !initStarted) {
             console.log("Missav Script: Player element detected, running main script.");
             initStarted = true;
             obs.disconnect();
             initializeScript();
         }
    });

    observer.observe(document.documentElement || document.body, { childList: true, subtree: true });

    setTimeout(() => {
        if (!initStarted) {
             console.log("Missav Script: Fallback timer triggered, attempting initialization.");
             initStarted = true; // Prevent double initialization
             observer.disconnect();
             initializeScript();
         }
     }, 4000); // Increased fallback timer slightly

})(); // End of IIFE
