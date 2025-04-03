const axios = require('axios');
const admin = require('firebase-admin');

// Firebase初期化
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// 環境変数からAPIキーを取得
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3/search';

// YouTube動画を検索する関数
async function searchYouTubeVideos(query, maxResults = 10) {
  try {
    const response = await axios.get(YOUTUBE_API_URL, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults,
        key: YOUTUBE_API_KEY,
        order: 'relevance',
        videoEmbeddable: 'true'
      }
    });

    return response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      thumbnails: item.snippet.thumbnails
    }));
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    throw new Error('Failed to fetch YouTube videos');
  }
}

// 検索結果をFirestoreに保存する関数
async function saveVideosToFirestore(videos, productId) {
  const batch = db.batch();
  const videosCollection = db.collection('products').doc(productId).collection('videos');

  videos.forEach(video => {
    const videoRef = videosCollection.doc(video.videoId);
    batch.set(videoRef, video);
  });

  await batch.commit();
  console.log(`Saved ${videos.length} videos to Firestore for product ID: ${productId}`);
}

// メイン処理
async function collectYouTubeVideos(productId, query) {
  console.log(`Searching YouTube videos for product: ${productId}, query: "${query}"`);
  const videos = await searchYouTubeVideos(query);
  await saveVideosToFirestore(videos, productId);
}

// エクスポート
module.exports = { collectYouTubeVideos };