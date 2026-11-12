# SubSensei ｜ 字幕老師 — 常見問題（FAQ）

---

## 安裝問題

### Q: 邊個平台可以用？

**A:** 三個平台都支援：

| 平台 | 瀏覽器 | Userscript Manager | 狀態 |
|---|---|---|---|
| 🖥️ 電腦 | Chrome / Edge / Brave / Opera | Tampermonkey | ✅ |
| 🖥️ 電腦 | Firefox | Tampermonkey | ✅ |
| 🖥️ macOS | Safari | Tampermonkey / Userscripts | ✅ |
| 📱 iOS / iPadOS | Safari | **Userscripts**（免費）| ✅ |
| 📱 iOS / iPadOS | Safari | Tampermonkey（付費）| ✅ |
| 🤖 Android | **Firefox** | **Tampermonkey** | ✅ **推薦** |
| 🤖 Android | Microsoft Edge | Tampermonkey | ✅ |
| 🤖 Android | Chrome | — | ❌ 不支援 |
| 🤖 Android | Kiwi Browser | Tampermonkey Legacy | ⚠️ 唔建議（已停維護）|

**⚠️ Android 唔可以用 Chrome** —— Chrome for Android 唔支援 extensions。

### Q: iOS 點樣安裝？

**A:** 用 **Userscripts**（免費 App）為例：

1. **App Store** 搜尋「Userscripts」→ 安裝
2. 開 Userscripts app → 撳「**Set Userscripts Directory**」→ 選一個資料夾
3. **設定** → **Safari** → **擴充功能**
4. 撳 **Userscripts** → 開啟「允許」
5. 權限設「**允許所有網站**」
6. 用 **Safari** 開安裝連結
7. 撳網址欄左邊「**aA**」→ **Userscripts** → **Install**

**驗證：** 開 missav.ai 任何一條片，左下角應該見到粉紅色「字幕」球。

**⚠️ iOS 冇鍵盤快捷鍵**，用面板「調節」按鈕調畫面。

### Q: Android 點樣安裝？

**A:** 用 **Firefox**（推薦）：

