const axios = require('axios');
const admin = require('firebase-admin');

// Firebase初期化
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// YouTube字幕APIのURL
const YOUTUBE_TRANSCRIPT_API_URL = 'https://www.youtube.com/api/timedtext';

// 字幕を取得する関数
async function fetchTranscript(videoId, lang = 'en') {
  try {
    const response = await axios.get(YOUTUBE_TRANSCRIPT_API_URL, {
      params: {
        v: videoId,
        lang
      }
    });

    // 字幕データをパース
    const transcript = parseTranscript(response.data);
    return transcript;
  } catch (error) {
    console.error(`Error fetching transcript for video ID ${videoId}:`, error);
    return null;
  }
}

// 字幕データをパースする関数
function parseTranscript(xmlData) {
  const transcript = [];
  const regex = /<text start="([\d.]+)" dur="([\d.]+)">(.*?)<\/text>/g;
  let match;

  while ((match = regex.exec(xmlData)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    const text = match[3].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    transcript.push({ start, duration, text });
  }

  return transcript;
}

// Firestoreに字幕を保存する関数
async function saveTranscriptToFirestore(videoId, transcript) {
  const transcriptRef = db.collection('videos').doc(videoId);

  await transcriptRef.set({
    transcript,
    updatedAt: new Date().toISOString()
  });

  console.log(`Saved transcript for video ID: ${videoId}`);
}

// メイン処理
async function extractTranscript(videoId, lang = 'en') {
  console.log(`Extracting transcript for video ID: ${videoId}`);
  const transcript = await fetchTranscript(videoId, lang);

  if (transcript) {
    await saveTranscriptToFirestore(videoId, transcript);
  } else {
    console.log(`No transcript available for video ID: ${videoId}`);
  }
}

// エクスポート
module.exports = { extractTranscript };