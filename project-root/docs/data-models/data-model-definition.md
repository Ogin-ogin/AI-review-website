# AIレビュー動画分析サイト - データモデル定義書

## 概要

このドキュメントは、AIレビュー動画分析サイトで使用されるFirestoreのデータモデル構造、主要なコレクションとドキュメントのスキーマ、およびそれらの関連性を定義します。システム全体の整合性を保ち、効率的なデータアクセスと操作を確保するための基準となります。

## Firestoreコレクション構造

Firestoreデータベースは以下の主要コレクションで構成されます：

```
firestore-root/
├── products/                     # 製品情報
│   └── {productId}/              # 個別製品ドキュメント
│       ├── videos/               # 製品に関連する動画サブコレクション
│       │   └── {videoId}/        # 個別動画ドキュメント
│       └── prices/               # 価格履歴サブコレクション
│           └── {timestamp}/      # 時点ごとの価格情報
├── categories/                   # カテゴリ定義
│   └── {categoryId}/             # カテゴリドキュメント
│       └── subcategories/        # サブカテゴリサブコレクション
│           └── {subcategoryId}/  # サブカテゴリドキュメント
├── videos/                       # グローバル動画コレクション
│   └── {videoId}/                # 動画メタデータドキュメント
│       └── transcripts/          # 字幕・トランスクリプト
│           └── {languageCode}/   # 言語別トランスクリプト
├── stores/                       # ストア情報（Amazon、楽天など）
│   └── {storeId}/                # ストアドキュメント
├── analytics/                    # 分析データ
│   ├── trending/                 # トレンド分析
│   │   └── {date}/               # 日付別トレンド
│   └── keywords/                 # キーワード分析
│       └── {keyword}/            # キーワードドキュメント
└── system/                       # システム情報
    └── settings/                 # システム設定
```

## 主要オブジェクトスキーマ定義

### Product（製品）

```javascript
{
  id: String,                     // 製品ID（自動生成または正規化された製品名）
  name: String,                   // 製品名
  slug: String,                   // URL用スラッグ（SEO最適化）
  category: String,               // カテゴリID（参照）
  subCategory: String,            // サブカテゴリID（参照）
  brand: String,                  // ブランド名
  description: String,            // 製品説明
  images: [                       // 製品画像URL配列
    {
      url: String,                // 画像URL
      alt: String,                // 代替テキスト
      source: String              // 画像ソース（「自社撮影」または「メーカー提供」など）
    }
  ],
  summary: {                      // AIによる分析要約
    positives: [String],          // メリット・ポジティブポイント
    negatives: [String],          // デメリット・ネガティブポイント
    bestFor: [String],            // 最適な使用ケース
    score: Number,                // 総合評価スコア（0-100）
    overallSentiment: Number,     // 総合的な感情スコア（-1.0〜1.0）
    confidence: Number            // 分析信頼度（0.0〜1.0）
  },
  specs: {                        // 製品仕様（カテゴリによって異なる）
    // キャンプ用品の例
    weight: Number,               // 重量（g）
    dimensions: {                 // サイズ
      width: Number,              // 幅（cm）
      height: Number,             // 高さ（cm）
      depth: Number               // 奥行き（cm）
    },
    material: String,             // 素材
    waterproof: Boolean,          // 防水性能
    // カテゴリ固有の他の仕様
    [key: String]: any            // 動的仕様フィールド
  },
  prices: [                       // 現在の価格情報（最新5件）
    {
      store: String,              // ストアID（参照）
      price: Number,              // 価格
      currency: String,           // 通貨コード（デフォルト: "JPY"）
      url: String,                // 商品ページURL
      lastUpdated: Timestamp      // 最終更新日時
    }
  ],
  priceHistory: {                 // 価格履歴サマリー
    lowest: {
      price: Number,              // 最低価格
      date: Timestamp             // 最低価格日時
    },
    highest: {
      price: Number,              // 最高価格
      date: Timestamp             // 最高価格日時
    },
    average: Number               // 平均価格（30日間）
  },
  videos: [                       // 関連動画参照（最新10件）
    {
      id: String,                 // 動画ID（参照）
      platform: String,           // プラットフォーム（"youtube"など）
      title: String,              // 動画タイトル
      channelName: String,        // チャンネル名
      url: String,                // 動画URL
      thumbnailUrl: String,       // サムネイルURL
      publishedAt: Timestamp,     // 公開日時
      viewCount: Number,          // 視聴回数
      sentiment: Number,          // 感情スコア（-1.0〜1.0）
      relevanceScore: Number      // 関連性スコア（0.0〜1.0）
    }
  ],
  seo: {                          // SEO関連情報
    metaTitle: String,            // メタタイトル
    metaDescription: String,      // メタ説明
    keywords: [String],           // キーワード
    structuredData: Object        // JSON-LD構造化データ
  },
  stats: {                        // 統計情報
    reviewCount: Number,          // レビュー数
    averageRating: Number,        // 平均評価（0.0〜5.0）
    viewCount: Number,            // 閲覧数
    compareCount: Number          // 比較回数
  },
  relatedProducts: [String],      // 関連製品ID（参照）
  createdAt: Timestamp,           // 作成日時
  updatedAt: Timestamp,           // 更新日時
  lastAnalyzedAt: Timestamp,      // 最終分析日時
  trending: Boolean,              // トレンドフラグ
  rank: Number                    // カテゴリ内ランキング
}
```

