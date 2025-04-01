// priceTracker.js
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Amazonから価格情報を取得
 * @param {string} productUrl - Amazon製品URL
 */
async function getAmazonPrice(productUrl) {
  try {
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const price = $('.a-price-whole').first().text().replace(/[^\d]/g, '');
    
    return {
      store: 'Amazon',
      price: parseInt(price, 10),
      currency: 'JPY',
      url: productUrl,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
  } catch (error) {
    console.error('Amazon価格取得エラー:', error);
    return null;
  }
}

/**
 * 楽天から価格情報を取得
 * @param {string} productUrl - 楽天製品URL
 */
async function getRakutenPrice(productUrl) {
  try {
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    const $ = cheerio.load(response.data);
    const price = $('.price').first().text().replace(/[^\d]/g, '');
    
    return {
      store: 'Rakuten',
      price: parseInt(price, 10),
      currency: 'JPY',
      url: productUrl,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };
  } catch (error) {
    console.error('楽天価格取得エラー:', error);
    return null;
  }
}

/**
 * 全製品の価格情報を更新
 */
exports.updateProductPrices = functions.pubsub.schedule('0 12 * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async context => {
    try {
      const productsSnapshot = await db.collection('products').get();
      
      for (const doc of productsSnapshot.docs) {
        const product = doc.data();
        const prices = [];
        
        // 各ストアの価格を取得
        for (const price of product.prices || []) {
          if (price.store === 'Amazon') {
            const amazonPrice = await getAmazonPrice(price.url);
            if (amazonPrice) prices.push(amazonPrice);
          } else if (price.store === 'Rakuten') {
            const rakutenPrice = await getRakutenPrice(price.url);
            if (rakutenPrice) prices.push(rakutenPrice);
          }
        }
        
        if (prices.length > 0) {
          await doc.ref.update({
            prices: prices,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
          
          console.log(`製品 ${product.name} の価格を更新しました`);
        }
      }
      
      return null;
    } catch (error) {
      console.error('価格更新エラー:', error);
      throw error;
    }
  });