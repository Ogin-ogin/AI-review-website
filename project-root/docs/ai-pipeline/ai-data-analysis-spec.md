# AI・データ分析仕様書

## 1. 概要

本ドキュメントでは、AIレビュー動画分析サイトにおけるデータ収集、処理、分析のための技術的仕様と実装ガイドラインを定義します。このシステムは、YouTubeのレビュー動画から製品評価を自動的に抽出し、ユーザーにとって有益な形で統合・表示することを目的としています。

## 2. データ収集パイプライン

### 2.1 YouTube APIを使用した動画収集

#### 検索クエリ生成
- **構成**: `/functions/data-collection/youtubeSearch.js`
- **アルゴリズム**:
  ```javascript
  generateSearchQueries(product) {
    // 製品名 + "レビュー"
    // 製品名 + カテゴリ + "レビュー"
    // 製品名 + "使ってみた"
    // 製品名 + "インプレッション"
    return [...queries];
  }
  ```
- **呼び出し頻度**: 日次1回（GitHub Actions経由）
- **クォータ管理**:
  - 1日あたり最大10,000ユニット使用
  - キャッシュ戦略: 7日間以内に検索済みのクエリは再検索しない

#### YouTube Data API v3 実装
- **認証**: API Key（環境変数で管理）
- **エンドポイント**: `youtube.googleapis.com/youtube/v3/search`
- **パラメータ**:
  - `part: 'snippet'`
  - `type: 'video'`
  - `regionCode: 'JP'`
  - `relevanceLanguage: 'ja'`
  - `maxResults: 10` (製品あたり)
  - `order: 'relevance'` (視聴回数5000以上のみ取得)

### 2.2 価格情報収集

#### スクレイピング戦略
- **対象サイト**: Amazon、楽天市場、ヨドバシカメラなど
- **実装モジュール**: `/functions/data-collection/priceTracker.js`
- **防止措置**:
  - ランダム化されたユーザーエージェント
  - アクセス間隔: 最小5秒
  - 1日あたりの収集対象: 最大200製品

#### Puppeteer実装（ヘッドレスブラウザ）
```javascript
async function fetchPriceData(productUrl) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setUserAgent(getRandomUserAgent());
  await page.goto(productUrl, { waitUntil: 'networkidle2' });
  
  // サイト別にセレクタを設定
  const priceSelector = PRICE_SELECTORS[getDomain(productUrl)];
  const priceText = await page.$eval(priceSelector, el => el.textContent);
  
  // 整形・通貨記号除去など
  const price = formatPrice(priceText);
  
  await browser.close();
  return { price, timestamp: new Date() };
}
```

### 2.3 製品マスタ管理

#### データモデル
- **コレクション**: `products`
- **スキーマ**:
  ```javascript
  {
    id: String,
    name: String,
    category: String,
    subCategory: String,
    images: Array<String>,
    specs: Object,
    lastUpdated: Timestamp,
    // 他のフィールドは分析結果として追加
  }
  ```

#### 初期データ登録
- 手動登録またはCSVインポート (`/scripts/import-products.js`)
- 最低必要フィールド: `id`, `name`, `category`

## 3. 動画コンテンツ分析

### 3.1 トランスクリプト抽出

#### YouTube字幕取得
- **モジュール**: `/functions/data-analysis/transcriptExtractor.js`
- **プロセス**:
  1. YouTube APIから字幕リスト取得
  2. 日本語字幕優先取得（なければ自動生成字幕）
  3. タイムスタンプ付きテキストとして保存

#### 音声認識フォールバック
- YouTube字幕がない場合の処理
- **技術**: Web Speech API または Google Cloud Speech-to-Text
- **実装**:
  ```javascript
  async function getTranscriptWithSpeechAPI(videoId) {
    const audioUrl = await extractAudioFromVideo(videoId);
    const segments = await recognizeSpeech(audioUrl);
    return segments;
  }
  ```

