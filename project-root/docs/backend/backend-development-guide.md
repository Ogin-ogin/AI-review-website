# バックエンド開発ガイド

## 概要

このガイドは、AIレビュー動画分析サイトのバックエンド開発に関する指針を提供します。Firebase Functionsを使用したAPIの設計、データ処理パイプライン、スケジューリング、エラーハンドリングについて詳しく説明します。

## 目次

1. [Firebase Functions API設計](#firebase-functions-api設計)
2. [データ処理パイプライン詳細](#データ処理パイプライン詳細)
3. [スケジューリングと自動化プロセス](#スケジューリングと自動化プロセス)
4. [エラーハンドリング戦略](#エラーハンドリング戦略)
5. [パフォーマンス最適化](#パフォーマンス最適化)
6. [セキュリティ考慮事項](#セキュリティ考慮事項)
7. [開発環境構築](#開発環境構築)

## Firebase Functions API設計

### エンドポイント構造

API関数は以下の構造で編成します：

```
functions/
├── api/
│   ├── products.js     # 製品関連API
│   └── webhooks.js     # 外部連携Webhook
```

### RESTful設計原則

以下のエンドポイントを実装します：

| エンドポイント | メソッド | 説明 | アクセス制限 |
|--------------|-------|------|-----------|
| `/api/products` | GET | 製品一覧取得 | 公開 |
| `/api/products/:id` | GET | 製品詳細取得 | 公開 |
| `/api/products/:id/reviews` | GET | 製品レビュー取得 | 公開 |
| `/api/products` | POST | 製品追加 | 管理者のみ |
| `/api/products/:id` | PUT | 製品更新 | 管理者のみ |
| `/api/products/:id` | DELETE | 製品削除 | 管理者のみ |
| `/api/webhooks/youtube` | POST | YouTube更新受信 | API Key必須 |

### リクエスト・レスポンス形式

標準的なJSONレスポンス形式を採用します：

```javascript
// 成功レスポンス
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}

// エラーレスポンス
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "指定されたリソースが見つかりません"
  }
}
```

### APIレート制限

無料枠を維持するため、以下のレート制限を実装します：

- 匿名ユーザー：100リクエスト/時間
- 認証済みユーザー：300リクエスト/時間
- 管理者：無制限

## データ処理パイプライン詳細

### YouTube動画データ収集フロー

1. **検索キーワード生成**：
   - 製品名、カテゴリ、「レビュー」などの組み合わせ
   - 時期に応じたキーワード（新製品、比較など）

2. **YouTube API検索**：
   - 日次クォータ（10,000ユニット）内での効率的な検索
   - 関連性とビュー数に基づくフィルタリング

3. **トランスクリプト取得**：
   - YouTube字幕APIを使用
   - 不足時はSpeech-to-Text APIで補完

4. **ストレージ最適化**：
   - 完全トランスクリプトは処理後に要約のみ保存
   - 動画メタデータは圧縮形式で保存

### 感情分析・属性抽出パイプライン

```javascript
// functions/data-analysis/contentAnalyzer.js
const extractAttributes = async (transcript) => {
  // トランスクリプトから製品特性を抽出
  const segments = splitIntoSegments(transcript);
  const sentiments = await analyzeSentiments(segments);
  
  // カテゴライズ
  const attributes = {
    positives: extractPositiveAttributes(segments, sentiments),
    negatives: extractNegativeAttributes(segments, sentiments),
    neutral: extractNeutralAttributes(segments, sentiments)
  };
  
  return attributes;
};
```

### 価格追跡システム

1. **データソース**：
   - Amazon、楽天、Yahoo!ショッピングなど主要ECサイト
   - 公式APIまたはスクレイピング（robots.txtに準拠）

2. **更新頻度**：
   - 高需要製品：1日2回
   - 通常製品：1日1回
   - 低需要製品：3日ごと

3. **保存形式**：
```javascript
{
  productId: 'product-123',
  priceHistory: [
    {
      date: '2025-01-15',
      stores: [
        { name: 'Amazon', price: 12800, url: '...' },
        { name: 'Rakuten', price: 12600, url: '...' }
      ]
    },
    // 履歴データ
  ]
}
```

## スケジューリングと自動化プロセス

### GitHub Actions ワークフロー

日次更新処理を実装するためのGitHub Actionsワークフロー：

```yaml
# .github/workflows/daily-update.yml
name: Daily Data Update

on:
  schedule:
    - cron: '0 0 * * *'  # 毎日UTC 0:00（日本時間9:00）に実行

jobs:
  update-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install Dependencies
        run: npm ci
      - name: Run Data Collection
        run: npm run collect-data
        env:
          YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
          FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
```

### Firebase Functions スケジューラ

時間単位の更新処理の実装例：

```javascript
// functions/scheduler/hourly.js
const functions = require('firebase-functions');
const { updateTrendingProducts } = require('../data-collection/youtubeSearch');

// 毎時実行
exports.hourlyUpdate = functions.pubsub
  .schedule('0 * * * *')
  .timeZone('Asia/Tokyo')
  .onRun(async (context) => {
    console.log('Hourly update started');
    await updateTrendingProducts();
    console.log('Hourly update completed');
    return null;
  });
```

### 重複排除と増分更新

効率的なデータ更新を行うための戦略：

```javascript
// functions/data-collection/youtubeSearch.js
const searchYoutubeVideos = async (keyword, lastCheckTime) => {
  const params = {
    q: keyword,
    part: 'snippet',
    maxResults: 50,
    type: 'video',
    publishedAfter: lastCheckTime.toISOString()
  };
  
  // 最後のチェック時間以降の動画のみ取得
  const response = await youtube.search.list(params);
  
  // 既存動画との重複チェック
  const newVideos = await filterExistingVideos(response.data.items);
  
  return newVideos;
};
```

## エラーハンドリング戦略

### 構造化エラー定義

標準エラークラスを実装します：

```javascript
// functions/utils/errors.js
class AppError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

class NotFoundError extends AppError {
  constructor(message = 'リソースが見つかりません') {
    super('RESOURCE_NOT_FOUND', message, 404);
  }
}

class AuthorizationError extends AppError {
  constructor(message = '権限がありません') {
    super('UNAUTHORIZED', message, 403);
  }
}

module.exports = {
  AppError,
  NotFoundError,
  AuthorizationError
};
```

### エラーミドルウェア

APIエラーを一貫して処理するミドルウェア：

```javascript
// functions/api/middleware/errorHandler.js
const { logger } = require('../../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`Error: ${err.message}`, { 
    stack: err.stack,
    code: err.code || 'INTERNAL_ERROR'
  });

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_ERROR';
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? '内部エラーが発生しました'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message
    }
  });
};

module.exports = errorHandler;
```

### 外部APIエラー復元戦略

YouTube APIなどの外部サービス障害時の対応：

```javascript
// functions/data-collection/youtubeSearch.js
const fetchYoutubeData = async (keyword) => {
  const MAX_RETRIES = 3;
  let retries = 0;
  
  while (retries < MAX_RETRIES) {
    try {
      const response = await youtube.search.list({
        q: keyword,
        part: 'snippet',
        maxResults: 50
      });
      return response.data;
    } catch (error) {
      if (error.code === 'ECONNRESET' || error.code === 429) {
        // 接続リセットまたはレート制限の場合はリトライ
        retries++;
        await new Promise(r => setTimeout(r, 2000 * retries)); // 指数バックオフ
      } else {
        throw error; // その他のエラーは上位に伝播
      }
    }
  }
  
  throw new Error(`YouTube API呼び出しに${MAX_RETRIES}回失敗しました`);
};
```

## パフォーマンス最適化

### Firestore最適化

クエリパフォーマンスとコスト効率を高めるための戦略：

1. **インデックス定義**：
   - 適切なクエリに対応する複合インデックスを定義
   - `firestore.indexes.json`で管理

2. **データ分割**：
   - 頻繁に更新されるフィールド（価格など）を別コレクションに分割
   - 静的データと動的データの分離

3. **バッチ処理**：
   - 複数のドキュメント更新を単一トランザクションで実行
   - 大量のデータ処理は分散バッチで実行

```javascript
// 大量データ処理の例
const processBatch = async (items, batchSize = 500) => {
  const batches = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = db.batch();
    const chunk = items.slice(i, i + batchSize);
    
    chunk.forEach(item => {
      const ref = db.collection('products').doc(item.id);
      batch.set(ref, item, { merge: true });
    });
    
    batches.push(batch.commit());
  }
  
  return Promise.all(batches);
};
```

### キャッシュ戦略

パフォーマンス向上とコスト削減のためのキャッシュ実装：

```javascript
// functions/api/products.js
const { getRedis, setRedis } = require('../utils/redis');

const getProductById = async (req, res) => {
  const { id } = req.params;
  const cacheKey = `product:${id}`;
  
  // キャッシュチェック
  const cachedData = await getRedis(cacheKey);
  if (cachedData) {
    return res.json({
      success: true,
      data: JSON.parse(cachedData),
      source: 'cache'
    });
  }
  
  // DBからデータ取得
  const productDoc = await db.collection('products').doc(id).get();
  if (!productDoc.exists) {
    throw new NotFoundError('製品が見つかりません');
  }
  
  const productData = productDoc.data();
  
  // キャッシュに保存（1時間）
  await setRedis(cacheKey, JSON.stringify(productData), 3600);
  
  return res.json({
    success: true,
    data: productData,
    source: 'db'
  });
};
```

## セキュリティ考慮事項

### Firebase セキュリティルール

Firestore保護のためのセキュリティルール例：

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 共通関数
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // 製品コレクション
    match /products/{productId} {
      // 読み取りは全ユーザーに許可
      allow read: if true;
      // 書き込みは管理者のみ
      allow write: if isAdmin();
      
      // レビューサブコレクション
      match /reviews/{reviewId} {
        allow read: if true;
        // 認証済みユーザーのみ書き込み可能
        allow create: if isAuthenticated();
        // 自分のレビューのみ更新・削除可能
        allow update, delete: if isAuthenticated() && 
          resource.data.userId == request.auth.uid;
      }
    }
  }
}
```

### API認証

Cloud Functionsのエンドポイント保護：

```javascript
// functions/auth/admin.js
const admin = require('firebase-admin');

const validateFirebaseIdToken = async (req, res, next) => {
  if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '認証が必要です'
      }
    });
  }

  const idToken = req.headers.authorization.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    return next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '無効なトークンです'
      }
    });
  }
};

