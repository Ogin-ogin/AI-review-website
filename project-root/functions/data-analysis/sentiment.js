const admin = require('firebase-admin');
const { SentimentAnalyzer, PorterStemmer } = require('natural');

// Firebase初期化
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// Naturalライブラリの感情分析器を初期化
const analyzer = new SentimentAnalyzer('English', PorterStemmer, 'afinn');

// 字幕データを取得する関数
async function fetchTranscript(videoId) {
  try {
    const doc = await db.collection('videos').doc(videoId).get();
    if (!doc.exists) {
      console.log(`No transcript found for video ID: ${videoId}`);
      return null;
    }
    return doc.data().transcript;
  } catch (error) {
    console.error(`Error fetching transcript for video ID ${videoId}:`, error);
    return null;
  }
}

// 字幕データに基づいて感情分析を行う関数
function analyzeSentiment(transcript) {
  const results = transcript.map(entry => {
    const score = analyzer.getSentiment(entry.text.split(' '));
    return {
      start: entry.start,
      duration: entry.duration,
      text: entry.text,
      sentimentScore: score
    };
  });

  // 全体の平均スコアを計算
  const averageScore =
    results.reduce((sum, entry) => sum + entry.sentimentScore, 0) / results.length;

  return { results, averageScore };
}

// Firestoreに感情分析結果を保存する関数
async function saveSentimentToFirestore(videoId, sentimentData) {
  const sentimentRef = db.collection('videos').doc(videoId);

  await sentimentRef.update({
    sentiment: sentimentData,
    sentimentUpdatedAt: new Date().toISOString()
  });

  console.log(`Saved sentiment analysis for video ID: ${videoId}`);
}

// メイン処理
async function analyzeVideoSentiment(videoId) {
  console.log(`Analyzing sentiment for video ID: ${videoId}`);
  const transcript = await fetchTranscript(videoId);

  if (!transcript) {
    console.log(`No transcript available for sentiment analysis (video ID: ${videoId})`);
    return;
  }

  const sentimentData = analyzeSentiment(transcript);
  await saveSentimentToFirestore(videoId, sentimentData);
}

// エクスポート
module.exports = { analyzeVideoSentiment };