# AI-review-website


# AIレビュー動画分析サイト - システムアーキテクチャ

## ディレクトリ構造
```
project-root/
├── frontend/                    # Next.js フロントエンド
│   ├── pages/                   # ルーティング
│   │   ├── index.js             # ホームページ
│   │   ├── category/[id].js     # カテゴリページ
│   │   ├── product/[id].js      # 製品詳細ページ
│   │   └── compare/[ids].js     # 製品比較ページ
│   ├── components/              # UIコンポーネント
│   ├── lib/                     # ユーティリティ関数
│   └── public/                  # 静的アセット
├── functions/                   # Firebase Functions
│   ├── data-collection/         # データ収集パイプライン
│   │   ├── youtubeSearch.js     # YouTube API操作
│   │   └── priceTracker.js      # 価格情報取得
│   ├── data-analysis/           # データ分析モジュール
│   │   ├── transcriptExtractor.js # 字幕抽出
│   │   └── contentAnalyzer.js   # テキスト分析
│   └── content-generation/      # コンテンツ生成エンジン
│       ├── summarizer.js        # レビュー要約生成
│       └── schemaGenerator.js   # 構造化データ生成
└── workflows/                   # GitHub Actions
    └── daily-update.yml         # 日次更新ワークフロー
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