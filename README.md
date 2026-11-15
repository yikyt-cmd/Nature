# 花鳥蓋印所

一個以原生 HTML、CSS 與 JavaScript 製作的國風花鳥蓋印小遊戲。

遊戲網址：[https://yikyt-cmd.github.io/Nature/](https://yikyt-cmd.github.io/Nature/)

直接在瀏覽器開啟 `index.html` 開始遊玩：先選葉片圖樣並用滑鼠在白紙上自由描畫（葉片筆刷隨機為 100–200px，葉片間距 5px，不限片數），按「OK」後選花樣並在紅色光點停留一秒蓋 5 朵花，最後選雀鳥圖樣並在紅色光點停留一秒蓋 2 隻小鳥。花朵依序交替為 300px 和 600px，每隻鳥為 600px。完成後可下載 4500 × 4500 JPG：畫紙印記及尺寸比例會重複排列，布底可用本機暖白色或選擇外部 AI 生成。畫紙印記不會傳給 AI，只有固定文字提示會送到 OpenAI 生成布底；API 金鑰只存放在 Cloudflare Worker Secret。紅色光點提示會顯示在葉片上層。按「重新開始」可再玩一次。

#### 設定 AI 花布布底（選用）

需要 Node.js 與 Cloudflare 帳號。在 `worker/` 目錄執行：

1. `npx wrangler login`
2. `npx wrangler secret put OPENAI_API_KEY`，依提示輸入 OpenAI API 金鑰；不要將金鑰貼到網站或提交到 Git。
3. `npx wrangler deploy`
4. 複製 Wrangler 顯示的 Worker 網址，在完成遊戲後貼入「AI 花布 Worker 網址」、按「儲存 AI 網址」，再按「重新生成花布」。

Worker 僅接受 GitHub Pages 網站來源，並設有每個 IP 每分鐘 3 次的近似速率限制。OpenAI 圖像生成可能產生費用；請在 OpenAI 帳戶設定用量上限。未設定 Worker 時，花布仍會使用本機暖白布底。
