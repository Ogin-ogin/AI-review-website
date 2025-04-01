// functions/data-analysis/contentAnalyzer.js
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { pipeline } = require('@xenova/transformers');

// Firebaseの初期化
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * テキストからの感情分析を実行
 * @param {string} text - 分析対象テキスト
 * @returns {Object} - 感情分析結果
 */
async function analyzeSentiment(text) {
  try {
    // テキストが空の場合は中立的な値を返す
    if (!text || text.trim() === '') {
      return { score: 0.5 };
    }

    // 感情分析パイプラインを初期化
    const classifier = await pipeline('sentiment-analysis', 'distilbert-base-uncased-finetuned-sst-2-english');
    
    // 日本語テキストの場合は別のモデルを使用
    const hasJapanese = /[\u3000-\u303F\u3040-\u309F\u30A0-\u30FF\uFF00-\uFFEF\u4E00-\u9FAF]/.test(text);
    if (hasJapanese) {
      // 日本語用の感情分析モデル
      classifier = await pipeline('sentiment-analysis', 'ku-nlp/deberta-v2-large-japanese-sentiment');
    }
    
    // テキストが長すぎる場合は分割して処理
    const maxLength = 512;
    let sentiments = [];
    
    if (text.length > maxLength) {
      // テキストを文に分割
      const sentences = text.match(/[^.!?。]+[.!?。]+/g) || [text];
      
      // 各文について感情分析を実行
      for (const sentence of sentences) {
        if (sentence.trim() !== '') {
          const result = await classifier(sentence);
          sentiments.push(result[0]);
        }
      }
    } else {
      // 1回で処理可能なテキスト長の場合
      const result = await classifier(text);
      sentiments.push(result[0]);
    }
    
    // 結果の集計
    if (sentiments.length === 0) {
      return { score: 0.5 };
    }
    
    // POSITIVEラベルのスコアを集計
    let positiveScore = 0;
    sentiments.forEach(sentiment => {
      if (sentiment.label === 'POSITIVE' || sentiment.label === 'ポジティブ') {
        positiveScore += sentiment.score;
      } else {
        positiveScore += (1 - sentiment.score);
      }
    });
    
    // 平均スコアを計算
    const averageScore = positiveScore / sentiments.length;
    
    return { score: averageScore };
  } catch (error) {
    console.error('感情分析エラー:', error);
    return { score: 0.5, error: error.message };
  }
}

/**
 * テキストからメリット・デメリットを抽出
 * @param {string} text - 分析対象テキスト
 * @returns {Object} - 抽出結果
 */
async function extractAttributes(text) {
  try {
    // テキスト分類モデルを使用
    const generator = await pipeline('text-generation', 'cyberagent/open-calm-7b');
    
    const prompt = `
以下のテキストから、製品のメリット（良い点）とデメリット（悪い点）を抽出してください。
箇条書きリストで、各項目は短く簡潔に表現してください。

テキスト:
${text}

メリット（良い点）:
- 
デメリット（悪い点）:
- 
`;

    // 生成実行
    const result = await generator(prompt, {
      max_new_tokens: 500,
      temperature: 0.3,
      do_sample: true
    });
    
    const output = result[0].generated_text;
    
    // 出力からメリットとデメリットを抽出
    const meritsMatch = output.match(/メリット（良い点）:([\s\S]*?)(?=デメリット（悪い点）:|$)/);
    const demeritsMatch = output.match(/デメリット（悪い点）:([\s\S]*?)(?=$)/);
    
    // 箇条書きリストの形式から配列に変換
    const extractListItems = (text) => {
      if (!text) return [];
      const items = text.split(/\n-\s*/).map(item => item.trim()).filter(Boolean);
      return items.length > 0 ? items : [];
    };
    
    const merits = meritsMatch ? extractListItems(meritsMatch[1]) : [];
    const demerits = demeritsMatch ? extractListItems(demeritsMatch[1]) : [];
    
    return {
      positives: merits,
      negatives: demerits
    };
  } catch (error) {
    console.error('属性抽出エラー:', error);
    return {
      positives: [],
      negatives: [],
      error: error.message
    };
  }
}

/**
 * テキストからこの製品に適したユーザー層を抽出
 * @param {string} text - 分析対象テキスト
 * @returns {Array} - 適合ユーザー層のリスト
 */
async function extractUserFit(text) {
  try {
    // テキスト生成モデルを使用
    const generator = await pipeline('text-generation', 'cyberagent/open-calm-7b');
    
    const prompt = `
以下のテキストを分析し、この製品がどのようなユーザーに適しているかを3-5項目で箇条書きにしてください。
各項目は「〜な人におすすめ」という形式で短く簡潔に表現してください。

テキスト:
${text}

この製品が適しているユーザー:
- `;

    // 生成実行
    const result = await generator(prompt, {
      max_new_tokens: 300,
      temperature: 0.3,
      do_sample: true
    });
    
    const output = result[0].generated_text;
    
    // 出力から適合ユーザー層を抽出
    const fitMatch = output.match(/この製品が適しているユーザー:([\s\S]*?)(?=$)/);
    
    // 箇条書きリストの形式から配列に変換
    const extractListItems = (text) => {
      if (!text) return [];
      const items = text.split(/\n-\s*/).map(item => item.trim()).filter(Boolean);
      return items.length > 0 ? items : [];
    };
    
    const userFit = fitMatch ? extractListItems(fitMatch[1]) : [];
    
    return userFit;
  } catch (error) {
    console.error('ユーザー適合性抽出エラー:', error);
    return [];
  }
}

