# Findhouse 換機與本機啟動指南

本文件用於將 Findhouse 專案搬到另一台電腦，重新安裝可再生的套件與建置檔，並在本機啟動網站。

## 1. 搬移前要保留的內容

請複製整個 `findhouse` 資料夾，但可排除下列可重新產生的資料夾：

- `node_modules/`：JavaScript 套件，之後使用 `pnpm install` 重裝。
- `.next/`：Next.js 本機建置快取。
- `.open-next/`：Cloudflare 建置產物。
- `test-results/`、`playwright-report/`、`coverage/`：測試報告。

以下內容請保留：

- `src/`：網站程式碼。
- `public/`：房源圖片與公開資源。
- `docs/`：規格與操作文件。
- `migrations/`：資料庫結構。
- `seed/`：本機測試資料。
- `tests/`：自動化測試。
- `.wrangler/`：本機 D1 資料庫；要保留既有會員、房源、預約及後台設定時必須複製。
- `.dev.vars`：本機環境設定與資料加密金鑰。
- `package.json`、`pnpm-lock.yaml` 及其他根目錄設定檔。

> `.dev.vars` 和 `.wrangler/` 可能包含敏感資料，不應上傳到公開 GitHub，也不應透過不受信任的方式傳輸。

## 2. 安裝必要工具

### macOS

先安裝 [Node.js LTS](https://nodejs.org/)，建議使用 Node.js 20 以上版本。若有 Homebrew，也可以執行：

```bash
brew install node
```

啟用 Node.js 內建的 Corepack，再安裝 pnpm：

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

### Windows

從 [Node.js 官網](https://nodejs.org/) 安裝 LTS 版本，完成後以 PowerShell 執行：

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

若系統無法使用 Corepack，可改用：

```powershell
npm install --global pnpm
```

### 確認工具版本

```bash
node --version
pnpm --version
```

若兩個指令都能顯示版本，即可繼續。

## 3. 進入專案並安裝套件

macOS Terminal：

```bash
cd /你的路徑/findhouse
pnpm install
```

Windows PowerShell：

```powershell
cd C:\你的路徑\findhouse
pnpm install
```

`pnpm install` 會依照 `pnpm-lock.yaml` 重建 `node_modules/`，可能需要數分鐘。

## 4. 設定本機環境

### 情況 A：完整搬移原電腦資料

如果已安全複製原電腦的 `.dev.vars` 和 `.wrangler/`，可直接沿用。請確認 `.dev.vars` 至少具有：

```dotenv
APP_URL=http://localhost:3000
EMAIL_MODE=resend
EMAIL_FROM=Findhouse <notify@fomoguys.com>
RESEND_API_KEY=
SETTINGS_ENCRYPTION_KEY=原電腦使用的相同金鑰
```

後台保存的 Resend API Key 是加密資料。若要讀取原資料庫中的寄信設定，`SETTINGS_ENCRYPTION_KEY` 必須與原電腦完全相同。

### 情況 B：建立全新的本機環境

macOS：

```bash
cp .dev.vars.example .dev.vars
```

Windows PowerShell：

```powershell
Copy-Item .dev.vars.example .dev.vars
```

打開 `.dev.vars`，設定一組長度足夠且不容易猜到的 `SETTINGS_ENCRYPTION_KEY`。請勿將真實金鑰填入 `.dev.vars.example`。

## 5. 準備本機資料庫

### 已複製 `.wrangler/`

仍建議執行 migration，系統只會補上尚未套用的資料庫變更：

```bash
pnpm db:migrate:local
```

### 沒有複製 `.wrangler/`

建立全新資料庫結構：

```bash
pnpm db:migrate:local
```

需要示範會員與房源資料時，再執行：

```bash
pnpm db:seed:local
```

> 不要在已有正式資料的本機資料庫上反覆執行 seed，避免測試資料重複或衝突。

## 6. 啟動網站

```bash
pnpm dev
```

看到 `Ready` 後，以瀏覽器開啟：

- 首頁：<http://localhost:3000>
- 店長後台：<http://localhost:3000/admin>
- 寄信設定：<http://localhost:3000/admin/settings/email>

Terminal 或 PowerShell 視窗必須保持開啟。停止網站時按 `Ctrl + C`。

## 7. 重新設定寄信服務

若使用全新資料庫，請以店長帳號登入後進入「系統設定 → 寄信服務設定」，填入：

- Resend API Key
- 寄件者名稱 `Findhouse`
- 已通過 Resend 網域驗證的寄件信箱，例如 `notify@fomoguys.com`

API Key 會加密存入本機 D1，不會再次完整顯示。

## 8. 驗證搬移是否成功

依序執行：

```bash
pnpm lint
pnpm typecheck
pnpm test
```

並手動確認：

1. 首頁可以開啟並顯示房源圖片。
2. 會員可以登入。
3. 店長可以進入管理後台。
4. 會員、房源及預約資料與原電腦一致；若使用全新資料庫，則應顯示 seed 測試資料。
5. 後台寄信設定可以保存，註冊驗證信可以寄出。

## 9. 常見問題

### `pnpm: command not found`

重新執行：

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

關閉並重新開啟 Terminal 或 PowerShell 後再試一次。

### 網址顯示無法連線

確認執行 `pnpm dev` 的視窗仍保持開啟，而且輸出沒有紅色錯誤。若 3000 連接埠已被使用，請先停止另一個開發服務。

### 顯示資料表不存在

執行：

```bash
pnpm db:migrate:local
```

### 寄信失敗或 API Key 無法解密

- 全新環境：重新由店長後台輸入 Resend API Key。
- 搬移舊資料庫：確認 `.dev.vars` 的 `SETTINGS_ENCRYPTION_KEY` 與原電腦一致。
- 確認 Resend 網域仍為 Verified，寄件信箱使用 `fomoguys.com` 網域。

### 套件或快取異常

先停止網站，再刪除可再生資料夾：

```bash
rm -rf node_modules .next .open-next
pnpm install
pnpm dev
```

Windows PowerShell：

```powershell
Remove-Item node_modules,.next,.open-next -Recurse -Force
pnpm install
pnpm dev
```

這些資料夾不包含會員、房源或預約資料。

## 10. 最小換機流程摘要

已完整複製 `.wrangler/` 與 `.dev.vars` 時：

```bash
cd findhouse
pnpm install
pnpm db:migrate:local
pnpm dev
```

全新環境時：

```bash
cd findhouse
pnpm install
cp .dev.vars.example .dev.vars
pnpm db:migrate:local
pnpm db:seed:local
pnpm dev
```