1. **Google Play** 安裝 [Firefox](https://play.google.com/store/apps/details?id=org.mozilla.firefox)
2. 用 Firefox 開 [Tampermonkey for Firefox](https://addons.mozilla.org/android/addon/tampermonkey/)
3. 撳「**Add to Firefox**」→「**Add**」
4. 用 Firefox 開安裝連結
5. 撳「**安裝**」

**如果 Firefox 唔俾裝 extension：**
- 開 Firefox → 右上角「⋮」→ **Settings** → **Extensions**
- 如果冇 extensions 選項，更新 Firefox 到最新版

**或者用 Microsoft Edge：**
1. Google Play 安裝 [Edge](https://play.google.com/store/apps/details?id=com.microsoft.emmx)
2. 用 Edge 開 [Tampermonkey for Edge](https://microsoftedge.microsoft.com/addons/detail/iikmkjmpaadaobahmlepeloendndfphd)
3. 撳「**Get**」→「**Add extension**」

**⚠️ Chrome for Android 唔支援 extensions。**

**⚠️ Kiwi Browser 唔建議：**
Tampermonkey 官方 FAQ 已標明 Kiwi Browser 係 *"unmaintained"*（停止維護），
建議用 Firefox 或 Edge。

### Q: 撳安裝連結冇反應？

**A:**
1. 確認已安裝 Tampermonkey（或 Safari 的 Userscripts）
2. Safari 需要喺「設定 → Safari → 擴充功能」啟用 Userscripts
3. Chrome 確認 Tampermonkey 有「允許存取檔案網址」權限

### Q: Tampermonkey 顯示「這個 script 有潛在危險」？

**A:** 呢個係標準警告。撳「仍然安裝」即可。

原因：script 需要 `GM_xmlhttpRequest` 權限去連 PocketBase 伺服器。

### Q: 可用在手機嗎？

**A:** 可以，iOS 同 Android 都支援：

- **iOS / iPadOS**：Safari + Userscripts（免費）
- **Android**：Firefox + Tampermonkey（推薦）或 Microsoft Edge + Tampermonkey
- **❌ Android Chrome**：唔支援 extensions
- **⚠️ Kiwi Browser**：已停止維護，唔建議

### Q: 部署後見到「存取新網域」提示？

**A:** 撳「允許」。

SubSensei 需要這些網域權限：
- `api-shoulei-ssl.xunlei.com`（迅雷字幕 API）
- `geilijiasu.com` / `v.geilijiasu.com`（迅雷 SRT 下載）
- `*.pocketbasecloud.com`（字幕庫 + 帳號）

---

## 使用問題

### Q: 面板（粉紅色球）冇出現？

**A:** 逐步檢查：

1. 確認你喺**播放頁**（`missav.ai/xxxxx` 之類），唔係首頁或列表頁
2. 檢查左下角有冇粉紅色「字幕」球
3. 開 Console（F12）睇有冇紅色錯誤
4. Tampermonkey 圖示睇 SubSensei 有冇啟用
5. 重新載入頁面

### Q: 字幕載入唔到？

**A:** 可能原因：

| 原因 | 檢查方式 |
|---|---|
| 該片未有字幕 | 面板徽章顯示「無」|
| 每日配額用完 | 睇面板底部「今日 N/3」|
| 語言選錯 | 設置 → 字幕語言 |
| 網絡問題 | 檢查防火牆有冇擋 `*.pocketbasecloud.com` |

### Q: 徽章一直顯示「偵測」？

**A:** Script 正在查詢伺服器。如果超過 10 秒：

1. 重新載入頁面
2. 檢查登入狀態（面板底部應該見到你嘅 email）

### Q: 字幕時間軸唔對？

**A:** 面板 → 「設置」→ 字幕偏移，調整 -10 到 +10 秒。

### Q: 可以改字幕顏色 / 大小？

**A:** 可以。面板 → 「設置」→ 字幕顏色 / 字幕大小 / 字幕位置。

### Q: 手機冇鍵盤，點調節畫面？

**A:** 撳面板「調節」按鈕，會展開 3 個滑桿：亮度 / 對比度 / 飽和度。

### Q: 列表頁點知邊條片有字幕？

**A:** 每張卡片右上角有徽章：

| 徽章 | 顏色 | 意思 |
|---|---|---|
| 字幕 | 🟢 綠 | 完整字幕 |
| 殘次 | 🟠 橙 | 字幕內容殘缺 |
| 補充 | 🟡 黃 | 迅雷來源（中文語言限定）|
| 無 | ⚪ 灰 | 冇字幕 |

### Q: 切換字幕語言後，徽章顏色變咗？

**A:** 正常。唔同語言有唔同字幕，所以徽章會按語言重新計算。

例如：粵語有字幕（綠），但 English 冇（灰）。

---

## 帳號問題

### Q: 忘記密碼？

**A:** 目前冇自助重設功能。請喺 [GitHub Issues](https://github.com/neo2codes/subsensei/issues) 提出。

### Q: 每日配額幾時重置？

**A:** 每日香港時間 00:00（UTC+8）。

- 免費用戶：3 次
- 贊助者：100 次

### Q: 點知自己係咩身份？

**A:** 面板底部顯示：

```
your@email.com
(Member) | 今日 0/100     ← 贊助者
```

```
your@email.com
(免費會員) | 今日 0/3     ← 免費用戶
```

### Q: 可以多部裝置用同一帳號嗎？

**A:** 可以。配額係帳號層級，多裝置共用同一個配額。

### Q: 字幕語言設定會同步嗎？

**A:** 唔會。字幕語言屬**裝置偏好**，存在本機 localStorage。

原因：手機同電腦可以設唔同語言（例如手機睇粵語、電腦睇英文）。

**界面語言**同樣係裝置偏好，唔會同步。

---

## 付款問題

### Q: 捐款係購買會員嗎？

**A:** **唔係。**

SubSensei 係 Subtitle Instrumentality Project（字幕補完計劃）嘅工具。
你嘅捐款係**贊助項目建設**（字幕翻譯、伺服器、開發），
SubSensei 贊助者額度係我哋嘅**回贈**，唔係商品交易。

### Q: 捐款用嚟做咩？

| 用途 | 說明 |
|---|---|
| **GPU 翻譯** | 最多，翻譯字幕需要大量 GPU 時間 |
| **伺服器** | PocketBase Cloud 月費 |
| **儲存** | 315,317 條字幕 ≈ 9.8 GB |
| **開發** | 持續維護 + 新功能 |

### Q: 付咗錢但冇開通？

**A:** 逐步檢查：

1. 確認付款時填嘅 **Email 同註冊 Email 一致**（最重要）
2. 重新載入網站頁面（script 會自動檢查）
3. 等 5 分鐘再試（webhook 可能有延遲）
4. 仍未開通 → [GitHub Issues](https://github.com/neo2codes/subsensei/issues) 報告，附上：
   - 你嘅註冊 email
   - BMC 付款收據截圖
   - 付款時間

### Q: 付款時 Email 填錯咗點算？

**A:** 喺 [GitHub Issues](https://github.com/neo2codes/subsensei/issues) 提出，提供：
- BMC 收據上的 email（錯的那個）
- 你正確的註冊 email
- 付款時間 + 金額

我哋會手動對應。

### Q: 可以退款嗎？

**A:** 請聯絡 [Buy Me a Coffee](https://buymeacoffee.com/neo2codes) 或喺 GitHub Issues 提出。

### Q: 我唔想捐款可以用嗎？

**A:** **可以。** 免費額度 3 次/日，字幕庫完全開放，功能完全一樣。

### Q: 有咩付款方式？

**A:** 透過 [Buy Me a Coffee](https://buymeacoffee.com/neo2codes)：
- 信用卡
- Crypto
- Cash App Pay

### Q: 幾時會加價？

**A:** Beta 期間 Founder 額度（USD$30）係限定價。
正式推出後價格會調整，但**已經成為贊助者嘅唔受影響**。

---

## 字幕問題

### Q: 想請求某條片嘅字幕？

**A:** 面板 →「回報」→ 選「請求字幕」→ 填片號。
會加入待做清單（冇保證時間）。

### Q: 發現字幕有錯字？

**A:** 面板 →「回報」→ 選「字幕錯字」→ 描述問題。

### Q: 徽章嘅「殘次」係咩意思？

**A:** 有字幕但內容殘缺（少於 2KB）。

**常見原因**：語音辨識（STT）本身只出咗極少 cue，
例如 2 小時影片只有 1 句字幕 —— 呢啲需要重做 STT，
唔係翻譯問題。

**仍然可以載入**，但質素較差。

### Q: 支援邊啲語言？

**A:** 14 種：

🇭🇰 廣東話 / 🇹🇼 繁體中文 / 🇨🇳 简体中文 / 🇬🇧 English / 🇰🇷 한국어 /
🇲🇾 Melayu / 🇹🇭 ไทย / 🇻🇳 Tiếng Việt / 🇮🇩 Bahasa Indonesia /
🇵🇭 Filipino / 🇩🇪 Deutsch / 🇫🇷 Français / 🇧🇷 Português / 🇷🇺 Русский

**唔支援**：日本語（STT 原文，唔需要另外翻譯）

### Q: 某種語言完全冇字幕？

**A:** English（3,063 條）同简体中文（3,063 條）已完成。其他 10 種目前各 149 條，擴展中。

**简体中文適合**：大陸、新加坡、馬來西亞同海外簡體中文用戶。
品質由繁體中文經 opencc t2s 轉換，有付費用戶後會用 MiniMax 重新翻譯。

粵語（81,443）、繁體中文（17,882）、English（39,385）同简体中文（81,234）係最完整嘅。

---

## 支援網站

### Q: 支援邊啲網站？

**A:**

| 網站 | 狀態 |
|---|---|
| MISSAV（5 個域名）| ✅ |
| Jable | ✅ |
| fs1.app（Jable 鏡像）| ✅ |
| AV01（av01.media / av01.tv）| ✅ |
| Supjav | 🔜 計劃中 |
| JAVXXX | 🔜 計劃中 |

### Q: 同其他字幕 script 衝突？

**A:** 如果同時裝咗其他字幕 script，可能會有兩個面板。建議只裝一個。

---

## 技術問題

### Q: Script 會唔會偷我資料？

**A:** 唔會。Script 只發送：

- 登入憑證（email + 密碼，經 HTTPS）
- 你請求嘅片號（用嚟算配額）
- 回報時的版本號 + UI 語言 + 瀏覽器 UA

**程式碼完全開源，可以自己審查。**

### Q: 如何知道用緊邊個版本？

**A:** 兩個方法：

1. **面板頂部**：顯示「字幕老師 v1.0.0」或「SubSensei v1.0.0」
2. **Tampermonkey Dashboard**：script 列表見到版本號

### Q: 點樣更新？

**A:** Tampermonkey 會自動檢查（24 小時內）。

手動更新：Tampermonkey Dashboard → SubSensei → 撳「檢查更新」。

### Q: 回報問題時要帶咩資料？

**A:** 撳面板「回報」會自動帶：

| 資料 | 用途 |
|---|---|
| 片號 | 邊條片 |
| **版本號** | 判斷係邊個版本 bug |
| **UI 語言** | 判斷語言相關問題 |
| **瀏覽器 UA** | 判斷 Safari/Chrome 差異 |

所以你只需要填「詳細說明」。

---

## 仍然解決唔到？

**開 [GitHub Issue](https://github.com/neo2codes/subsensei/issues)，請附上：**

1. 瀏覽器同版本
2. Tampermonkey 版本
3. SubSensei 版本（面板頂部睇）
4. Console 錯誤截圖（F12 → Console）
5. 問題描述

---

## 相關連結

| 連結 | 內容 |
|---|---|
| [README](../README.md) | 安裝 + 使用 |
| [PROJECT.md](../PROJECT.md) | 項目介紹 |
| [CHANGELOG](../CHANGELOG.md) | 版本記錄 |
| [GitHub Issues](https://github.com/neo2codes/subsensei/issues) | 回報問題 |
| [Buy Me a Coffee](https://buymeacoffee.com/neo2codes) | 支持項目 |