### Video（動画）

```javascript
{
  id: String,                     // 動画ID（YouTubeビデオIDなど）
  platform: String,               // プラットフォーム（"youtube"など）
  title: String,                  // 動画タイトル
  description: String,            // 動画説明
  channelId: String,              // チャンネルID
  channelName: String,            // チャンネル名
  url: String,                    // 動画URL
  embedUrl: String,               // 埋め込みURL
  thumbnails: {                   // サムネイル（複数サイズ）
    default: String,              // デフォルト（120x90）
    medium: String,               // 中（320x180）
    high: String,                 // 高（480x360）
    standard: String,             // 標準（640x480）
    maxres: String                // 最高解像度（1280x720）
  },
  duration: String,               // 動画時間（ISO 8601形式）
  durationSeconds: Number,        // 動画時間（秒）
  publishedAt: Timestamp,         // 公開日時
  stats: {                        // 統計情報
    viewCount: Number,            // 視聴回数
    likeCount: Number,            // いいね数
    commentCount: Number          // コメント数
  },
  products: [String],             // 関連製品ID（参照）
  analysis: {                     // AI分析結果
    sentiment: Number,            // 全体的な感情スコア（-1.0〜1.0）
    topics: [                     // 抽出されたトピック
      {
        name: String,             // トピック名
        score: Number,            // 関連度スコア（0.0〜1.0）
        sentimentScore: Number    // トピック別感情スコア（-1.0〜1.0）
      }
    ],
    mentions: [                   // 製品言及
      {
        productId: String,        // 製品ID（参照）
        count: Number,            // 言及回数
        timestamp: [Number],      // 言及タイムスタンプ（秒）
        sentiment: Number         // 言及の感情スコア（-1.0〜1.0）
      }
    ],
    keyPoints: [String],          // 重要ポイント
    pros: [String],               // メリット
    cons: [String],               // デメリット
    confidence: Number            // 分析信頼度（0.0〜1.0）
  },
  transcript: {                   // 短縮版トランスクリプト
    text: String,                 // 全文テキスト（先頭1000文字）
    language: String,             // 言語コード
    hasComplete: Boolean          // 完全版存在フラグ
  },
  lastAnalyzedAt: Timestamp,      // 最終分析日時
  createdAt: Timestamp,           // 作成日時
  updatedAt: Timestamp            // 更新日時
}
```

### Category（カテゴリ）

```javascript
{
  id: String,                     // カテゴリID
  name: String,                   // カテゴリ名
  slug: String,                   // URL用スラッグ
  description: String,            // 説明
  image: String,                  // 画像URL
  icon: String,                   // アイコン（Material IconまたはSVG）
  orderIndex: Number,             // 表示順序
  filters: [                      // カテゴリ固有フィルター
    {
      name: String,               // フィルター名
      type: String,               // タイプ（"checkbox", "radio", "range"など）
      field: String,              // 対応するフィールド
      options: [                  // フィルターオプション（typeに依存）
        {
          value: any,             // 値
          label: String           // ラベル
        }
      ]
    }
  ],
  specDefinitions: [              // 仕様定義
    {
      name: String,               // 仕様名
      key: String,                // オブジェクトキー
      type: String,               // データタイプ
      unit: String,               // 単位（該当する場合）
      isImportant: Boolean        // 重要フラグ（一覧表示用）
    }
  ],
  productCount: Number,           // 製品数
  createdAt: Timestamp,           // 作成日時
  updatedAt: Timestamp            // 更新日時
}
```

