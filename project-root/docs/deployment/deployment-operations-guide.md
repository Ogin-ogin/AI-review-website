# AIレビュー動画分析サイト - デプロイ・運用ガイド

このガイドでは、AIレビュー動画分析サイトのデプロイおよび継続的な運用の手順について説明します。システムの安定性を維持し、効率的な更新と運用を実現するための設定とプロセスを詳細に記載しています。

## 目次

1. [GitHub Actions ワークフロー詳細](#github-actions-ワークフロー詳細)
2. [Vercel/Firebase デプロイ設定](#vercelfirebase-デプロイ設定)
3. [環境変数管理](#環境変数管理)
4. [パフォーマンスモニタリング](#パフォーマンスモニタリング)
5. [バックアップと復旧戦略](#バックアップと復旧戦略)
6. [スケーリング戦略](#スケーリング戦略)
7. [トラブルシューティング](#トラブルシューティング)

## GitHub Actions ワークフロー詳細

プロジェクトには次の3つの主要なGitHub Actionsワークフローがあります：

### 1. 日次更新ワークフロー (`daily-update.yml`)

このワークフローは毎日自動実行され、最新のデータを収集・処理します。

```yaml
name: Daily Data Update

on:
  schedule:
    # 毎日日本時間の午前3時（UTC 18:00）に実行
    - cron: '0 18 * * *'
  workflow_dispatch:  # 手動トリガー用

jobs:
  update-data:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: './functions/package-lock.json'
      
      - name: Install Dependencies
        run: cd functions && npm ci
      
      - name: Run Data Collection
        env:
          YOUTUBE_API_KEY: ${{ secrets.YOUTUBE_API_KEY }}
          FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
        run: cd functions && node scripts/run-daily-update.js
      
      - name: Trigger Revalidation
        run: |
          curl -X POST \
          -H "Content-Type: application/json" \
          -H "x-api-key: ${{ secrets.REVALIDATION_API_KEY }}" \
          "https://your-domain.com/api/revalidate"
```

#### 主な処理内容：

1. YouTubeからトレンド動画の検索と収集
2. 商品価格情報の更新
3. 新規レビュー動画のトランスクリプト抽出と分析
4. レビュー要約の更新
5. 静的ページ再生成のトリガー

### 2. Firebase Functions デプロイ (`deploy-functions.yml`)

バックエンド機能をデプロイするためのワークフロー：

```yaml
name: Deploy Firebase Functions

on:
  push:
    branches: [ main ]
    paths:
      - 'functions/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install Dependencies
        run: cd functions && npm ci
        
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: ${{ secrets.FIREBASE_PROJECT_ID }}
          entryPoint: './functions'
```

### 3. フロントエンドデプロイ (`deploy-frontend.yml`)

フロントエンドをVercelにデプロイするためのワークフロー：

```yaml
name: Deploy Frontend

on:
  push:
    branches: [ main ]
    paths:
      - 'frontend/**'
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Vercel CLI
        run: npm install --global vercel@latest
        
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
        run: |
          cd frontend
          vercel --token ${VERCEL_TOKEN} --prod
```

## Vercel/Firebase デプロイ設定

### Vercel 設定

フロントエンドはVercelでホスティングされています。`vercel.json`の設定例：

```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "frontend/$1"
    }
  ],
  "env": {
    "NEXT_PUBLIC_FIREBASE_API_KEY": "@firebase-api-key",
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN": "@firebase-auth-domain",
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "@firebase-project-id",
    "NEXT_PUBLIC_GA_TRACKING_ID": "@ga-tracking-id"
  }
}
```

#### デプロイ設定の重要ポイント：

- **ISR (Incremental Static Regeneration)** を活用して、高パフォーマンスと最新データの両立
- Vercel Edge Networkによる高速コンテンツ配信
- プレビューデプロイメントによる変更確認

### Firebase 設定

バックエンドとデータベースはFirebaseを使用しています。`firebase.json`の設定例：

```json
{
  "functions": {
    "source": "functions",
    "predeploy": [
      "npm --prefix \"$RESOURCE_DIR\" run lint"
    ],
    "runtime": "nodejs18"
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "emulators": {
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "ui": {
      "enabled": true,
      "port": 4000
    }
  }
}
```

#### Firebase Functions の最適化：

- **コールドスタート軽減**: 無料枠を最大活用するためのコード最適化
- **依存関係の軽量化**: 不要なパッケージの削除
- **リージョン設定**: 日本向けサービスのため `asia-northeast1` に設定

## 環境変数管理

### フロントエンド環境変数

Next.jsプロジェクトでは、以下の環境変数ファイルを使い分けます：

- `.env.development` - 開発環境用
- `.env.production` - 本番環境用
- `.env.local` - ローカル開発用（Gitで追跡しない）

```
# .env.example
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_GA_TRACKING_ID=

# 非公開キー（クライアントに公開されない）
REVALIDATION_SECRET_TOKEN=
ADMIN_EMAIL=
```

### Firebase Functions 環境変数

Firebase Functionsでは、以下の方法で環境変数を設定します：

```bash
# 環境変数設定コマンド
firebase functions:config:set youtube.api_key="YOUR_API_KEY" \
  admin.email="admin@example.com" \
  scraping.user_agent="Mozilla/5.0 ..." \
  sentry.dsn="https://..."
```

設定の確認：

```bash
firebase functions:config:get
```

アプリケーション内での使用：

```javascript
const functions = require('firebase-functions');
const config = functions.config();
const apiKey = config.youtube.api_key;
```

### シークレット管理

機密情報はGitHub Secretsで安全に管理します：

1. GitHubリポジトリの Settings > Secrets and variables > Actions
2. 必要なシークレットを追加：
   - `FIREBASE_SERVICE_ACCOUNT`
   - `YOUTUBE_API_KEY`
   - `VERCEL_TOKEN`
   - `REVALIDATION_API_KEY`
   - その他API認証情報

## パフォーマンスモニタリング

### Firebase Performance Monitoring

バックエンドのパフォーマンスを監視するための設定：

```javascript
// functions/utils/logger.js
const functions = require('firebase-functions');
const { performance } = require('perf_hooks');

const logPerformance = async (operation, callback) => {
  const start = performance.now();
  try {
    return await callback();
  } finally {
    const duration = performance.now() - start;
    functions.logger.info(`${operation} completed in ${duration.toFixed(2)}ms`);
  }
};

module.exports = { logPerformance };
```

### Vercel Analytics

フロントエンドのパフォーマンスモニタリング：

- Vercelダッシュボードで自動的に有効化
- Web Vitals (LCP, FID, CLS) の監視
- リアルユーザーモニタリング (RUM)

### カスタムモニタリング

重要な指標を監視する独自のログ記録システム：

```javascript
// functions/utils/monitoring.js
const { Logging } = require('@google-cloud/logging');
const logging = new Logging();

const monitoringLog = logging.log('app-monitoring');

const trackMetric = (metricName, value, labels = {}) => {
  const metadata = {
    resource: {
      type: 'cloud_function',
      labels: { function_name: process.env.FUNCTION_NAME }
    },
    severity: 'INFO',
    labels: {
      ...labels,
      environment: process.env.NODE_ENV
    }
  };
  
  const entry = monitoringLog.entry(metadata, {
    metric: metricName,
    value: value,
    timestamp: new Date().toISOString()
  });
  
  return monitoringLog.write(entry);
};

module.exports = { trackMetric };
```

### 定期的な健全性チェック

システムの健全性を確認するためのエンドポイント：

```javascript
// functions/api/status.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.healthCheck = functions.https.onRequest(async (req, res) => {
  try {
    // Firestoreの接続確認
    const db = admin.firestore();
    const testRef = db.collection('system').doc('health');
    await testRef.set({ lastChecked: admin.firestore.FieldValue.serverTimestamp() });
    
    // YouTube API確認
    const youtubeApiStatus = await checkYouTubeApi();
    
    // 各サービスの状態をレポート
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        firestore: 'operational',
        youtubeApi: youtubeApiStatus ? 'operational' : 'degraded',
        // 他のサービス状態
      }
    });
  } catch (error) {
    functions.logger.error('Health check failed', error);
    res.status(500).json({
      status: 'error',
      message: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message
    });
  }
});
```

## バックアップと復旧戦略

### Firestore データバックアップ

定期的なデータバックアップ：

```yaml
# .github/workflows/firestore-backup.yml
name: Firestore Backup

on:
  schedule:
    - cron: '0 0 * * 0'  # 毎週日曜日に実行
  workflow_dispatch:

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up gcloud SDK
        uses: google-github-actions/setup-gcloud@v1
      
      - name: Backup Firestore
        run: |
          gcloud firestore export gs://${{ secrets.BACKUP_BUCKET }}/backups/$(date +%Y-%m-%d)
```

### 復旧プロセス

障害発生時の復旧手順：

1. 最新のバックアップを特定
2. ステージング環境での復元テスト
3. 本番環境へのデータ復元
4. 静的ページの再生成
5. システム全体の健全性確認

## スケーリング戦略

### Firebase 無料枠の最適化

Firebase無料枠を最大限に活用するための戦略：

1. **読み取りの最適化**:
   - キャッシュの活用
   - バッチ読み取りの実装
   - クライアントサイドキャッシングの活用

2. **書き込みの最適化**:
   - バッチ処理の実装
   - 増分更新のみを実行（全件更新を避ける）
   - 不要なデータ同期を最小限に

3. **関数の最適化**:
   - コールドスタートの軽減
   - 適切なメモリ割り当て
   - 処理の効率化

### 大規模化への準備

トラフィック増加時の対応計画：

1. **静的生成の活用**:
   - 人気ページを事前生成
   - CDNキャッシュの最大活用

2. **データベース最適化**:
   - インデックスの適切な設計
   - クエリの最適化
   - シャーディング戦略の検討

3. **分析処理のバッチ化**:
   - 非同期処理の活用
   - 重い処理の分散実行

## トラブルシューティング

### 一般的な問題と解決策

#### Firebase Functions のデプロイ失敗

**問題**: `firebase deploy --only functions` コマンドが失敗する

**解決策**:
1. ローカル環境でエミュレータを使ってテスト
2. デプロイログを確認
3. 依存関係の競合がないか確認
4. Node.jsバージョンの互換性確認

```bash
# エミュレータでローカルテスト
firebase emulators:start --only functions
```

#### YouTube API クォータ超過

**問題**: YouTube API のクォータ制限に達した

**解決策**:
1. バックオフ戦略の実装
2. 優先度ベースの処理順序
3. 複数API キーのローテーション使用

```javascript
// キーローテーション実装例
const apiKeys = [
  process.env.YOUTUBE_API_KEY_1,
  process.env.YOUTUBE_API_KEY_2,
  // ...
];

let currentKeyIndex = 0;

const getNextApiKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
  return apiKeys[currentKeyIndex];
};
```

#### Vercel デプロイ後のルーティング問題

**問題**: 一部のページでルーティングエラーが発生

**解決策**:
1. `next.config.js` の設定確認
2. リライトルールの確認
3. 静的ファイルとダイナミックルートの競合確認

```javascript
// next.config.js
module.exports = {
  trailingSlash: false,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.yourdomain.com/:path*',
      },
    ];
  },
};
```

---

このガイドは継続的に更新されます。問題や改善提案がある場合は、Issueを作成してください。

最終更新日: 2025年4月2日