### 3.2 テキスト感情分析

#### 感情分析モデル
- **モデル**: Hugging Face (`cl-tohoku/bert-base-japanese-v2`)
- **実装場所**: `/functions/data-analysis/models/sentimentModel.js`
- **分析粒度**:
  - 文単位の感情スコア（-1.0 〜 1.0）
  - パラグラフ単位の統合スコア
  - トランスクリプト全体のスコア

#### スコアリングアルゴリズム
```javascript
function analyzeSentiment(text) {
  // テキストを文に分割
  const sentences = splitIntoSentences(text);
  
  // 各文の感情スコアを計算
  const sentenceScores = sentences.map(sentence => 
    bertModel.predict(sentence)
  );
  
  // 重み付け平均で統合スコア計算
  const weightedScores = applySentenceWeighting(sentenceScores);
  const overallScore = weightedScores.reduce((a, b) => a + b) / weightedScores.length;
  
  return {
    overall: overallScore,
    sentences: sentenceScores
  };
}
```

### 3.3 属性抽出処理

#### メリット・デメリット抽出
- **モジュール**: `/functions/data-analysis/contentAnalyzer.js`
- **手法**:
  - 評価表現パターン認識
  - 条件付き確率場（CRF）モデル
  - メリット/デメリット関連キーワードの近接性分析

#### ユーザー適合性分析
- **目的**: どのタイプのユーザーに適しているかを特定
- **実装**:
  ```javascript
  function extractUserFit(transcript) {
    // ユーザーペルソナ関連の表現抽出
    const beginnerMatches = extractMatches(transcript, BEGINNER_PATTERNS);
    const expertMatches = extractMatches(transcript, EXPERT_PATTERNS);
    const useCaseMatches = extractMatches(transcript, USE_CASE_PATTERNS);
    
    // スコア計算とラベル付け
    return categorizeUserFit(beginnerMatches, expertMatches, useCaseMatches);
  }
  ```

### 3.4 トピックモデリング

#### トピック抽出モデル
- **モデル**: LDA (Latent Dirichlet Allocation)
- **実装**: `/functions/data-analysis/models/topicModel.js`
- **処理フロー**:
  1. テキスト前処理（ストップワード除去、形態素解析）
  2. 複数レビュー間の共通トピック抽出
  3. トピック-単語分布の算出

#### キーワード抽出
- **TF-IDF**を使用した重要キーワード抽出
- **実装**:
  ```javascript
  function extractKeywords(texts, numKeywords = 10) {
    const tfidf = new TfIdf();
    
    // 各文書をTF-IDFに追加
    texts.forEach(text => tfidf.addDocument(text));
    
    // 重要キーワードを抽出
    const keywords = [];
    tfidf.listTerms(0 /* 最初の文書 */).slice(0, numKeywords).forEach(item => {
      keywords.push({
        term: item.term,
        weight: item.tfidf
      });
    });
    
    return keywords;
  }
  ```

## 4. データ統合と分析結果生成

### 4.1 製品サマリー生成

#### 統合アルゴリズム
- **モジュール**: `/functions/content-generation/summarizer.js`
- **処理**:
  1. 複数動画の感情分析結果統合
  2. 頻出するメリット・デメリットの集約
  3. 信頼性スコアによる重み付け

#### 要約テンプレート
```javascript
function generateProductSummary(analysisResults) {
  const positives = aggregatePositives(analysisResults);
  const negatives = aggregateNegatives(analysisResults);
  const userFit = aggregateUserFit(analysisResults);
  
  return {
    positives: positives.slice(0, 5),  // 上位5件
    negatives: negatives.slice(0, 3),  // 上位3件
    bestFor: userFit,
    score: calculateOverallScore(positives, negatives)
  };
}
```

### 4.2 レビュアー信頼性評価