### Subcategory（サブカテゴリ）

```javascript
{
  id: String,                     // サブカテゴリID
  categoryId: String,             // 親カテゴリID（参照）
  name: String,                   // サブカテゴリ名
  slug: String,                   // URL用スラッグ
  description: String,            // 説明
  image: String,                  // 画像URL
  orderIndex: Number,             // 表示順序
  productCount: Number,           // 製品数
  createdAt: Timestamp,           // 作成日時
  updatedAt: Timestamp            // 更新日時
}
```

### Store（ストア）

```javascript
{
  id: String,                     // ストアID
  name: String,                   // ストア名
  url: String,                    // ストアURL
  logo: String,                   // ロゴURL
  apiCredentials: {               // API認証情報（管理者のみアクセス可）
    apiKey: String,               // APIキー
    secretKey: String,            // シークレットキー
    affiliateId: String           // アフィリエイトID
  },
  active: Boolean,                // アクティブ状態
  priority: Number,               // 優先度（価格表示順序）
  trackingIdFormat: String,       // トラッキングID生成フォーマット
  createdAt: Timestamp,           // 作成日時
  updatedAt: Timestamp            // 更新日時
}
```

### Transcript（トランスクリプト）

```javascript
{
  videoId: String,                // 動画ID（参照）
  language: String,               // 言語コード
  isAutoGenerated: Boolean,       // 自動生成フラグ
  full: String,                   // 完全なトランスクリプト
  segments: [                     // セグメント
    {
      index: Number,              // インデックス
      startTime: Number,          // 開始時間（秒）
      endTime: Number,            // 終了時間（秒）
      text: String,               // テキスト
      sentiment: Number           // 感情スコア（オプション）
    }
  ],
  createdAt: Timestamp,           // 作成日時
  updatedAt: Timestamp            // 更新日時
}
```

### Price（価格履歴）

```javascript
{
  productId: String,              // 製品ID（参照）
  storeId: String,                // ストアID（参照）
  price: Number,                  // 価格
  currency: String,               // 通貨コード
  url: String,                    // 製品ページURL
  inStock: Boolean,               // 在庫状況
  shippingCost: Number,           // 送料（オプション）
  discount: {                     // 割引情報（オプション）
    original: Number,             // 元の価格
    percent: Number               // 割引率
  },
  timestamp: Timestamp            // 記録タイムスタンプ
}
```

## インデックス定義

効率的なクエリパフォーマンスのために以下のインデックスを設定します：

```javascript
// 製品検索用インデックス
{
  collection: "products",
  fields: [
    { fieldPath: "category", order: "ASCENDING" },
    { fieldPath: "rank", order: "ASCENDING" }
  ]
}

{
  collection: "products",
  fields: [
    { fieldPath: "category", order: "ASCENDING" },
    { fieldPath: "summary.score", order: "DESCENDING" }
  ]
}

{
  collection: "products",
  fields: [
    { fieldPath: "trending", order: "ASCENDING" },
    { fieldPath: "updatedAt", order: "DESCENDING" }
  ]
}

// 動画検索用インデックス
{
  collection: "videos",
  fields: [
    { fieldPath: "products", arrayConfig: "CONTAINS" },
    { fieldPath: "publishedAt", order: "DESCENDING" }
  ]
}

{
  collection: "videos",
  fields: [
    { fieldPath: "channelId", order: "ASCENDING" },
    { fieldPath: "publishedAt", order: "DESCENDING" }
  ]
}

// 価格履歴用インデックス
{
  collection: "products/{productId}/prices",
  fields: [
    { fieldPath: "storeId", order: "ASCENDING" },
    { fieldPath: "timestamp", order: "DESCENDING" }
  ]
}
```

## リレーション図

主要なコレクション間の関連性を以下に示します：

```
+-------------+      +-------------+      +-------------+
|  Category   |<-----+   Product   +----->|    Store    |
+-------------+      +-------------+      +-------------+
       ^              ^    |    ^
       |              |    |    |
       v              |    v    |
+-------------+      +-------------+      +-------------+
| Subcategory |<---->|    Video    +----->| Transcript  |
+-------------+      +-------------+      +-------------+
                           ^
                           |
                           v
                     +-------------+
                     |    Price    |
                     +-------------+
```

