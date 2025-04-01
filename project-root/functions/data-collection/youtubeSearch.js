// functions/data-collection/youtubeSearch.js
const { google } = require('googleapis');
const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Firebaseの初期化
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// YouTube APIの設定
const youtube = google.youtube({
  version: 'v3',
  auth: functions.config().youtube.key
});

/**
 * 指定されたキーワードでYouTube検索を行う
 * @param {string} keyword - 検索キーワード
 * @param {number} maxResults - 最大結果数
 */
async function searchYouTubeVideos(keyword, maxResults = 10) {
  try {
    const response = await youtube.search.list({
      part: 'snippet',
      q: keyword,
      type: 'video',
      maxResults: maxResults,
      order: 'relevance',
      videoDefinition: 'high',
      relevanceLanguage: 'ja'
    });

    const videoIds = response.data.items.map(item => item.id.videoId);
    
    // 動画の詳細情報を取得
    const videosData = await youtube.videos.list({
      part: 'snippet,statistics,contentDetails',
      id: videoIds.join(',')
    });

    return videosData.data.items.map(item => ({
      id: item.id,
      platform: 'youtube',
      title: item.snippet.title,
      channelName: item.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${item.id}`,
      thumbnailUrl: item.snippet.thumbnails.high.url,
      publishedAt: admin.firestore.Timestamp.fromDate(new Date(item.snippet.publishedAt)),
      viewCount: parseInt(item.statistics.viewCount, 10),
      sentiment: 0 // 初期値、後で分析で更新
    }));
  } catch (error) {
    console.error('YouTube検索エラー:', error);
    throw error;
  }
}

/**
 * トランスクリプト（字幕）を取得する
 * @param {string} videoId - YouTube動画ID
 */
async function getVideoTranscript(videoId) {
  try {
    const response = await youtube.captions.list({
      part: 'snippet',
      videoId: videoId
    });

    if (response.data.items && response.data.items.length > 0) {
      // 日本語の字幕を優先
      const jaCaption = response.data.items.find(item => 
        item.snippet.language === 'ja');
      
      const captionId = jaCaption ? jaCaption.id : response.data.items[0].id;
      
      // 字幕のダウンロード（注：実際の実装ではAPI制限があるため要調整）
      const transcript = await youtube.captions.download({
        id: captionId
      });
      
      return transcript.data;
    }
    
    return null;
  } catch (error) {
    console.error(`字幕取得エラー (videoId: ${videoId}):`, error);
    return null;
  }
}

/**
 * 製品カテゴリに基づいてレビュー動画を検索・保存する
 */
exports.searchProductReviews = functions.pubsub.schedule('0 0 * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async context => {
    try {
      // アクティブカテゴリを取得
      const categoriesSnapshot = await db.collection('categories')
        .where('active', '==', true)
        .get();
      
      for (const catDoc of categoriesSnapshot.docs) {
        const category = catDoc.data();
        
        // カテゴリ内の各製品を処理
        const productsSnapshot = await db.collection('products')
          .where('category', '==', catDoc.id)
          .get();
        
        for (const productDoc of productsSnapshot.docs) {
          const product = productDoc.data();
          
          // 検索キーワード生成
          const searchKeyword = `${product.name} レビュー`;
          
          // YouTube検索実行
          const videos = await searchYouTubeVideos(searchKeyword);
          
          // 既存の動画IDを取得
          const existingVideos = product.videos || [];
          const existingVideoIds = existingVideos.map(v => v.id);
          
          // 新しい動画のみフィルタリング
          const newVideos = videos.filter(v => !existingVideoIds.includes(v.id));
          
          if (newVideos.length > 0) {
            // 製品データを更新
            await productDoc.ref.update({
              videos: admin.firestore.FieldValue.arrayUnion(...newVideos),
              lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`製品 ${product.name} に ${newVideos.length} 件の新しい動画を追加しました`);
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('レビュー検索エラー:', error);
      throw error;
    }
  });