#### 評価指標
- チャンネル登録者数
- 視聴回数
- 他製品レビューの一貫性
- コメント数と反応

#### スコアリングアルゴリズム
```javascript
function calculateReviewerTrustScore(channel) {
  const subscriberScore = normalizeSubscriberCount(channel.subscriberCount);
  const viewCountScore = normalizeViewCount(channel.viewCount);
  const consistencyScore = analyzeReviewConsistency(channel.id);
  const engagementScore = analyzeEngagementMetrics(channel.id);
  
  return (
    subscriberScore * 0.3 +
    viewCountScore * 0.2 +
    consistencyScore * 0.3 +
    engagementScore * 0.2
  );
}
```

### 4.3 製品比較データ生成

#### 比較メトリクス
- 総合評価スコア
- カテゴリ内順位
- 特定属性スコア（コスパ、機能性など）
- 価格変動傾向

#### 実装モジュール
- `/functions/content-generation/schemaGenerator.js`
- JSON-LD構造化データ生成
- 製品比較テーブル用データ生成

## 5. スケジューリングと最適化

### 5.1 実行スケジュール

#### 日次タスク
- **時間**: 毎日AM 3:00 (UTC)
- **モジュール**: `/functions/scheduler/daily.js`
- **処理**:
  1. トレンド製品特定
  2. 新規レビュー動画検索
  3. トランスクリプト抽出
  4. 分析処理実行

#### 増分更新戦略
- 新規コンテンツのみ処理
- 変更検出による再分析トリガー
- 最大処理件数: 1日あたり100レビュー

### 5.2 パフォーマンス最適化

#### キャッシング戦略
- 分析結果の7日間キャッシュ
- 処理済みトランスクリプトの保存
- 部分更新によるFirestore書き込み最小化

#### リソース使用効率化
```javascript
function shouldProcessVideo(video) {
  // 既存の分析結果を確認
  const existingAnalysis = await db.collection('videoAnalysis')
    .doc(video.id).get();
  
  // 新規または7日以上前の分析なら処理
  if (!existingAnalysis.exists || 
      isOlderThanDays(existingAnalysis.data().timestamp, 7)) {
    return true;
  }
  
  return false;
}
```

## 6. 機械学習モデル管理

### 6.1 モデル詳細

#### 感情分析モデル
- **モデル**: BERT日本語事前学習モデル
- **パラメータ**:
  - 語彙サイズ: 32,000トークン
  - 12層Transformer
  - 768次元の隠れ層
- **精度**: F1スコア 0.85（製品レビューデータセット）

#### トピックモデル
- **モデル**: LDA (Latent Dirichlet Allocation)
- **ハイパーパラメータ**:
  - トピック数: カテゴリに応じて5〜15
  - α: 0.1（文書-トピック事前分布）
  - β: 0.01（トピック-単語事前分布）

### 6.2 モデル保存と読み込み

#### モデルファイル管理
- **場所**: `/models/` ディレクトリ
- **形式**: TensorFlow SavedModel または ONNX
- **読み込み**:
  ```javascript
  const tf = require('@tensorflow/tfjs-node');
  
  async function loadSentimentModel() {
    const model = await tf.loadLayersModel(
      'file://./models/sentiment/model.json'
    );
    return model;
  }
  ```

### 6.3 モデル改善サイクル

#### 評価指標
- 感情分析: 精度、再現率、F1スコア
- トピックモデル: パープレキシティ、一貫性スコア

#### モデル更新プロセス
1. 新規トレーニングデータ収集（月次）
2. モデル再トレーニング
3. A/Bテスト評価
4. デプロイ判断

## 7. データプライバシーとコンプライアンス

### 7.1 引用と著作権

#### 引用ガイドライン
- トランスクリプトからの抜粋は30秒以内または全体の10%以下
- 出典明記とリンク提供
- 公正利用の範囲内での分析・要約

#### クレジット表示
- 動画クリエイター名
- チャンネル名
- 公開日
- 動画URLのリンク

