const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// Firebase初期化
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// スクレイピング対象のURLリスト
const TARGET_SITES = [
  {
    name: 'Amazon',
    url: 'https://www.amazon.co.jp/dp/',
    priceSelector: '#priceblock_ourprice'
  },
  {
    name: '楽天市場',
    url: 'https://item.rakuten.co.jp/',
    priceSelector: '.price'
  }
];

// 価格情報を取得する関数
async function fetchPrice(url, priceSelector) {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const priceText = $(priceSelector).text().trim();
    const price = parseFloat(priceText.replace(/[^\d.]/g, '')); // 数値のみ抽出
    return price || null;
  } catch (error) {
    console.error(`Error fetching price from ${url}:`, error);
    return null;
  }
}

// Firestoreに価格情報を保存する関数
async function savePriceToFirestore(productId, siteName, price) {
  const timestamp = new Date().toISOString();
  const priceRef = db
    .collection('products')
    .doc(productId)
    .collection('prices')
    .doc(timestamp);

  await priceRef.set({
    siteName,
    price,
    timestamp
  });

  console.log(`Saved price for ${siteName}: ¥${price} (Product ID: ${productId})`);
}

// メイン処理
async function trackPrices(productId, productUrls) {
  console.log(`Tracking prices for product ID: ${productId}`);
  for (const site of TARGET_SITES) {
    const productUrl = productUrls[site.name];
    if (!productUrl) {
      console.log(`No URL provided for ${site.name}`);
      continue;
    }

    const price = await fetchPrice(productUrl, site.priceSelector);
    if (price !== null) {
      await savePriceToFirestore(productId, site.name, price);
    } else {
      console.log(`Failed to fetch price for ${site.name}`);
    }
  }
}

// エクスポート
module.exports = { trackPrices };