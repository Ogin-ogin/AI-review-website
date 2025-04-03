# AI-review-website


# AIレビュー動画分析サイト - システムアーキテクチャ

## ディレクトリ構造
```
project-root/
├── .github/                          # GitHub関連ファイル
│   ├── ISSUE_TEMPLATE/               # イシューテンプレート
│   │   ├── bug_report.md             # バグ報告テンプレート
│   │   └── feature_request.md        # 機能リクエストテンプレート
│   └── workflows/                    # GitHub Actions
│       ├── daily-update.yml          # 日次更新ワークフロー
│       ├── deploy-functions.yml      # Firebase Functions デプロイ
│       └── deploy-frontend.yml       # フロントエンドデプロイ
├── frontend/                         # Next.js フロントエンド
│   ├── components/                   # UIコンポーネント
│   │   ├── common/                   # 共通コンポーネント
│   │   │   ├── Button.js             # ボタンコンポーネント
│   │   │   ├── Card.js               # カードコンポーネント
│   │   │   ├── Footer.js             # フッターコンポーネント
│   │   │   ├── Header.js             # ヘッダーコンポーネント
│   │   │   ├── Layout.js             # レイアウトコンポーネント
│   │   │   ├── Loading.js            # ローディングインジケータ
│   │   │   ├── Modal.js              # モーダルダイアログ
│   │   │   └── SEO.js                # SEOメタデータコンポーネント
│   │   ├── product/                  # 製品関連コンポーネント
│   │   │   ├── ComparisonTable.js    # 製品比較テーブル
│   │   │   ├── PriceHistory.js       # 価格履歴チャート
│   │   │   ├── ProductCard.js        # 製品カード
│   │   │   ├── ProductDetails.js     # 製品詳細
│   │   │   ├── ProductFilter.js      # 製品フィルター
│   │   │   ├── ProductGrid.js        # 製品グリッド表示
│   │   │   ├── ProductReviews.js     # 製品レビュー概要 
│   │   │   └── ReviewVideoCard.js    # レビュー動画カード
│   │   └── home/                     # ホームページコンポーネント
│   │       ├── CategorySection.js    # カテゴリセクション
│   │       ├── FeaturedProducts.js   # 注目製品セクション
│   │       └── HeroSection.js        # ヒーローセクション
│   ├── contexts/                     # Reactコンテキスト
│   │   ├── FilterContext.js          # フィルター状態管理
│   │   └── ThemeContext.js           # テーマ状態管理
│   ├── hooks/                        # カスタムReactフック
│   │   ├── useFirestore.js           # Firestore操作フック
│   │   ├── useLocalStorage.js        # ローカルストレージフック
│   │   └── useProducts.js            # 製品データ取得フック
│   ├── lib/                          # ユーティリティ関数
│   │   ├── firebase.js               # Firebase設定・接続
│   │   ├── formatters.js             # データフォーマット関数
│   │   ├── gtag.js                   # Google Analytics
│   │   └── schema.js                 # Schema.org JSON-LD生成
│   ├── locales/                      # 多言語対応ファイル
│   │   ├── en/                       # 英語
│   │   │   └── common.json           # 共通翻訳
│   │   └── ja/                       # 日本語
│   │       └── common.json           # 共通翻訳
│   ├── middleware/                   # ミドルウェア
│   │   └── auth.js                   # 認証ミドルウェア（管理画面用）
│   ├── pages/                        # ルーティング
│   │   ├── _app.js                   # グローバルレイアウト 
│   │   ├── _document.js              # HTMLドキュメント構造
│   │   ├── api/                      # API ルート
│   │   │   ├── revalidate.js         # ISR再検証エンドポイント
│   │   │   └── sitemap.js            # 動的サイトマップ生成
│   │   ├── admin/                    # 管理画面（非公開）
│   │   │   ├── index.js              # 管理ダッシュボード
│   │   │   └── products/             # 製品管理
│   │   │       ├── [id].js           # 製品編集
│   │   │       └── index.js          # 製品一覧
│   │   ├── category/                 # カテゴリページ
│   │   │   └── [id].js               # カテゴリ詳細ページ
│   │   ├── compare/                  # 製品比較ページ
│   │   │   └── [ids].js              # 製品比較ページ
│   │   ├── index.js                  # ホームページ
│   │   ├── privacy-policy.js         # プライバシーポリシー
│   │   ├── product/                  # 製品詳細ページ
│   │   │   └── [id].js               # 製品詳細ページ
│   │   └── terms.js                  # 利用規約
│   ├── public/                       # 静的アセット
│   │   ├── favicon.ico               # ファビコン
│   │   ├── images/                   # 画像ファイル
│   │   ├── robots.txt                # ロボット制御ファイル
│   │   └── sitemap.xml               # 静的サイトマップ
│   ├── styles/                       # スタイル
│   │   ├── globals.css               # グローバルスタイル
│   │   └── theme.js                  # テーマ設定
│   ├── .env.development              # 開発環境変数
│   ├── .env.local.example            # 環境変数サンプル
│   ├── .env.production               # 本番環境変数
│   ├── next.config.js                # Next.js設定
│   ├── package.json                  # 依存関係・スクリプト
│   └── tailwind.config.js            # Tailwind CSS設定
├── functions/                        # Firebase Functions
│   ├── api/                          # API関数
│   │   ├── products.js               # 製品API
│   │   └── webhooks.js               # Webhookエンドポイント
│   ├── auth/                         # 認証関連処理
│   │   └── admin.js                  # 管理者認証
│   ├── data-analysis/                # データ分析モジュール
│   │   ├── contentAnalyzer.js        # テキスト分析
│   │   ├── models/                   # 分析モデル
│   │   │   ├── sentimentModel.js     # 感情分析モデル
│   │   │   └── topicModel.js         # トピック抽出モデル
│   │   ├── sentiment.js              # 感情分析ロジック
│   │   └── transcriptExtractor.js    # 字幕抽出
│   ├── data-collection/              # データ収集パイプライン
│   │   ├── priceTracker.js           # 価格情報取得
│   │   └── youtubeSearch.js          # YouTube API操作
│   ├── content-generation/           # コンテンツ生成エンジン
│   │   ├── schemaGenerator.js        # 構造化データ生成
│   │   └── summarizer.js             # レビュー要約生成
│   ├── scheduler/                    # スケジューラー
│   │   ├── daily.js                  # 日次タスク
│   │   └── hourly.js                 # 時間毎タスク
│   ├── utils/                        # ユーティリティ
│   │   ├── db.js                     # データベースヘルパー
│   │   ├── http.js                   # HTTPリクエストヘルパー
│   │   └── logger.js                 # ロギング機能
│   ├── .env.example                  # 環境変数サンプル
│   ├── index.js                      # Functions エントリーポイント
│   └── package.json                  # 依存関係・スクリプト
├── models/                           # AIモデル定義
│   ├── sentiment/                    # 感情分析モデル
│   └── topic/                        # トピック抽出モデル
├── scripts/                          # ユーティリティスクリプト
│   ├── export-data.js                # データエクスポート
│   ├── import-products.js            # 製品データインポート
│   └── seed-database.js              # テストデータ作成
├── tests/                            # テスト
│   ├── e2e/                          # E2Eテスト
│   │   └── cypress/                  # Cypressテスト
│   ├── frontend/                     # フロントエンドテスト
│   │   └── components/               # コンポーネントテスト
│   └── functions/                    # Functions テスト
│       └── api/                      # APIテスト
├── .env.local                        # ローカル環境変数
├── .firebaserc                       # Firebase プロジェクト設定
├── .gitignore                        # Git 除外ファイル
├── CONTRIBUTING.md                   # 貢献ガイドライン
├── firebase.json                     # Firebase 設定
├── firestore.indexes.json            # Firestore インデックス設定
├── firestore.rules                   # Firestore セキュリティルール
├── jest.config.js                    # Jest テスト設定
├── LICENSE                           # ライセンス情報
├── package.json                      # プロジェクト情報・依存関係
├── README.md                         # プロジェクト概要
└── vercel.json                       # Vercel デプロイ設定
```