## アクセス権限設計

Firestoreセキュリティルールの基本方針：

1. **一般ユーザー**
   - 製品、カテゴリ、動画の読み取りのみ許可
   - 統計情報の読み取りのみ許可

2. **管理ユーザー**
   - すべてのコレクションへの読み書き許可
   - ストア認証情報へのアクセス権

3. **システムサービスアカウント**
   - データ更新処理のための書き込み権限
   - 分析結果の保存権限

```javascript
// firestore.rules (簡略版)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 公開データ - 読み取りのみ許可
    match /products/{productId} {
      allow read: if true;
      allow write: if isAdmin();
      
      match /videos/{videoId} {
        allow read: if true;
        allow write: if isAdmin();
      }
      
      match /prices/{priceId} {
        allow read: if true;
        allow write: if isAdmin() || isServiceAccount();
      }
    }
    
    match /categories/{categoryId} {
      allow read: if true;
      allow write: if isAdmin();
      
      match /subcategories/{subcategoryId} {
        allow read: if true;
        allow write: if isAdmin();
      }
    }
    
    match /videos/{videoId} {
      allow read: if true;
      allow write: if isAdmin() || isServiceAccount();
      
      match /transcripts/{langCode} {
        allow read: if true;
        allow write: if isAdmin() || isServiceAccount();
      }
    }
    
    // 管理者用データ
    match /stores/{storeId} {
      allow read: if true;
      allow write: if isAdmin();
      // API認証情報は管理者のみアクセス可
      match /apiCredentials/{credId} {
        allow read, write: if isAdmin();
      }
    }
    
    // システム管理データ
    match /system/{docId} {
      allow read: if isAdmin();
      allow write: if isAdmin();
    }
    
    // ヘルパー関数
    function isAdmin() {
      return request.auth != null && request.auth.token.admin == true;
    }
    
    function isServiceAccount() {
      return request.auth != null && request.auth.token.service_account == true;
    }
  }
}
```

## データ操作ガイドライン

### パフォーマンス最適化

1. **クエリ効率化**
   - 必要な属性のみをクエリする
   - ページネーションを適切に使用する（`limit()` と `startAfter()`）
   - 複合クエリには必ずインデックスを作成する

2. **サブコレクションの使い分け**
   - 頻繁に更新されるデータ（価格履歴など）はサブコレクションに
   - よく一緒に読み取られるデータは同じドキュメント内に

3. **バッチ処理**
   - 複数のドキュメント更新は `WriteBatch` を使用
   - トランザクションで整合性を確保

4. **データサイズ制限**
   - ドキュメントサイズは1MBを超えないようにする
   - 大きなデータセットは適切に分割する

### データ整合性

1. **トランザクション**
   - 複数ドキュメントに関連する更新には必ずトランザクションを使用
   - 読み取り・書き込みの両方をトランザクション内に含める

2. **カウンターフィールド**
   - 頻繁に更新される集計値（閲覧数など）は分散カウンターパターンを使用

3. **バックアップ戦略**
   - 定期的なエクスポート処理
   - エラー発生時のロールバック機能

## データ移行・バージョニング戦略

1. **スキーマバージョン管理**
   - スキーマバージョンをドキュメントに含める
   - 互換性のない変更は新しいフィールドで対応

2. **データ移行プロセス**
   - 段階的な移行（バッチ処理）
   - 古いスキーマのサポート期間を設定

3. **テスト環境**
   - 移行前に必ずテスト環境で検証
   - パフォーマンスとデータ整合性のテスト

## セキュリティとプライバシー

1. **センシティブデータ**
   - APIキーなどの認証情報は暗号化して保存
   - ユーザー特定情報は収集しない

2. **アクセス制御**
   - 適切なFirestoreセキュリティルールの適用
   - カスタムクレームを使用した権限制御

3. **データ保持ポリシー**
   - 古いデータの自動アーカイブ/削除ポリシー
   - 法規制に準拠したデータ保持期間

## アプリケーションデータフロー

1. **リアルタイム更新** 
   - リアルタイムリスナーは必要な場合のみ使用
   - 頻繁に変更されないデータは通常のクエリで取得

2. **キャッシュ戦略**
   - フロントエンドでのデータキャッシュ期間の設定
   - データ鮮度と負荷バランスの最適化

3. **オフライン対応**
   - オフラインファーストアプローチ
   - キャッシュとローカルストレージの併用
