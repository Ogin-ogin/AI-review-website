// functions/content-generation/summarizer.js
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { pipeline } = require('@xenova/transformers');

// Firebaseの初期化
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * 製品レビューの要約を生成する
 * @param {Object} product - 製品データ
 * @returns {string} - 生成された要約テキスト
 */
async function generateProductSummary(product) {
  try {
    // レビュー統合のためのプロンプト作成
    const positives = product.summary?.positives || [];
    const negatives = product.summary?.negatives || [];
    const bestFor = product.summary?.bestFor || [];
    const score = product.summary?.score || 0.5;
    
    const scoreText = score >= 0.8 ? '非常に高評価' : 
                     score >= 0.6 ? '概ね好評' :
                     score >= 0.4 ? '賛否両論' :
                     '厳しい評価';
    
    const prompt = `
製品名: ${product.name}
カテゴリ: ${product.category}
総合評価: ${scoreText} (${Math.round(score * 100)}点)

【良い点】
${positives.map(p => `- ${p}`).join('\n')}

【悪い点】
${negatives.map(n => `- ${n}`).join('\n')}

【こんな人におすすめ】
${bestFor.map(u => `- ${u}`).join('\n')}

上記の情報を元に、この製品の総合的なレビュー要約を500文字程度で作成してください。
消費者目線で、客観的かつ公平な評価を心がけ、製品の特徴や使いどころを明確に説明してください。
`;

    // テキスト生成モデルを使用
    const generator = await pipeline('text-generation', 'cyberagent/open-calm-7b');
    const result = await generator(prompt, {
      max_new_tokens: 500,
      temperature: 0.7
    });
    
    // 生成された要約テキストから不要な部分を削除
    let summaryText = result[0].generated_text;
    
    // プロンプト部分を除去
    summaryText = summaryText.replace(prompt, '').trim();
    
    return summaryText;
  } catch (error) {
    console.error('要約生成エラー:', error);
    
    // エラー時は簡易的な要約を返す
    const positives = product.summary?.positives || [];
    const negatives = product.summary?.negatives || [];
    
    return `
${product.name}は${product.category}カテゴリーの製品です。

【良い点】
${positives.slice(0, 3).map(p => `- ${p}`).join('\n')}

【悪い点】
${negatives.slice(0, 3).map(n => `- ${n}`).join('\n')}
`;
  }
}

/**
 * Schema.org対応のJSONLDを生成する
 * @param {Object} product - 製品データ
 * @returns {Object} - 構造化データオブジェクト
 */
function generateSchemaOrgData(product) {
  const schemaData = {
    '@context': 'https://schema.org/',
    '@type': 'Product',
    name: product.name,
    description: product.summary?.description || '',
    image: product.images?.[0] || '',
    review: {
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: Math.round(product.summary?.score * 5 * 10) / 10 || 2.5,
        bestRating: 5
      },
      author: {
        '@type': 'Organization',
        name: 'AIレビュー分析'
      }
    }
  };
  
  // 価格情報があれば追加
  if (product.prices && product.prices.length > 0) {
    // 最安値を特定
    const lowestPrice = product.prices.reduce(
      (min, p) => (p.price < min.price) ? p : min,
      product.prices[0]
    );
    
    schemaData.offers = {
      '@type': 'Offer',
      price: lowestPrice.price,
      priceCurrency: lowestPrice.currency,
      availability: 'https://schema.org/InStock',
      url: lowestPrice.url
    };
  }
  
  return schemaData;
}

/**
 * 製品データからSEO用のメタデータを生成
 * @param {Object} product - 製品データ
 * @returns {Object} - メタデータオブジェクト
 */
function generateSeoMetadata(product) {
  const score = product.summary?.score || 0.5;
  const scoreText = score >= 0.8 ? '高評価' : 
                   score >= 0.6 ? '好評' :
                   score >= 0.4 ? '普通' : '低評価';
  
  // ポジティブポイントを最大3つ取得
  const positives = product.summary?.positives || [];
  const positivesText = positives.slice(0, 3).join('、');
  
  const title = `${product.name} レビュー総まとめ - ${scoreText}の理由と特徴`;
  
  let description = `${product.name}の評価は「${scoreText}」です。`;
  if (positivesText) {
    description += `${positivesText}などが評価されています。`;
  }
  description += `動画レビューを徹底分析した結果や評判をまとめました。`;
  
  // キーワード生成
  const keywords = [
    product.name,
    `${product.name} レビュー`,
    `${product.name} 評判`,
    product.category,
    `${product.category} おすすめ`
  ].join(',');
  
  return {
    title,
    description,
    keywords
  };
}

/**
 * 製品情報が更新されたらコンテンツを自動生成
 */
exports.generateProductContent = functions.firestore
  .document('products/{productId}')
  .onUpdate(async (change, context) => {
    try {
      const productAfter = change.after.data();
      const productBefore = change.before.data();
      
      // 重要な変更がある場合のみ処理（動画追加または価格変更）
      const videosChanged = JSON.stringify(productBefore.videos) !== JSON.stringify(productAfter.videos);
      const pricesChanged = JSON.stringify(productBefore.prices) !== JSON.stringify(productAfter.prices);
      
      if (!videosChanged && !pricesChanged) {
        return null;
      }
      
      // 要約テキスト生成
      const summaryText = await generateProductSummary(productAfter);
      
      // Schema.org構造化データ生成
      const schemaData = generateSchemaOrgData(productAfter);
      
      // SEOメタデータ生成
      const seoMetadata = generateSeoMetadata(productAfter);
      
      // コンテンツ情報を更新
      await change.after.ref.update({
        'summary.description': summaryText,
        schemaData: schemaData,
        seoMetadata: seoMetadata,
        lastContentUpdate: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`製品 ${productAfter.name} のコンテンツを生成しました`);
      
      return null;
    } catch (error) {
      console.error('コンテンツ生成エラー:', error);
      throw error;
    }
  });
