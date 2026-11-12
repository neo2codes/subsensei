# Changelog

所有 SubSensei（字幕老師）的版本更新記錄。

格式根據 [Keep a Changelog](https://keepachangelog.com/)，
版本號遵循 [Semantic Versioning](https://semver.org/)。

---

## 字幕庫擴充 — 2026-11-12（非軟體版本）

### 大規模上傳（+83,708 條）

字幕庫由 231,609 條擴充至 315,317 條（+36.2%）。

| 語言 | 上傳前 | 上傳後 | 增加 |
|---|---|---|---|
| 🇭🇰 廣東話 | 81,834 | 81,834 | — |
| 🇹🇼 繁體中文 | 39,380 | **81,234** | **+41,854** |
| 🇨🇳 简体中文 | 39,380 | **81,234** | **+41,854** |
| 🇬🇧 English | 39,385 | 39,385 | — |
| 🇰🇷 한국어 | 3,907 | 3,907 | — |
| 🇲🇾 Melayu | 187 | 187 | — |
| 🇹🇭 ไทย | 3,907 | 3,907 | — |
| 🇻🇳 Tiếng Việt | 3,907 | 3,907 | — |
| 🇮🇩 Bahasa Indonesia | 187 | 187 | — |
| 🇵🇭 Filipino | 3,907 | 3,907 | — |
| 🇩🇪 Deutsch | 3,907 | 3,907 | — |
| 🇫🇷 Français | 3,907 | 3,907 | — |
| 🇧🇷 Português | 3,907 | 3,907 | — |
| 🇷🇺 Русский | 3,907 | 3,907 | — |
| **總計** | 231,609 | **315,317** | **+83,708** |

### 來源

兩個新資料夾，**完全冇重疊**（0 部共同影片）：

| 資料夾 | 影片數 | 語言 | 上傳 |
|---|---|---|---|
| `F:\pyvideotrans_fixed\ja-nonfc1` | 13,906 | zh-tw / zh-cn | 27,673 |
| `F:\pyvideotrans_fixed\ja` | 28,017 | zh-tw / zh-cn | 56,029 |

ja 的 28,017 部與 ja-nonfc1 的 13,906 部零重疊，聯集 41,923 部。

### 上傳明細

| 批次 | 資料夾 | 語言 | ok | fail | 耗時 |
|---|---|---|---|---|---|
| 1 | ja-nonfc1 | tw | 13,838 | 0 | 247s |
| 2 | ja-nonfc1 | cn | 13,835 | 3 | 361s |
| 3 | ja | tw | 28,013 | 3 | 562s |
| 4 | ja | cn | 28,016 | 0 | 486s |
| **合計** | | | **83,702** | **6** | **1,656s** |

6 個失敗全部是 `HTTP 400 Failed to create record`（PB 側的重複／競態），
但四個批次的 PB 總數都與 dry run 完全吻合
（traditional-chinese 81,234、simplified-chinese 81,234），
所以這 6 條實際上已經寫入，不需要補傳。

### 品質分佈（上傳後）

  premium: 278,889
  partial:  36,428
  is_active=false: 0
  language 空白: 0
  video_id 空白: 0

分語言合計 315,317 = PB 總數 315,317（差額 0）。

### 兩個檢查（上傳前）

1. **兩個資料夾零重疊** —— 用 zh-tw 的片號集合比對，
   ja-nonfc1 13,906、ja 28,017，交集 0。所以兩邊都要上傳，不會重複。
2. **zh-tw 與 zh-cn 是繁簡兩版，不是獨立翻譯** ——
   同一片號的兩個檔案字元數完全相同（例：AAK-002 都是 19,106 chars），
   只是字形不同（「您來了」/「您来了」）。這是正確的做法。

### BOM

兩個資料夾 100% 的檔案都有 UTF-8 BOM（`EF BB BF`），
而且用 CRLF 換行。之前已經成功上傳的資料夾也是這樣
（G 目錄 92/100、whisperjav_merged 100/100、master-merged 81/100 都有 BOM），
所以 PB 接受含 BOM 的 SRT，不需要預先清理。

---

## 字幕庫擴充 — 2026-11-10（非軟體版本）

### 大規模上傳（+84,375 條）

字幕庫由 146,262 條擴充至 230,637 條（+57.7%）。

| 語言 | 上傳前 | 上傳後 | 增加 |
|---|---|---|---|
| 🇭🇰 廣東話 | 81,443 | **81,753** | +310 |
| 🇹🇼 繁體中文 | 17,882 | **39,299** | +21,417 |
| 🇨🇳 简体中文 | 17,882 | **39,299** | +21,417 |
| 🇬🇧 English | 17,882 | **39,304** | +21,422 |
| 🇰🇷 한국어 | 3,079 | **3,826** | +747 |
| 🇲🇾 Melayu | 187 | 187 | — |
| 🇹🇭 ไทย | 3,295 | **3,826** | +531 |
| 🇻🇳 Tiếng Việt | 226 | **3,826** | +3,600 |
| 🇮🇩 Bahasa Indonesia | 187 | 187 | — |
| 🇵🇭 Filipino | 226 | **3,826** | +3,600 |
| 🇩🇪 Deutsch | 226 | **3,826** | +3,600 |
| 🇫🇷 Français | 226 | **3,826** | +3,600 |
| 🇧🇷 Português | 226 | **3,826** | +3,600 |
| 🇷🇺 Русский | 3,295 | **3,826** | +531 |
| **總計** | 146,262 | **230,637** | **+84,375** |

### 來源

| 資料夾 | 語言 | 上傳 |
|---|---|---|
| `F:\whisperjav_merged` | tw / cn / en / yue | 63,378 |
| `G:\missavdl\latest\paired_srt\merged` | fr / vi / fil / de / pt | 18,000 |
| `G:\missavdl\latest\paired_srt\merged` | yue / tw / cn / en / th / ru / ko | 2,997 |

### 上傳前的異常檔名清理（F:\whisperjav_merged）

發現 75 個檔名格式異常的檔案（15 部影片 × 5 種語言），
直接上傳會產生錯誤的 video_id：

| 異常格式 | 錯誤 video_id | 正確 video_id |
|---|---|---|
| `XXXX-NNN.ja.whisperjav.LANG.srt` | `XXXX-NNN.JA.WHISPERJAV` | `XXXX-NNN` |
| `XXXX-NNN.ja.merged.whisperjav.LANG.srt` | `XXXX-NNN.JA.MERGED.WHISPERJAV` | `XXXX-NNN` |
| `hhd800.com@XXXX-NNN.LANG.srt` | `HHD800.COM@XXXX-NNN` | `XXXX-NNN` |

處理：全部改名後歸位（75 個成功，0 失敗），涉 15 部影片：

  BONY-162, GMJK-020, GONE-069, HEZ-608, HOI-401, IENE-350, IENE-369,
  IENE-382, IESP-670, IESP-680, IESP-689, IESP-711, IPZ-682, IZM-028,
  JKSR-657

改名後各語言 items 由 22,099/22,094/22,094/22,099 增至
22,114/22,109/22,109/22,114（各 +15）。

### 品質分佈（上傳後）

  premium: 213,400
  partial:  17,237
  is_active=false: 0
  language 空白: 0
  video_id 空白: 0

分語言合計 230,637 = PB 總數 230,637（差額 0）。

### 為何 whisperjav 的「需上傳」遠多於只差 17,882 的缺口

PB 在這一輪之前有 17,882 條 tw，但那 17,882 條來自 master-merged（14,384）
與 G 目錄（3,529），與 whisperjav 的 22,094 部影片只有 987 部重疊。
三個資料夾的影片集合幾乎不重疊：

  whisperjav ∩ master:   987
  whisperjav ∩ G:         13
  G ∩ master:             31
  三者聯集:            39,286 部

所以要上傳 21,120 條而不是「22,094 − 17,882」。

---

## 字幕庫擴充 — 2026-11-09（非軟體版本）

### 大規模上傳（+21,248 條）

字幕庫由 125,014 條擴充至 146,262 條（+17.0%）。

| 語言 | 上傳前 | 上傳後 | 增加 |
|---|---|---|---|
| 🇭🇰 廣東話 | 81,443 | 81,443 | — |
| 🇹🇼 繁體中文 | 17,882 | 17,882 | — |
| 🇨🇳 简体中文 | 3,529 | **17,882** | **+14,353** |
| 🇬🇧 English | 10,987 | **17,882** | **+6,895** |
| 🇰🇷 한국어 | 3,079 | 3,079 | — |
| 🇲🇾 Melayu | 187 | 187 | — |
| 🇹🇭 ไทย | 3,295 | 3,295 | — |
| 🇻🇳 Tiếng Việt | 226 | 226 | — |
| 🇮🇩 Bahasa Indonesia | 187 | 187 | — |
| 🇵🇭 Filipino | 226 | 226 | — |
| 🇩🇪 Deutsch | 226 | 226 | — |
| 🇫🇷 Français | 226 | 226 | — |
| 🇧🇷 Português | 226 | 226 | — |
| 🇷🇺 Русский | 3,295 | 3,295 | — |
| **總計** | 125,014 | **146,262** | **+21,248** |

### 來源

`F:\javdownload\master-merged` —— 該資料夾已完成的翻譯。

| 語言 | 目錄檔案 | PB 上傳前 | 需上傳 | 實際結果 |
|---|---|---|---|---|
| yue | 14,384 | 81,443 | 0 | 全部已存在 |
| tw | 14,384 | 17,882 | 0 | 全部已存在 |
| cn | 14,384 | 3,529 | 14,353 | ✅ 14,353 |
| en | 14,384 | 10,987 | 6,895 | ✅ 6,895 |

三種主力語言（繁體中文、简体中文、English）現在均為 17,882 條，
即 master-merged 的 17,882 部影片已全部完成這三種語言的翻譯。

### 品質分佈（上傳後）

  premium: 131,818
  partial:  14,444
  is_active=false: 0
  language 空白: 0
  video_id 空白: 0

分語言合計 146,262 = PB 總數 146,262（差額 0）。

### 上傳工具的一個陷阱（記錄）

臨時寫的檢查腳本裡，`pb_slugs()` 呼叫 `req(url, token)` 而 `req` 的簽名是
`req(url, method="GET", token=None, body=None)`，於是 token 被當成 HTTP
方法傳入，請求方法變成一段 JWT 字串，Cloudflare 直接回 400 Bad Request，
`pb_slugs()` 靜默返回空集合，差額報告顯示「PB 現有 0 / 需上傳全部」。

`upload_from_plan.py` 自己沒有這個問題（它的呼叫寫法正確），所以實際上傳
不受影響。但這提醒：凡是「PB 現有 = 0」的差額報告，都要先確認查詢真的成功，
而不是查詢失敗被吞掉。

---

---

## 字幕庫擴充 — 2026-11-04（非軟體版本）

### 大規模上傳（+40,024 條）

字幕庫由 84,990 條擴充至 125,014 條（+47.1%）。

| 語言 | 上傳前 | 上傳後 | 增加 |
|---|---|---|---|
| 🇭🇰 廣東話 | 59,938 | **81,443** | +21,505 |
| 🇹🇼 繁體中文 | 17,436 | **17,882** | +446 |
| 🇨🇳 简体中文 | 3,063 | **3,529** | +466 |
| 🇬🇧 English | 3,063 | **10,987** | +7,924 |
| 🇰🇷 한국어 | 149 | **3,079** | +2,930 |
| 🇲🇾 Melayu | 149 | **187** | +38 |
| 🇹🇭 ไทย | 149 | **3,295** | +3,146 |
| 🇻🇳 Tiếng Việt | 149 | **226** | +77 |
| 🇮🇩 Bahasa Indonesia | 149 | **187** | +38 |
| 🇵🇭 Filipino | 149 | **226** | +77 |
| 🇩🇪 Deutsch | 149 | **226** | +77 |
| 🇫🇷 Français | 149 | **226** | +77 |
| 🇧🇷 Português | 149 | **226** | +77 |
| 🇷🇺 Русский | 149 | **3,295** | +3,146 |
| **總計** | 84,990 | **125,014** | **+40,024** |

### 來源資料夾

| 資料夾 | 上傳語言 | 條數 |
|---|---|---|
| `G:\missavdl\latest\paired_srt\merged` | 14 種語言全部 | 11,507 |
| `F:\javdownload\master-merged` | 僅 English（yue/tw 已全部存在）| 7,458 |
| `F:\whisperjav_merged` | 僅 zh-yue（zh-tw 仍在處理，未動）| 21,059 |

### 品質分佈（上傳後）

  premium: 111,459
  partial:  13,555
  is_active=false: 0
  language 空白: 0
  video_id 空白: 0

分語言合計 125,014 = PB 總數 125,014（差額 0）。

### 工具

新增 `notes/pb_migration/check_diff.py`：
讀取多個資料夾，逐語言計算「目錄檔案 / PB 現有 / 需上傳 / 大小」，
在上傳前先確認實際差額，避免重複上傳。

上傳流程沿用 `upload_from_plan.py`：
  · 自動跳過無語言後綴（日文原文）
  · 按語言後綴篩選
  · 讀 PB 現況過濾已存在記錄
  · 同片號去重（保留最大檔）
  · is_active: true

---

---

---

## v1.1.0 — 2026-11-06

### 新增
- **邀請碼兌換系統**
  - KOL 推廣用：派發邀請碼讓粉絲免費體驗，兌換後獲得指定天數會員
  - 升級彈窗底部新增「有邀請碼？」輸入框與兌換按鈕，支援 Enter 鍵
  - 兌換成功後即時更新面板狀態（免費 3 次／日 → 會員 100 次／日）
  - 錯誤訊息完整中英雙語，並涵蓋全部失敗情境

### 後端（PB Cloud）

新增兩個 collection：

| Collection | 用途 |
|---|---|
| `invite_codes` | 邀請碼定義（code / label / duration_days / max_uses / used_count / expires_at / is_active / note）|
| `invite_redemptions` | 兌換記錄（code / user / user_email / duration_days / paid_until_before / paid_until_after / ip）|

新增 hook `invite_redeem.pb.js`：

```
POST /api/invite-redeem
Authorization: <user token>
Body: { "code": "MIKO-2026" }
```

錯誤碼：`unauthenticated` / `missing_code` / `invalid_code` / `not_found` /
`inactive` / `expired` / `exhausted` / `already_redeemed` / `user_limit`

### 設計決策

- **天數制而非固定到期日**：從兌換當刻起算，越晚兌換的人不會吃虧
- **不降級**：`paid_until` 取 `max(現有值, now + duration)`，終身會員兌換不會被降級
- **每人每個碼限 1 次**，每人總共限 2 次，防止收集大量邀請碼疊加
- **Goja 單執行緒**：檢查與扣減之間無需加鎖，`used_count` 不會超賣

### PB Cloud Goja 踩坑記錄

`$app.countRecords(..., 'user = {:uid}', ..., { uid: id })` 對 relation 欄位查不到，
導致重複兌換未被攔截。必須改用字串拼接：

```javascript
var dupFilter = "code = \"" + code + "\" && user.id = \"" + authId + "\"";
var dupFound = $app.findRecordsByFilter("invite_redemptions", dupFilter, "", 1, 0);
```

與 `subtitle_file_route.pb.js` 對 `access_logs.user.id` 的寫法一致。

### 驗證

後端 9 個情境全部通過：

| 測試 | 結果 |
|---|---|
| 有效兌換 | 200，`paid_until` 正確 |
| 重複兌換同一碼 | 400 `already_redeemed` |
| 兌換第 2 個碼 | 200（每人總共 2 次內）|
| 兌換第 3 個碼 | 400 `user_limit` |
| 名額用完 | 410 `exhausted` |
| 已停用碼 | 410 `inactive` |
| 無效碼 | 404 `not_found` |
| 空碼 | 400 `missing_code` |
| 未登入 | 401 `unauthenticated` |

端到端（瀏覽器）：canary-free 帳號輸入 `WELCOME-2026`，
面板由「(免費會員) 今日 0/3」變成「(會員) 今日 0/100」，
兌換記錄寫入成功，`used_count` 由 0 變 1。

node --check：PASS
5 站模擬 IIFE 載入：全部 PASS

---

## v1.0.3 — 2026-11-05

### 修正
- **badge 誤判迅雷字幕為「無」**
  - 用戶回報：https://missav.ai/dldss-572 的 badge 顯示灰色「無」，
    但撳入去擷取卻載入得到字幕
  - 診斷：該片在 PB 完全沒有記錄，badge 走迅雷分支。實測迅雷確實有資料
    （`DLDSS-572.srt`，`isExactSubtitleMatch` 回 true）。進一步連續測試發現
    迅雷後端多節點、快取不一致，同一條片間隔 3 秒連打三次：
    `data=0` / `data=2` / `data=0`
  - 於是 badge 第一次撞到沒有該片字幕的節點就顯示「無」，
    而用戶撳入去擷取時再查一次剛好撞到有資料的節點就成功
  - 修正：`checkXunleiForBadge` 改成可重試
    - `XUNLEI_BADGE_RETRIES = 2`（總共 3 次請求）
    - `XUNLEI_BADGE_RETRY_DELAY = 800`（毫秒）
    - 回空結果或解析失敗時重試，3 次都空才設 `none`
    - 有資料的情況只打一次，不會拖慢正常路徑
  - 驗證：用戶實測 DLDSS-572 badge 已顯示黃色「補充」

---

## v1.0.2 — 2026-11-05

### 修正
- **badge 迅雷查詢的 JSON 解析失敗**
  - `checkXunleiForBadge` 直接呼叫 `JSON.parse(xunResp.responseText)`，
    而 `tryFetchFromXunlei` 用 `parseJsonResponse()`（有 `response.response`
    物件分支）
  - Tampermonkey 有時回傳已解析物件，此時 `responseText` 是 `undefined`，
    `JSON.parse` 拋錯後 badge 被設成 `none`
  - 修正：`checkXunleiForBadge` 改用 `parseJsonResponse(xunResp)`，
    並補上 `responseType: 'json'` 與和 `tryFetchFromXunlei` 一致的 header

---

## v1.0.1 — 2026-11-03

### 修正
- **AV01 字幕無法顯示**
  - 用戶回報：https://www.av01.media/hk/video/208097/mngs-060 字幕載入不了，
    同一條片在 missav 正常
  - 診斷：面板正常、片號解析正確（MNGS-060）、video 元素存在、
    aspect-video 容器存在且 position: relative，但 `.custom-subtitle` 完全不存在；
    手動 appendChild 測試成功且可見，證明是字幕元素從來沒有掛上去
  - 根因：舊 `setupSubtitleDisplay()` 只嘗試掛載一次（setInterval 每 500ms 找容器），
    30 秒後仍找不到就放棄。AV01 是 SPA，`<video>` 常在腳本初始化數十秒後才真正可用，
    於是永久掛不上字幕。missav 的 video 較早存在，因此不受影響。
  - 修正：拆成三個函數，移除 30 秒死線
    - `ensureSubtitleElement()`：只建立元素一次，重複呼叫直接回傳同一個
    - `tryMountSubtitle()`：嘗試掛到正確容器；若掛錯容器會先拔走再重掛，
      成功後立刻 `updateSubtitle()` 刷新目前字幕
    - `startSubtitleMountRetry()`：每 500ms 重試，最多 120 次（60 秒），
      之後不再彈 toast 只記錄
    - `bindVideoElement()` 在綁定播放器後也呼叫 `tryMountSubtitle()`，
      確保每次拿到新的 video 都能把字幕掛上去
  - 驗證：用戶實測 AV01 字幕正常載入

## v1.0.0 — 2026-10-31

### 專案重新命名

本專案由 `missav-helper` 改名為 **SubSensei ｜ 字幕老師**，並將版本號重新基準化為 v1.0.0。

**此版本功能等同 missav-helper v1.5.78**，僅變更：

- 名稱：`missav-helper` → `SubSensei`
- 版本號：`v1.5.78` → `v1.0.0`（重新基準）
- 首頁：`github.com/neo2codes/missav-helper` → `github.com/neo2codes/subsensei`
- `@updateURL` / `@downloadURL` / `@supportURL` / `@homepageURL` 全部指向新 repo
- `@description` 更新為「14 種語言 / 5 個站點家族」
- 新增 `@description:zh-TW`（繁中描述）

### 為何重新基準版本號

專案已從「MissAV 專用工具」擴展為支援 13 個域名（missav / jable / fs1.app / av01）
與 14 種字幕語言的完整工具。沿用舊版號會令新使用者困惑，故重新基準。

### 完整 v1.5.x 歷史

以下為改名前的版本記錄，保留供追溯。

---

## v1.5.78 — 2026-10-30

### 修正
- 熱鍵調節時同步更新滑桿
  - 之前：w/e、r/t、y/u 只改影片畫面，滑桿 UI 停在舊值
  - 現在：熱鍵改動後滑桿位置與數值同步更新
  - 重設按鈕也改用同一個同步函數

## v1.5.77 — 2026-10-30

### 修正
- 跳過 hover 預覽影片
  - missav 列表頁每個卡片有 `<video class="preview hidden">`
  - 滑鼠經過時 `findVideoElement()` 會選中它，令 `bindVideoElement()` 被反覆呼叫
  - 現在用 className / data-src 判斷並跳過
- 減少 console 噪音
  - `console.log('video bound', videoElement)` -> `console.debug('video bound')`
  - 移除「非影片頁」「最後一段冇數字」的每次呼叫 log（改為靜默返回）

## v1.5.76 — 2026-10-30

### 新增
- badge 批量查詢分批保護
  - PB API filter 走 URL，約 8KB 上限，每條件約 50 字元
  - 每批最多 100 個片號（`BATCH_MAX`）
  - 正常情況（<100 卡片）仍然只有 1 次請求
  - 極端情況自動分批並行

## v1.5.75 — 2026-10-30

### 改善（大幅提速）
- badge 批量查詢
  - 之前：每張卡片各自打一次 PB API，56 個卡片 = 56 次請求 ≈ 11 秒
  - 現在：50ms 收集窗口合併成 1 次查詢（OR 條件），≈ 0.25 秒
  - 提速約 44 倍
  - 跨站通用（missav / jable / fs1.app / av01 共用同一流程）

## v1.5.74 — 2026-10-30

### 修正（嚴重）
- 免費會員無法載入字幕
  - 根因：舊設計用 `access_level='member'` 只開放付費會員
  - 但新設計是「所有字幕開放，免費 3 次 / 會員 100 次」
  - 兩者衝突令免費會員連免費額度都用不到
  - 移除 client 端 `access_level` 檢查（配額已由 server 端自訂路由強制）

## v1.5.73 — 2026-10-30

### 安全性（重要）
- 改用自訂路由 `/api/subtitle-file/{id}` 下載字幕
  - 修復：免費用戶可直接 GET `/api/files/...` 無限下載（完全繞過配額）
  - 新路由在 server 端強制執行配額：
    - 未登入 -> 401
    - 超出配額 -> 403「今日配額已用完，請升級會員」
    - 去重：同用戶+同日+同片+同語言只計一次
    - 未超額 -> 寫 access_logs + 更新 downloads_today
  - `subtitles.srt_file` 欄位設為 hidden，用戶無法拿到真實檔名

### 已知限制
- PB Cloud v0.40.5 不支援以下官方 hook（已實測）：
  - `onFileDownloadRequest` -> 完全冇觸發
  - `onFileTokenRequest` -> 有觸發但 `e.collection` / `e.record` 都是空
  - `routerUse` middleware -> 內建 `/api/files/` 路由先行，唔觸發
- 因此只能用自訂路由

### 效能
- access_logs 加 3 個索引：
  - `idx_alogs_quota` (user, action, result, created)
  - `idx_alogs_dedup` (user, video_id, language, created)
  - `idx_alogs_created` (created)
- 兩個 hook 的查詢由 `limit=0`（返回全部）改成 `limit+1`

## v1.5.72 — 2026-10-30

### 修正（根本性）
- 分類頁誤判片號
  - 用戶報 `/dm273/monthly-hot`、`/dm170/weekly-hot` 仍彈「未找到 DM-273」
  - 之前靠「關鍵字白名單」，missav 出新分類就漏
  - 加入結構性規則：**最後一段冇數字 = 分類頁**
  - 已用 PB 實測驗證：抽樣 3,000 個 video_id 全部含數字
  - 以後加新分類不需再更新 script

## v1.5.71 — 2026-10-30

### 修正
- 分類頁 `/dm177/actresses/北条麻妃` 仍誤觸發
  - 補齊複數形式 `actresses`（原本只有單數 `actress`）
  - 補齊其他分類關鍵字（makers / labels / videos / movies 等 20 個）
- `autoTryFetch()` 執行時再驗證片號
  - 原因：setTimeout 排隊後用戶可能已 SPA 導航到其他頁面
  - 現在會檢查當前頁面片號，不一致就靜靜取消

## v1.5.70 — 2026-10-30

### 修正
- 非影片頁排除清單由 34 個擴充到 90 個關鍵字
  - 用戶報 `/dm597/fc2` 彈「未找到 DM-597」
  - 分成五類：頁面類型 / 分類 / 片商 / 功能頁 / 其他
  - 同時加入「前一段」檢查（例如 `/pornstar/yua-mikami`）

## v1.5.69 — 2026-10-29

### 新增
- 加入简体中文（第 14 種字幕語言）
  - `{ value: 'simplified-chinese', label: '简体中文', flag: '🇨🇳' }`
  - 3,063 條已上傳 PB

### 實作方式
**由繁體中文經 opencc t2s 轉換**，不是重新翻譯。

為何唔從粵語轉：
- opencc `t2s` 係為標準書面語設計
- 粵語有大量專用字（係/哋/咗/嘅/唔/冇/喺）
- `t2s` 會把「係」轉成「系」（錯），「咗」「嘅」保留（粵語專用，簡體無對應）

從繁體中文（標準書面語）轉換安全：
- 例子：身體被兩位姊姊壓低了 -> 身体被两位姐姐压低了
- 額外修正：姊姊 -> 姐姐、妳 -> 你

驗證結果（3,063 個檔案）：
- 空白檔案：0
- 繁體殘留 >3 字：0
- 時間碼異常：0
- 粵語字殘留：11 次（嘢 6 / 咗 3 / 嘅 2，可接受）
- 「唔」3,869 次全部係呻吟聲助詞，正確保留

### 為何支援简体中文

原本只考慮大陸用戶（需翻牆、付款困難、法律風險）。
實際上海外華人大量使用簡體：
- 新加坡（570 萬，華人 74%，簡體為官方）
- 馬來西亞（3,400 萬，華人 23%）
- 印尼 / 泰國 / 美國 / 加拿大 / 澳洲 / 菲律賓

這些用戶：
- 正常上網（唔需要翻牆）
- 有信用卡（BMC 可以用）
- 華語能力好但只習慣簡體

### 迅雷 fallback
`canUseXunlei()` 加入 `simplified-chinese`：
迅雷字幕多數係簡體中文，簡體用戶反而最需要這個 fallback。

### 將來計劃
有付費用戶使用简体中文時，會用 MiniMax 重新翻譯（品質更好）。
現階段用 opencc 轉換係成本最低的方案。

## v1.5.68 — 2026-10-28

### 修正
- 列表頁誤判片號：開 `/dm539/new` 會解析成 `DM-539`，
  然後不停搜尋並彈「未找到 DM-539 嘅字幕」
  - 加入 34 個頁面類型關鍵字排除清單
  - 純 1-4 位數字（分頁）也排除
  - 17 個 URL 模式測試全通過

## v1.5.67 — 2026-10-28

### 改善
- 英文界面標籤更清楚
  - `Language` -> `SUBTITLE LANGUAGE`
  - `UI Language` -> `UI LANGUAGE`
- 中文保持不變（字幕語言 / 界面語言 本來就清楚）
- label 加 `white-space: normal`，容許英文長標籤換行

## v1.5.66 — 2026-10-28

### 修正
- 面板頂部排版
  - 之前：第一行只有 ✕（空的）、第二行才是標題、然後兩條橫線
  - 現在：一行顯示「字幕老師 v1.5.66  ✕」，只有一條分隔線
  - 面板 `padding-top` 40px -> 12px
  - ✕ 的 `top` 8px -> 12px（對齊標題列）
  - 移除 `button-group` 的 `border-top`

## v1.5.65 — 2026-10-28

### 修正
- 標題列位置：`appendChild` 會排到面板底部 -> 改用 `insertBefore` 放最前

## v1.5.64 — 2026-10-28

### 新增
- 回報功能帶除錯資訊
  - 回報面板顯示版本號：「番號: CHUC-194  版本: 1.5.64」
  - 提交時帶 `app_version` / `ui_lang` / `user_agent` 到 PB
  - PB `reports` collection 新增 3 個欄位

## v1.5.63 — 2026-10-28

### 新增
- 面板頂部顯示 app 名稱 + 版本號
  - 中文界面：`字幕老師 v1.5.63`
  - 英文界面：`SubSensei v1.5.63`
  - 版本號優先讀 `GM_info.script.version`
- 加 `@grant GM_info`

### 目的
方便用戶回報問題時講清楚用邊個版本。

## v1.5.62 — 2026-10-28

### 新增
- 加入俄語（第 13 種字幕語言）
  - `{ value: 'russian', label: 'Русский', flag: '🇷🇺' }`
  - 建立翻譯資源：`_prompt_pvt_ru.txt` + `_glossary_ru.txt`
  - 67 條樣本已翻譯並上傳 PB

### 背景
AV01 的語言選單有 🇷🇺 Русский，確認俄羅斯有市場。

## v1.5.61 — 2026-10-28

### 修正
- AV01 片頁字幕容器
  - 加 `.aspect-video.bg-gray-900` 選擇器
  - 容器等待時間 10 秒 -> 30 秒（AV01 是 SPA，video 較遲建立）
  - 移除每秒的 `console.warn`（10 秒內噴 20 次，手機 console 太亂）

## v1.5.60 — 2026-10-28

### 修正
- AV01 列表頁卡片選擇器
  - 實際結構：`<a href="/hk/video/..."> > div.group`
  - 卡片選擇器改為 `.group`
  - badge 容器：`.aspect-video-av01-cover`
  - link 選擇：`a[href*="/video/"]`

## v1.5.59 — 2026-10-28

### 新增
- 支援 3 個新站點（@match 由 7 個擴展到 13 個）
  - `fs1.app`（jable.tv 鏡像）
  - `av01.media` / `av01.tv`
- 站點判斷常數（放在 IIFE 開頭，避免 TDZ 錯誤）
  - `IS_JABLE` = jable.tv 或 fs1.app
  - `IS_AV01` = av01.*
- AV01 片號解析（多層 fallback）
  - FC2 / 數字開頭 / H_ / 標準格式 / 退回 h1

## v1.5.58 — 2026-10-28

### 修正
- 移除 `preferredLanguage` 雲端覆蓋
  - `syncSettingsFromCloud()` 從 PB 讀到舊值後靜默覆蓋本地設定
  - 導致：面板顯示 en，但 F5 後 badge 變回 zh-tw 的結果
  - 語言屬裝置偏好（手機同電腦可以唔同），純 localStorage 更合理

## v1.5.57 — 2026-10-28

### 修正
- badge cache 按語言隔離
  - key 由 `vid` 改為 `vid__lang`
- 非中文語言不顯示 `xunlei_hit`
  - 新增 `normalizeBadgeStatus()`
- 切換語言時重算所有 badge
  - 新增 `refreshAllBadges()`
  - `langSelect.onchange` 偵測到改變 -> 重新處理所有卡片

## v1.5.56 — 2026-10-28

### 修正（嚴重）
- 迅雷 fallback 無法載入
  - 根因：v1.5.47 清 metadata 時誤刪 `@connect geilijiasu.com`
  - 實際迅雷 API 返回的 SRT URL 是 `https://subtitle.v.geilijiasu.com/...`
  - 補回 3 個 `@connect`
  - 用戶實測：SRT 成功載入
- 輸入框垂直置中
  - `padding: 5px 8px` -> `0 8px`
  - `line-height: 28px` + `text-align: center`

## v1.5.55 — 2026-10-28

### 修正
- 補齊漏網中文字串（英文 UI 下仍見中文）
  - 回報面板：回報/請求、番號、提交、取消
  - 升級彈窗：付款 Email 提示
  - 配額：今日 N/M
  - 17 個模板字串（toast / throw Error 內）
- `Back` -> `Backward`
- 狀態欄拆成三行（email / 配額 / actions）
  - 之前 email + 配額擠同一行，長 email 會遮住配額

## v1.5.54 — 2026-10-28

### 改善
- 中英文各自字體大小
  - 中文按鈕 14px（保持 v1.5.39 大小）
  - 英文按鈕 12px（英文標籤較長）
  - 用 `body[data-ui-lang="en"]` 選擇器區分

## v1.5.53 — 2026-10-28

### 修正
- 界面語言旗幟：🇭🇰 -> 🇹🇼（繁體中文應該用台灣旗）
- 英文 UI 字太大撐爆按鈕
  - `font-size: 14px` -> `12px`
  - `white-space: nowrap` -> `normal`（允許換行）
- 底部橫向滾動條
  - 面板加 `overflow-x: hidden`
  - `button-group` 加 `min-width: 0`
- 升級彈窗全部 i18n（9 個新 key）
- **移除壓迫文案**「⚠️ 而家唔買，日後價格會調整為下列原價」
  - 原因：項目已定位為 SIP，唔應該 pushy 逼人付款
- 英文標籤縮短 49 個（Local Subtitles -> Local 等）

## v1.5.52 — 2026-10-28

### 改變
- 界面語言由 12 種減到 2 種（繁體中文 + English）
  - 用戶決定：layout 較易維護
- 字幕語言移除日本語（日語 = STT 原文，唔需要選）
- 檔案大小：273 KB -> 180 KB（減 93 KB）
- `detectUiLang` 非中英文 fallback 由 zh-tw 改成 en

## v1.5.51 — 2026-10-28

### 修正（嚴重）
- **bubble 完全消失**
  - 根因：`const PLANS = [{ label: t('plan.monthly') }]`
    `t()` 定義在 1,745 行之後，`const` 唔 hoist
    -> `ReferenceError: Cannot access 't' before initialization`
    -> 整個 IIFE 崩潰，`createFloatingBall()` 從未執行
  - 修法：`PLANS` 改成函數 `getPlans()`，延遲到呼叫時才執行
  - 驗證：寫了 Node 模擬載入器測試 IIFE 是否完整執行

## v1.5.50 — 2026-10-28

### 新增
- 完整 UI i18n（12 種語言，1,596 條翻譯）
  - 130 個含中文的 UI 字串抽出並翻譯
  - `t(key, vars)` 函數，三層 fallback
  - `detectUiLang()` 由瀏覽器語言偵測
  - 設置面板加「界面語言」下拉

### 翻譯方法
用本地 Hy-MT2-7B 翻譯。
批次模式失敗（max_tokens 截斷），改單條模式（132 次呼叫我語言）全部成功。

## v1.5.49 — 2026-10-28

### 新增
- 字幕語言擴展到 13 種
  - 新增：日本語、Melayu、ไทย、Tiếng Việt、Bahasa Indonesia、Filipino、Deutsch、Français、Português
  - 全部加國旗 emoji

### 重構
- 消除 5 處硬編碼 `preferredLanguage === 'cantonese' || ...`
  - 改成 `canUseXunlei(lang)` helper
- 新增 `currentLangLabel(lang)`（toast 顯示中文名而唔係代碼）

## v1.5.48 — 2026-10-28

### 新增
- 支援 jable.tv 列表頁 badge
  - 卡片結構：`a[href="/videos/xxx/"] > .img-box > .video-img-box`
  - 三個改動：卡片選擇器 / link 選擇 / badge 容器
- **關鍵安全性設計**：`.video-img-box` 同時用於 `VIDEO_CONTAINER_SELECTORS`
  - 所有 jable 邏輯用 `IS_JABLE` 包住，避免 missav 誤判

## v1.5.47 — 2026-10-28

### 改變
- 改名：`missav helper` -> `SubSensei`
- 中文名：`字幕老師`（zh-TW / zh-HK）、`字幕老师`（zh-CN）
- 作者：`時光Alex` -> `neo2codes`
- 移除沒用到的 `@connect`（xunlei.com / geilijiasu.com）

### ⚠️ 引入回歸
誤刪 `@connect geilijiasu.com` 導致 v1.5.56 前迅雷 fallback 無法載入。

## v1.5.46 — 2026-10-28

### 改善
- script 內 changelog 精簡成 1 行
  - `/* v1.5.46 | 完整版本記錄：https://github.com/.../CHANGELOG.md */`
  - 3,893 行 -> 3,876 行（減 17 行）

## v1.5.45 — 2026-10-28

### 修正
- 多次撳「設置」會累積多個「保存設置」按鈕
  - 根因：`querySelector` 只返回第一個，只移除一個
  - 修法：改用 `querySelectorAll` + 迴圈全部移除

## v1.5.44 — 2026-10-28

### 修正
- 亮度 / 對比度滑桿範圍 0.5~2.0 -> 0.5~1.5
  - 原本 1.00 在左側 1/3 位置，用戶以為唔對
  - 現在 1.00 是正中間
- 熱鍵 `w/e/r/t` 的 clamp 範圍同步改成 0.5~1.5
- 重設按鈕加 `preventDefault` + 保存/還原 `scrollTop`（防止面板跳動）

## v1.5.43 — 2026-10-28

### 修正
- 調節面板改用內嵌展開（同「設置」一樣）
  - 之前用浮動彈窗，定位錯亂
  - 重設按鈕同時更新滑桿圓點位置

## v1.5.42 — 2026-10-28

### 新增
- 新增「調節」按鈕（亮度 / 對比度 / 飽和度滑桿）
  - 解決 iOS Safari / 手機冇鍵盤快捷鍵的問題

### 改善
- Changelog 從 script 內搬到 CHANGELOG.md
  - 原本 297 行（23 KB）用戶根本唔會睇
  - script 內只保留最近 3 個版本一行摘要
  - 檔案 171 KB -> 156 KB（減 279 行）

## v1.5.41 — 2026-10-23

- 準備 Open Beta
  - @namespace 改為 https://github.com/neo2codes/missav-helper
  - 加 @updateURL / @downloadURL 指向 GitHub raw （Tampermonkey 會自動檢查新版本）
  - 加 @supportURL / @homepageURL

## v1.5.40 — 2026-10-19

- 升級彈窗改為 4 個方案（Beta MVP 測試）
  - 月費 USD$5 / 月    —— 劃線（暫唔賣）
  - 年費 USD$50 / 年    —— 劃線
  - 終身一次性 USD$70   —— 劃線
  - Founder 創辦會員 USD$30 LTD —— ✅ 唯一可買，黃框突出
- 付款連結由 Lemon Squeezy 改為 Buy Me a Coffee
  - https://buymeacoffee.com/neo2codes
  - BMC 唔支援 custom_data，改靠 webhook 用 email 比對
  - worker_bmc_webhook 已支援「累計金額」模式（門檻 15 → 30）
- 劃線方案點擊只提示「會加價」，唔會開連結
- 文案加「⚠️ 而家唔買，日後價格會調整為下列原價」
- 付款累計 + 補領全部由 PB Cloud Hook 處理（bmc_webhook.pb.js）
  - POST /api/bmc-webhook?token=xxx  ← BMC
  - POST /api/founder-claim          ← 本 script 補領
  - 移除 @connect workers.dev
  - 前端永不寫 plan / paid_until（只有伺服器有權）
- 付款後自動補領（autoClaimFounder）：
  - BMC 付款頁有自己的 Email 欄，用戶可能填與註冊不同的電郵
  - 載入頁面 3 秒後、以及每次開面板時，靜默 POST /api/founder-claim
  - 伺服器驗證 user_id + email 一致 + 累計 >= 30 才開通
  - 10 分鐘 cooldown，避免頻繁請求
- Founder 付款前加確認框（showFounderConfirm）：
  - 大字顯示用戶登入 Email + 「複製」按鈕
  - 提醒「填錯 Email 會導致無法自動開通」
  - 用戶撳「已確認，前往付款」才開 BMC；點背景或取消則關閉
- 劃線樣式：改用 text-decoration 讓每行文字各自有中線 （偽元素方案是一條橫跨整個按鈕的線，唔係穿過每個字）
- 🔴 修正：buildCheckoutUrl 加 ?email= 會令 BMC 付款彈窗永遠卡在 loading
  - 實測 https://buymeacoffee.com/neo2codes?email=xxx → spinner 唔停
  - 原因：BMC 冇實作該參數，Stripe 表單初始化失敗
  - 已移除；連結保持純淨，電郵由用戶自己填

## v1.5.39 — 2026-10-19

- 換色：主色改用 missav.ai 本身嘅 「bg-primary」
  - 來源：dm278/chinese-subtitle 分頁器「1」號嘅 background
  - 值：#FE628E（原本用 9pick 嘅 #ff5c8f，差唔多但唔同）
- 文字改用 Nord：nord6 #ECEFF4（主）/ nord4 #D8DEE9（副） （同 missav 分頁器文字一致）
- 字型 Inter 排第一（同樣取自 missav.ai）
- Panel 背景改為同「升級 SubSensei 會員」彈窗一致：
  - #1a0f14 → #24151c（原本提亮到 #2a1a22，用戶改為要彈窗色）
- 主面板 5 個按鈕（本地字幕/擷取字幕/清空字幕/設置/回報） 改用方案框的粉色漸變 linear-gradient(135deg, #FE628E, #d63b6f)
  - hover 改為 #FF8FAB → #FE628E
  - 用戶明確要求全部粉色（放棄主次之分）
- Badge 顏色全部改用 CSS 變數（原本 hard code #28a745 等）
  - 綠 #2eb872 / 橙 #fd7e14 / 黃 #f0a020 / 灰 用 --ms-text-dim
- 登入狀態文字（test@x.com (會員) | 今日 15/100）：
  - 綠色由 rgba(60,200,120,0.8)（半透明，在櫻紅底上偏灰） 改為實色 #4ADE80（emerald-400，對比度 ≈ 9.4:1）
  - 字級 10px → 11px → 12px（深底細綠字長時間睇易疲勞）
- 修正：回報 / 請求 panel 的下拉選單白底白字睇唔到
  - <select> 同 <textarea> 由 rgba(255,255,255,0.08) 半透明 改為實色 #24151c + #ECEFF4
  - <option> 明確加 background/color（部分瀏覽器用系統白底）
  - 加 placeholder 顏色 #a8b0c0、focus 邊框用 --ms-accent
  - .lang-select 的 <option> 同樣修正
- 修正：登入狀態 bar email 長時「登出」被擠到第二行斷字
  - 拆成兩行：第一行 email + 方案 + 今日配額（超出用省略號，hover 有 title）
  - 第二行「升級  登出」獨立一行，white-space: nowrap
  - .auth-action 加 display:inline-block 令 nowrap 生效
- 修正：右上 ✕ 關閉按鈕過大並壓住分隔線
  - 根因：.custom-control-panel button 的 min-height:34px / padding:7px 8px 把只有 24px 的 ✕ 撐大（我上一版加 min-height 造成）
  - 改用 .custom-control-panel .panel-close-btn + 全部 !important， 鎖死 22px / transparent 背景 / min-height:0
  - panel padding-top 34px → 40px，確保 ✕ (8+22=30) 與 button-group 頂線有距離
- 字級放大（用戶反映太細）：
  - 主面板按鈕（本地字幕/擷取字幕/清空字幕/設置/回報/保存設置） 12px → 14px，min-height 30px → 34px
  - 浮動球「字幕」12px → 15px，球體 52px → 56px
  - 登入狀態 11px → 12px

## v1.5.37 — 2026-10-18

- 全新主題「Sakura Noir」：粉紅系取代舊深藍系
  - 設計取自 9pick（style.css 嘅粉紅 palette）， 但 panel 浮喺 missav 黑底上，淺粉會刺眼， 所以壓暗成「深櫻紅黑」（#1a0f14 底 + #ff5c8f 主色）
  - 全部顏色改用 CSS 變數（--ms-*），方便日後一次性調整
- 字型換成香港優先 stack（同 9pick 一致）： PingFang HK → PingFang TC → Noto Sans HK → Noto Sans TC → Microsoft JhengHei → system-ui （台灣用戶會自然 fallback 到 PingFang TC / 微軟正黑體，唔會出豆腐格）
- 浮動球改為粉紅漸變 + 白字，喺黑底上更易見到
- ⚠️ Badge 四色（綠字幕 / 橙殘次 / 黃補充 / 灰無）刻意保留唔變， 因為嗰啲係功能色，改用主題色會影響辨識
- ⚠️ 冇提供「切返舊主題」選項（用戶決定直接換）

## v1.5.36 — 2026-10-18

- 新增 badge 狀態: 殘次（橙色 #fd7e14）
  - PB 有記錄但 quality='partial'（字幕檔案 < 2KB）→ 顯示「殘次」
  - 其餘維持綠「字幕」/ 黃「補充」/ 灰「無」
- PB subtitles collection 新增 quality 欄位（select: premium/partial）
  - 9,940 條 < 2KB 標 partial，32,404 條標 premium
  - 判斷依據：已實測 file size >= 2KB 但「片長 >= 10 分鐘而 cues < 20」= 0 條（零漏判）
- badge 查詢 fields 由 `id` 改為 `id,quality`（同一個 request，冇額外開銷）
- 快取 (missavBadgeCache) 會存新狀態，舊 cache 一小時後自然過期

## v1.5.35 — 2026-10-18

- 後端搬遷: PocketBase instance 由 starter plan 搬去 pro plan
  - PB_URL: d0w6nmvdq46dyxq.fbjc → vshvhdducfsxo8o.m0tw
  - @connect 同步更新
  - 新 instance 用完全一樣嘅 collection ID（pbc_3272748830 等）， script 邏輯零改動，只換 endpoint
  - 字幕內容一併換成 FIXED 版（時間軸修正）
- ⚠️ 舊 instance 仍然可以連，但 1.5.35 起只會打新 instance

## v1.5.34 — 2026-10-18

- 修正(FC2-PPV-4496835 字幕載入唔到): access_level='member' 被誤攔
  - 新增 refreshMembership() —— 判會員前先同 PB auth-refresh 對一次 plan
  - auth token 過期時 clearStaleAuth() 清死 token（以前靜靜卡死喺舊 plan）
  - access gate 改用 isMemberActive()（同 currentQuotaLimit() 一致）， 唔再另寫一套 pbUserPlan 判斷（違反鐵律 §8.2）
  - autoTryFetch() 先確認會員再判配額；配額爆都出 toast（以前完全靜默）
  - 攔截時 console.warn 印齊 videoId / plan / paid_until，方便診斷
- 已知(未修, 顯示層): subtitles.title 同 release_date 42,326 條全部係空 —— 成功載入後嘅 toast 只會顯示番號，唔會顯示片名

## v1.5.33 — 2026-09

- 修正: status bar「升級」「登出」加 spacing 分清 —— 之前兩個 action 貼埋一齊(顯示為「升級登出」)，而家加 margin-left 10px + padding， 同 info text 有 gap；「升級」同「登出」之間分開清晰

## v1.5.32 — 2026-09

- 修正(方法C quota 一致性): daily quota gate 改用 currentQuotaLimit() = 有效 member(member且paid_until未過先100),過期/結費 → 3
- 新增 currentQuotaLimit() helper;auth bar/手動fetch/auto-fetch 三處 quota 判斷統一
- 移除「plan=member 就當100」漏洞: member 過期都要鎖返 free quota

## v1.5.31 — 2026-09

- 新增：升級會員功能 —— 登入狀態 bar 加「升級」掣，開 membership modal (月費 HK$39 / 年費 HK$390 / 終身 HK$545)
- 新增：LSn checkout link 自動帶 user_id (custom_data)，令 webhook 認返用戶
- 新增：paid_until 判斷 —— member 過期鎖返存取，顯示「會員(已過期)」+ 續期提示
- 登入/refresh 時讀埋 paid_until 落 localStorage / pbUser

## v1.5.30 — 2025-08-31

- 優化：播放頁主影片 SRT 優先 — sidebar/list badge 檢查喺主影片 auto-fetch 進行期間延遲 (最多 3 秒)，主影片完成後先 check badge (cache 依然有效，check 過嘅直接跳過)

## v1.5.29 — 2025-08-31

- 新增：自動載入字幕 — 入 video 頁自動檢查 PB SRT 並載入 (唔使㩒「擷取字幕」掣，等 800ms 後自動觸發)
- 改進：迅雷 fallback 自動載入第一個結果，唔再顯示選擇清單 (API 結果通常相同/類似，無需用戶手動揀)

## v1.5.28 — 2025-08-31

- 調整：畫面調整 (亮度/對比/飽和) 改淨係存 localStorage，唔 sync 上 server (每個影片色調唔同，用戶逐條片重調，雲端記錄無意義)

## v1.5.27 — 2025-08-31

- 優化：畫面調整雲端同步加 debounce — 連續㩒熱鍵只 send 一次 request（停手 800ms 後先 sync），唔會產生大量請求

## v1.5.26 — 2025-08-31

- 新增：VLC 式畫面調整熱鍵 w/e = 亮度 -/+ (0.5–2.0) r/t = 對比度 -/+ (0.5–2.0) y/u = 飽和度 -/+ (0–2.0) 設定自動存 localStorage + 雲端同步

## v1.5.25 — 2025-08-31

- 移除：settingsPayload 同 schema 中無用的 sourceHost field

## v1.5.24 — 2025-08-31

- 修復：Toast 文字唔會再被截斷顯示 ... (加 word-break/overflow-wrap)

## v1.5.23 — 2025-08-31

- 改進：Toast 改用 stack 顯示 — 新訊息向上堆疊，唔會遮住舊訊息

## v1.5.22 — 2025-08-31

- 改進：PocketBase fetch 成功後自動收起 panel 變返浮動波

## v1.5.21 — 2025-08-31

- 新增：登入/註冊密碼欄加 👁 eye toggle button，可切換顯示/隱藏密碼

## v1.5.20 — 2025-08-31

- 遷移：PocketBase 由 PocketHost 遷移到 PocketBase Cloud PB_URL 改為 d0w6nmvdq46dyxq.fbjc.pocketbasecloud.com @connect 改為 *.pocketbasecloud.com

## v1.5.19 — 2025-08-26

- 修復：登入/註冊由 fetch() 改為 gmRequest() (PocketHost 會 truncate 瀏覽器 fetch() 的 auth token， 導致登入後所有 API call (saveSettings/syncSettings) 都 401 失敗)

## v1.5.18 — 2025-08-25

- 修復：設置雲端同步 — saveSettings 由 fetch() 改為 gmRequest() (PocketHost 會 truncate 瀏覽器 fetch() 的 auth token，導致 missav_settings 無法同步)

## v1.5.17 — 2025-07-13

- 改進：選擇在線字幕後自動收起 panel 變返浮動波

## v1.5.16 — 2025-07-08

- 重構：2 tier business model (free/member) + access_level check
- 修復：Server-side quota enforce
- 改進：member quota 10→100

## v1.5.15 — 2025-07-06

- 新增：Server-side quota enforce — fetch 前 check server downloads_today

## v1.5.14 — 2025-07-06

- 新增：回報/請求 button → reports collection

## v1.5.13 — 2025-07-06

- 修復：Settings cloud sync 雙向 — login 時從雲端 load settings 到 localStorage

## v1.5.12 — 2025-07-06

- 新增：一頁式設定 — [設置] button toggle 顯示/隱藏 setting rows
- 刪除：收起面板 button（✕/ESC/click outside 已 cover）
- 改進：button 排列 [本地字幕] [擷取字幕] [清空] [設置] ✕

## v1.5.11 — 2025-07-06

## v1.5.10 — 2025-07-06

## v1.5.9 — 2025-06-22

## v1.5.8 — 2025-06-22

## v1.5.7 — 2025-06-22

- 重構：刪除 在線搜索 button，整合入擷取字幕做 fallback
- 新增：擷取字幕 logic — PB → 迅雷 fallback (只限 廣東話/繁體中文)

## v1.5.6 — 2025-06-22

## v1.5.4 — 2025-06-22

- 修復：Fetch 時 language key case-insensitive match (Cantonese → cantonese)

## v1.5.3 — 2025-06-22

- 新增：UI styling — Studio Noir 風格 (深色主題 + 藍色 accent)

## v1.5.2 — 2025-06-22

- 新增：Settings sync to PocketBase cloud (missav_settings collection)
- 改進：加大 panel font-size (12px → 14px)

## v1.5.1 — 2025-06-22

- 修復：Fetch 改用 GM_xmlhttpRequest + file token 方式下載 SRT
- 修復：開 page / login 時 sync quota from server (downloads_today, plan)
- 修復：Fetch 成功後 background write access_log + PATCH downloads_today
- 修復：users updateRule set to @request.auth.id = id (allow self-update)
- 改進：local quota check (instant) + server sync (refresh proof)

## v1.5.0 — 2025-06-22

- 新增：PocketBase 登入/註冊功能
- 新增：語言選擇器 (廣東話/繁體中文/英文/韓文)
- 新增：擷取字幕按鈕 (Fetch from PocketBase)
- 改進：access_level 控制 (free/member/paid)
- 改進：每日 fetch 配額限制

## v1.4.3 — 2025-06-22

- 改進：快捷鍵默認值互換 —  x=倒退 ⏪, c=快進 ⏩

## v1.4.2 — 2025-06-22

- 新增：面板右上角 ✕ 關閉掣
- 新增：按 ESC 鍵收起面板
- 改進：翻譯全部轉爲繁體中文 ============================================ */