/**
 * 複数のレビュー動画トランスクリプトを分析して統合結果を返す
 * @param {Array} transcripts - トランスクリプトの配列
 * @returns {Object} - 分析統合結果
 */
async function analyzeMultipleTranscripts(transcripts) {
  try {
    // 空のトランスクリプトをフィルタリング
    const validTranscripts = transcripts.filter(t => t && t.text && t.text.trim() !== '');
    
    if (validTranscripts.length === 0) {
      return {
        positives: [],
        negatives: [],
        bestFor: [],
        score: 0.5
      };
    }
    
    // 各トランスクリプトの感情分析を実行
    const sentimentPromises = validTranscripts.map(t => analyzeSentiment(t.text));
    const sentimentResults = await Promise.all(sentimentPromises);
    
    // スコアの平均を計算
    const avgScore = sentimentResults.reduce((sum, result) => sum + result.score, 0) / sentimentResults.length;
    
    // 各トランスクリプトからメリット・デメリットを抽出
    const attributePromises = validTranscripts.map(t => extractAttributes(t.text));
    const attributeResults = await Promise.all(attributePromises);
    
    // 全トランスクリプトを結合して分析（最大長を考慮）
    const combinedText = validTranscripts
      .map(t => t.text)
      .join('\n\n')
      .slice(0, 10000); // テキストが長すぎる場合は切り詰め
    
    // 統合テキストからユーザー適合性を抽出
    const userFit = await extractUserFit(combinedText);
    
    // メリット・デメリットを集計（頻度でソート）
    const countOccurrences = (items) => {
      const counts = {};
      items.flat().forEach(item => {
        counts[item] = (counts[item] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([item]) => item);
    };
    
    const positives = countOccurrences(attributeResults.map(r => r.positives || []));
    const negatives = countOccurrences(attributeResults.map(r => r.negatives || []));
    
    return {
      positives: positives.slice(0, 10), // 上位10件のみ
      negatives: negatives.slice(0, 10), // 上位10件のみ
      bestFor: userFit.slice(0, 5),      // 上位5件のみ
      score: avgScore
    };
  } catch (error) {
    console.error('複数トランスクリプト分析エラー:', error);
    return {
      positives: [],
      negatives: [],
      bestFor: [],
      score: 0.5,
      error: error.message
    };
  }
}

/**
 * Cloud Function: 製品の動画トランスクリプトを分析
 */
exports.analyzeProductContent = functions.firestore
  .document('products/{productId}')
  .onUpdate(async (change, context) => {
    try {
      const productBefore = change.before.data();
      const productAfter = change.after.data();
      
      // トランスクリプトが更新された場合のみ処理を実行
      const videosChanged = JSON.stringify(productBefore.videos) !== JSON.stringify(productAfter.videos);
      
      if (!videosChanged) {
        console.log('動画データに変更がないため、分析をスキップします');
        return null;
      }
      
      // 分析対象の動画トランスクリプトを取得
      const videos = productAfter.videos || [];
      const transcriptsPromises = videos.map(async (video) => {
        if (!video.id) return null;
        
        // トランスクリプトが既に存在する場合は取得
        const transcriptDoc = await db.collection('transcripts').doc(video.id).get();
        
        if (transcriptDoc.exists) {
          return transcriptDoc.data();
        }
        
        return null;
      });
      
      const transcripts = await Promise.all(transcriptsPromises);
      const validTranscripts = transcripts.filter(Boolean);
      
      if (validTranscripts.length === 0) {
        console.log('有効なトランスクリプトがないため、分析をスキップします');
        return null;
      }
      
      // トランスクリプトを分析
      const analysisResult = await analyzeMultipleTranscripts(validTranscripts);
      
      // 分析結果を製品ドキュメントに保存
      await change.after.ref.update({
        'summary.positives': analysisResult.positives,
        'summary.negatives': analysisResult.negatives,
        'summary.bestFor': analysisResult.bestFor,
        'summary.score': analysisResult.score,
        lastAnalyzed: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`製品 ${context.params.productId} の分析が完了しました`);
      
      return null;
    } catch (error) {
      console.error('コンテンツ分析エラー:', error);
      throw error;
    }
  });

// 関数をエクスポート（他のモジュールで使用可能に）
exports.analyzeSentiment = analyzeSentiment;
exports.extractAttributes = extractAttributes;
exports.extractUserFit = extractUserFit;
exports.analyzeMultipleTranscripts = analyzeMultipleTranscripts;