## 主要プロセスフロー

1. **データ収集**
   - GitHub Actions トリガー
   - YouTube API検索
   - 価格情報スクレイピング
   - Firestoreデータ保存

2. **データ分析**
   - トランスクリプト抽出
   - テキスト感情分析
   - 属性抽出（メリット/デメリット）
   - ユーザー適合性分析

3. **コンテンツ生成**
   - レビュー統合要約
   - 構造化データ生成
   - SEO最適化メタデータ

4. **フロントエンド表示**
   - 静的ページ生成
   - ユーザーインタラクション処理

## AI レビュー動画分析サイト 仕様書
1. システム概要
レビュー動画をAIで分析し、製品評価を自動集約するウェブサイト。キャンプ用品・自動車から開始し、ジャンル拡張可能な設計。
2. 技術スタック
* フロントエンド: Next.js（静的生成）
* バックエンド: Firebase Functions（無料枠）
* データベース: Firebase Firestore（無料枠）
* ホスティング: Vercel（無料枠）
* AI: Hugging Face オープンソースモデル
* API: YouTube Data API v3
3. システム構成
3.1 データ収集パイプライン
* YouTube検索処理: キーワード自動生成、検索結果収集
* スクレイピング: 価格情報（Amazon/楽天）取得
* スケジュール: GitHub Actions（毎日実行）
3.2 データ分析モジュール
* 動画トランスクリプト抽出: YouTube自動字幕または音声認識API
* テキスト分析:
   * 感情分析（ポジティブ/ネガティブ）
   * 属性抽出（メリット/デメリット）
   * ユーザー適合性分析
