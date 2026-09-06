# 我的課表網站

之後主要修改 `app.js` 即可，`index.html` 不需要跟著整份替換。

部署到 GitHub Pages 時：
1. 將 `index.html` 與 `app.js` 放在 GitHub Pages 網站的根目錄（目前是 `my-schedule/`）。
2. 之後功能修改只需要更新 `app.js`。
3. `index.html` 只在需要改外部套件、網站骨架或 `<head>` 設定時才需要動。

本版本保留：
- Google 登入 / Supabase 雲端同步
- 節次設定視窗，可自訂節次名稱與順序
- 課程新增、編輯、刪除
- 課程顏色與最近使用顏色
- PDF / PNG 下載
