const { pipeline } = require('@huggingface/transformers');

// トピック抽出パイプラインを初期化
const topicExtractor = pipeline('zero-shot-classification');

/**
 * テキストからトピックを抽出する関数
 * @param {string[]} texts - 分析対象のテキスト配列
 * @param {string[]} candidateLabels - 候補トピックのラベル配列
 * @returns {Promise<Object[]>} - トピック抽出結果の配列
 */
async function extractTopics(texts, candidateLabels) {
  try {
    const results = await Promise.all(
      texts.map(async text => {
        const result = await topicExtractor(text, candidateLabels);
        return {
          text,
          labels: result.labels, // トピックラベル
          scores: result.scores, // 各トピックのスコア
        };
      })
    );
    return results;
  } catch (error) {
    console.error('Error extracting topics:', error);
    throw new Error('Failed to extract topics');
  }
}

module.exports = { extractTopics };