const validateAdminRole = async (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: '認証が必要です'
      }
    });
  }

  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(req.user.uid)
      .get();
      
    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: '管理者権限が必要です'
        }
      });
    }
    
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '内部エラーが発生しました'
      }
    });
  }
};

module.exports = {
  validateFirebaseIdToken,
  validateAdminRole
};
```

## 開発環境構築

### ローカル開発環境

1. **前提条件**：
   - Node.js 18+
   - Firebase CLI
   - Git

2. **環境変数設定**：
   ```bash
   # .env.local
   YOUTUBE_API_KEY=your_youtube_api_key
   FIREBASE_PROJECT_ID=your_project_id
   ```

3. **Firebase エミュレータ設定**：
   ```bash
   firebase init emulators
   ```

4. **起動コマンド**：
   ```bash
   # Cloud Functions開発
   npm run serve
   
   # フロントエンド開発（別ターミナル）
   cd frontend && npm run dev
   ```

### デプロイ手順

1. **環境変数設定**：
   ```bash
   firebase functions:config:set youtube.api_key="YOUR_API_KEY"
   ```

2. **手動デプロイ**：
   ```bash
   firebase deploy --only functions
   ```

3. **CI/CDパイプライン**：
   GitHub Actionsを使用したデプロイ自動化（プルリクエストマージ時）

### テスト環境

テスト実行方法：

```bash
# 単体テスト
npm run test

# Cloud Functionsの統合テスト
npm run test:integration

# テストカバレッジレポート
npm run test:coverage
```
