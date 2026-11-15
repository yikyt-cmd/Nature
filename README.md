# 花蝶蓋印

一個以原生 HTML、CSS 與 JavaScript 製作的國風花蝶蓋印小遊戲。

遊戲網址：[https://yikyt-cmd.github.io/Nature/](https://yikyt-cmd.github.io/Nature/)

直接在瀏覽器開啟 `index.html` 開始遊玩。白紙滿版顯示，左上角操作列可收合。依序畫葉、蓋 5 朵花、蓋 2 隻蝴蝶；蝴蝶隨機使用 B1–B3 圖樣，尺寸為 700–1200px；每次重玩時，葉片和蓋印提示點都會重新隨機定位。完成後會開啟花布大圖預覽，可下載 4500 × 4500 JPG。葉片筆刷大小隨機為 100–200px，間距 5px；花朵交替為 300px 和 600px。花布以四方連續紋樣鋪滿紅底，四邊加入二方連續窄邊飾，並以主次分明、疏密有致為原則重複畫紙圖樣；輸出時均勻挑選至多 12 片葉子，避免過密。畫紙印記不會傳給 AI；API 金鑰只存放在 Cloudflare Worker Secret。

#### 設定 AI 花布布底（選用）

需要 Node.js 與 Cloudflare 帳號。在 `worker/` 目錄執行：

1. `npx wrangler login`
2. `npx wrangler secret put OPENAI_API_KEY`，依提示輸入 OpenAI API 金鑰；不要將金鑰貼到網站或提交到 Git。
3. `npx wrangler deploy`（首次部署或更新 Worker）
4. 完成遊戲後展開「AI 布底」，貼上 Worker 網址並按「儲存」，再按「再生成」。

Worker 僅接受 GitHub Pages 網站來源，並設有每個 IP 每分鐘 3 次的近似速率限制。OpenAI 圖像生成可能產生費用；請在 OpenAI 帳戶設定用量上限。未設定 Worker 時，花布仍會使用本機紅色布底。
