// functions/content-generation/schemaGenerator.js
const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Firebaseの初期化
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * 製品ページ用のSchema.org構造化データを生成
 * @param {Object} product - 製品データ
 * @returns {Object} - JSON-LD形式の構造化データ
 */
function generateProductSchema(product) {
  try {
    // 基本的な製品情報
    const schema = {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name,
      description: product.summary?.description || '',
      image: product.images?.[0] || '',
      brand: {
        '@type': 'Brand',
        name: product.brand || ''
      }
    };

    // 集約レビュー情報
    if (product.summary && typeof product.summary.score === 'number') {
      // スコアを5段階評価に変換（0-1 → 1-5）
      const ratingValue = Math.max(1, Math.min(5, Math.round(product.summary.score * 5 * 10) / 10));
      
      schema.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: ratingValue,
        bestRating: 5,
        worstRating: 1,
        ratingCount: product.videos?.length || 0,
        reviewCount: product.videos?.length || 0
      };
    }

    // レビュー情報（分析元の動画）
    if (product.videos && product.videos.length > 0) {
      schema.review = product.videos.slice(0, 5).map(video => {
        // ビデオごとの感情スコアを5段階評価に変換
        const videoRating = video.sentiment 
          ? Math.max(1, Math.min(5, Math.round(video.sentiment * 5 * 10) / 10))
          : undefined;
          
        return {
          '@type': 'Review',
          author: {
            '@type': 'Person',
            name: video.channelName
          },
          datePublished: video.publishedAt?.toDate().toISOString().split('T')[0] || '',
          url: video.url,
          ...(videoRating && { reviewRating: {
            '@type': 'Rating',
            ratingValue: videoRating,
            bestRating: 5
          }})
        };
      });
    }

    // 価格情報
    if (product.prices && product.prices.length > 0) {
      // 最安値を特定
      const lowestPrice = product.prices.reduce(
        (min, p) => (!min || (p.price < min.price)) ? p : min,
        null
      );
      
      if (lowestPrice) {
        schema.offers = {
          '@type': 'AggregateOffer',
          lowPrice: lowestPrice.price,
          highPrice: Math.max(...product.prices.map(p => p.price)),
          priceCurrency: lowestPrice.currency || 'JPY',
          offerCount: product.prices.length,
          offers: product.prices.map(p => ({
            '@type': 'Offer',
            price: p.price,
            priceCurrency: p.currency || 'JPY',
            url: p.url || '',
            seller: {
              '@type': 'Organization',
              name: p.store || '販売店'
            },
            availability: 'https://schema.org/InStock'
          }))
        };
      }
    }

    // 製品スペック情報
    if (product.specs && Object.keys(product.specs).length > 0) {
      const additionalProperties = [];
      
      for (const [key, value] of Object.entries(product.specs)) {
        if (value !== null && value !== undefined && value !== '') {
          additionalProperties.push({
            '@type': 'PropertyValue',
            name: key,
            value: value.toString()
          });
        }
      }
      
      if (additionalProperties.length > 0) {
        schema.additionalProperty = additionalProperties;
      }
    }

    return schema;
  } catch (error) {
    console.error('Schema生成エラー:', error);
    // 最小限のスキーマを返す
    return {
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: product.name || '製品名'
    };
  }
}

/**
 * カテゴリページ用のBreadcrumbList構造化データを生成
 * @param {Object} category - カテゴリデータ
 * @returns {Object} - JSON-LD形式の構造化データ
 */
function generateCategoryBreadcrumbSchema(category) {
  try {
    return {
      '@context': 'https://schema.org/',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'ホーム',
          item: 'https://example.com/'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: category.name,
          item: `https://example.com/category/${category.id}`
        }
      ]
    };
  } catch (error) {
    console.error('Breadcrumb生成エラー:', error);
    return null;
  }
}

/**
 * 製品比較ページ用のItemList構造化データを生成
 * @param {Array} products - 比較する製品のリスト
 * @returns {Object} - JSON-LD形式の構造化データ
 */
function generateComparisonSchema(products) {
  try {
    return {
      '@context': 'https://schema.org/',
      '@type': 'ItemList',
      itemListElement: products.map((product, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: product.name,
          image: product.images?.[0] || '',
          description: product.summary?.description?.substring(0, 100) || '',
          url: `https://example.com/product/${product.id}`
        }
      }))
    };
  } catch (error) {
    console.error('Comparison Schema生成エラー:', error);
    return null;
  }
}

/**
 * FAQページ用のFAQPage構造化データを生成
 * @param {Array} faqs - FAQ項目の配列
 * @returns {Object} - JSON-LD形式の構造化データ
 */
function generateFaqSchema(faqs) {
  try {
    return {
      '@context': 'https://schema.org/',
      '@type': 'FAQPage',
      mainEntity: faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer
        }
      }))
    };
  } catch (error) {
    console.error('FAQ Schema生成エラー:', error);
    return null;
  }
}

// Cloud Functionsのエクスポート
exports.generateProductSchema = functions.https.onCall(async (data, context) => {
  try {
    const { productId } = data;
    if (!productId) {
      throw new functions.https.HttpsError('invalid-argument', 'productIdが必要です');
    }
    
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      throw new functions.https.HttpsError('not-found', '製品が見つかりません');
    }
    
    const product = {
      id: productDoc.id,
      ...productDoc.data()
    };
    
    const schema = generateProductSchema(product);
    return { schema };
  } catch (error) {
    console.error('Schema生成エラー:', error);
    throw new functions.https.HttpsError('internal', 'Schema生成に失敗しました', error);
  }
});

// 他のスキーマジェネレーション関数をエクスポート
exports.generateCategoryBreadcrumbSchema = generateCategoryBreadcrumbSchema;
exports.generateComparisonSchema = generateComparisonSchema;
exports.generateFaqSchema = generateFaqSchema;