### 7.2 データ保持ポリシー

#### 保存期間
- 生トランスクリプト: 90日
- 分析結果: 無期限
- YouTubeメタデータ: 無期限

#### 削除要求プロセス
- クリエイターからの削除要求に対応するシステム
- 24時間以内の処理保証

## 8. エラーハンドリングと例外処理

### 8.1 データ収集エラー

#### YouTube API例外
- レート制限: 指数バックオフ再試行
- 認証エラー: 管理者通知
- 動画削除時: データベースからのクリーンアップ

#### スクレイピング例外
```javascript
try {
  const priceData = await fetchPriceData(productUrl);
  return priceData;
} catch (error) {
  logger.error(`Price scraping failed for ${productUrl}: ${error.message}`);
  
  if (error.message.includes('captcha')) {
    await sendAdminAlert('CAPTCHA detected during scraping');
    return { error: 'CAPTCHA', timestamp: new Date() };
  }
  
  return { error: error.message, timestamp: new Date() };
}
```

### 8.2 分析エラー

#### モデル実行エラー
- タイムアウト処理: 最大30秒
- メモリ不足: チャンク処理への分割
- 不正入力: バリデーションと前処理強化

#### データ整合性エラー
- 欠損値の処理方法
- 異常値検出と対応

## 9. パフォーマンスベンチマーク

### 9.1 処理時間目標

| 処理内容 | 目標時間 | 最大許容時間 |
|---------|---------|------------|
| 動画1件の完全分析 | 30秒 | 2分 |
| トランスクリプト抽出 | 5秒 | 30秒 |
| 感情分析 | 10秒 | 45秒 |
| 属性抽出 | 10秒 | 45秒 |
| サマリー生成 | 5秒 | 30秒 |

### 9.2 精度目標

| 分析内容 | 目標精度 | 最低許容精度 |
|---------|---------|------------|
| 感情分析 | 85% | 75% |
| メリット抽出 | 80% | 70% |
| デメリット抽出 | 80% | 70% |
| ユーザー適合性 | 75% | 65% |

## 10. 拡張計画

### 10.1 データソース拡張

#### 追加予定ソース
- Amazonレビュー
- ブログ記事
- Twitterメンション
- インスタグラムポスト

#### 分析統合戦略
- 複数ソース間の重み付け
- 情報源信頼性評価
- 矛盾情報の解決アルゴリズム

### 10.2 分析機能強化

#### 実装候補機能
- 時系列レビュー分析（製品評価の経時変化）
- 競合製品比較の自動化
- ユーザーフィードバックによるモデル改善
- 多言語対応（英語、中国語）

## 付録

### A. モデルトレーニングデータ

#### データセット構成
- YouTube製品レビュー字幕: 500動画
- 手動ラベル付けデータ: 100動画
- 評価表現辞書: 2,000語

#### アノテーションガイドライン
- 感情ラベル付け基準
- 属性抽出タグ付け方法
- 評価者間一致率目標: 80%以上

### B. API リファレンス

#### 内部API
- 動画分析API
- 製品比較API
- データ収集トリガーAPI

#### 呼び出し例
```javascript
// 動画分析APIの呼び出し例
const analysisResult = await fetch('/api/analyze', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    videoId: 'aBcXyZ123456',
    productId: 'product-123',
    forceReanalysis: false
  })
}).then(res => res.json());
```

### C. ログ形式定義

#### アプリケーションログ
```javascript
{
  timestamp: '2023-03-15T12:34:56Z',
  level: 'info|warn|error',
  module: 'youtubeSearch|transcriptExtractor|...',
  message: 'ログメッセージ',
  data: { /* 関連データ */ },
  requestId: 'uuid-v4'
}
```

#### 処理スループットログ
- 日次処理件数
- 平均処理時間
- エラー率
- モデル性能メトリクス
