const { collectYouTubeVideos } = require('../data-collection/youtubeSearch');
const { trackPrices } = require('../data-collection/priceTracker');
const { extractTranscript } = require('../data-analysis/transcriptExtractor');
const { analyzeVideoSentiment } = require('../data-analysis/sentiment');
const { generateProductSchema } = require('../content-generation/schemaGenerator');
const admin = require('firebase-admin');

// Firebase初期化
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// 製品リストを取得する関数
async function fetchAllProducts() {
  try {
    const snapshot = await db.collection('products').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// 日次タスクを実行する関数
async function runDailyTasks() {
  console.log('Starting daily tasks...');
  const products = await fetchAllProducts();

  for (const product of products) {
    const { id: productId, name, searchQuery, urls } = product;

    console.log(`Processing product: ${name} (ID: ${productId})`);

    try {
      // 1. YouTube動画収集
      if (searchQuery) {
        console.log(`Collecting YouTube videos for product: ${name}`);
        await collectYouTubeVideos(productId, searchQuery);
      }

      // 2. 価格情報収集
      if (urls) {
        console.log(`Tracking prices for product: ${name}`);
        await trackPrices(productId, urls);
      }

      // 3. 字幕抽出と感情分析
      const videoSnapshot = await db
        .collection('products')
        .doc(productId)
        .collection('videos')
        .get();

      for (const videoDoc of videoSnapshot.docs) {
        const videoId = videoDoc.id;

        console.log(`Extracting transcript for video ID: ${videoId}`);
        await extractTranscript(videoId);

        console.log(`Analyzing sentiment for video ID: ${videoId}`);
        await analyzeVideoSentiment(videoId);
      }

      // 4. 構造化データ生成
      console.log(`Generating schema for product: ${name}`);
      await generateProductSchema(productId);

    } catch (error) {
      console.error(`Error processing product ${name} (ID: ${productId}):`, error);
    }
  }

  console.log('Daily tasks completed.');
}

// 実行
runDailyTasks().catch(error => {
  console.error('Error running daily tasks:', error);
});