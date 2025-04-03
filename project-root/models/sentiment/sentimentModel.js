const { pipeline } = require('@huggingface/transformers');

// 感情分析パイプラインを初期化
const sentimentAnalyzer = pipeline('sentiment-analysis');

/**
 * テキストの感情分析を実行する関数
 * @param {string[]} texts - 分析対象のテキスト配列
 * @returns {Promise<Object[]>} - 感情分析結果の配列
 */
async function analyzeSentiments(texts) {
  try {
    const results = await sentimentAnalyzer(texts);
    return results.map((result, index) => ({
      text: texts[index],
      label: result.label, // POSITIVE, NEGATIVE, NEUTRAL
      score: result.score, // 信頼スコア
    }));
  } catch (error) {
    console.error('Error analyzing sentiments:', error);
    throw new Error('Failed to analyze sentiments');
  }
}

module.exports = { analyzeSentiments };