* メタデータ抽出: 商品スペック、価格推移
3.3 コンテンツ生成エンジン
* サマリー生成: レビュー統合と要約
* 構造化データ生成: Schema.org対応JSON-LD
* SEO最適化: メタタグ自動生成
3.4 フロントエンド
* レスポンシブデザイン: モバイル最適化
* ページテンプレート:
   * カテゴリページ
   * 製品詳細ページ
   * 比較ページ
* インタラクション: 絞り込み検索、ソート機能
4. データモデル

javascript
コピー
// 商品スキーマ { id: String, name: String, category: String, subCategory: String, images: Array<String>, summary: { positives: Array<String>, negatives: Array<String>, bestFor: Array<String>, score: Number }, specs: Object, prices: [{ store: String, price: Number, currency: String, url: String, lastUpdated: Timestamp }], videos: [{ id: String, platform: String, title: String, channelName: String, url: String, thumbnailUrl: String, publishedAt: Timestamp, viewCount: Number, sentiment: Number }], lastUpdated: Timestamp, trending: Boolean, rank: Number }
5. 主要プロセス
5.1 日次更新処理
1. トレンド商品特定（YouTube/商品サイト検索）
2. 新商品レビュー動画収集
3. トランスクリプト抽出・分析
4. 価格情報更新
5. 静的ページ再生成
5.2 コンテンツ拡張プロセス
1. 新カテゴリ定義
2. キーワードセット作成
3. 初期データ収集（上位50-100商品）
4. カテゴリページテンプレート適用
6. 無料枠維持戦略
* YouTube API: 日次クォータ10,000ユニット内に収める
* Firebase: 読み取り/書き込み最適化
* 静的生成: CDN活用でホスティングコスト削減
* バッチ処理: 増分更新のみ実行
7. SEO・マネタイズ戦略
* 構造化データ: 商品リッチスニペット実装
* サイトマップ: 自動生成・更新
* アフィリエイト: Amazon・楽天アソシエイト連携
8. 実装ロードマップ
1. PoC（1カテゴリ、手動プロセス）
2. データ収集自動化
3. 分析エンジン改良
4. UI/UX最適化
5. カテゴリ拡張フレームワーク確立
9. 拡張性検討事項
* ユーザーレビュー統合
* レビュアー信頼性スコアリング
* 価格変動アラート機能
* モバイルアプリ展開
10. 法的考慮事項
* 引用範囲の適正管理
* アフィリエイト表示規則遵守
* プライバシーポリシー策定

# 必要なマスタードキュメント一覧

## システム設計仕様書

* システム全体のアーキテクチャ、データフロー、機能要件
* 使用技術スタックと選定理由
* 処理フロー図とシステム構成


## データモデル定義書

* Firestore コレクション構造
* 主要オブジェクトスキーマ定義
* リレーション図


## フロントエンド開発ガイド

* コンポーネント構成と責務
* 状態管理戦略
* ルーティング設計
* スタイリング規約


## バックエンド開発ガイド

* Firebase Functions API設計
* データ処理パイプライン詳細
* スケジューリングと自動化プロセス
* エラーハンドリング戦略


## AI・データ分析仕様書

* 分析モデルの詳細
* データ収集・処理フロー
* YouTube APIとの連携設計
* 感情分析・トピック抽出アルゴリズム


## デプロイ・運用ガイド

* GitHub Actions ワークフロー詳細
* Vercel/Firebase デプロイ設定
* 環境変数管理
* パフォーマンスモニタリング


## SEO・マネタイズ戦略書

* 構造化データ実装ガイド
* アフィリエイト連携設計
* SEO最適化戦略
* 分析・トラッキング設定