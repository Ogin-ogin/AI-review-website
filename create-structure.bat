@echo off
setlocal enabledelayedexpansion

:: プロジェクトルートディレクトリ作成
mkdir project-root
cd project-root

:: GitHub関連ディレクトリ
mkdir .github\ISSUE_TEMPLATE
mkdir .github\workflows

:: GitHub関連ファイル
type nul > .github\ISSUE_TEMPLATE\bug_report.md
type nul > .github\ISSUE_TEMPLATE\feature_request.md
type nul > .github\workflows\daily-update.yml
type nul > .github\workflows\deploy-functions.yml
type nul > .github\workflows\deploy-frontend.yml

:: フロントエンドディレクトリ
mkdir frontend\components\common
mkdir frontend\components\product
mkdir frontend\components\home
mkdir frontend\contexts
mkdir frontend\hooks
mkdir frontend\lib
mkdir frontend\locales\en
mkdir frontend\locales\ja
mkdir frontend\middleware
mkdir frontend\pages\api
mkdir frontend\pages\admin\products
mkdir frontend\pages\category
mkdir frontend\pages\compare
mkdir frontend\pages\product
mkdir frontend\public\images
mkdir frontend\styles

:: フロントエンドファイル
type nul > frontend\components\common\Button.js
type nul > frontend\components\common\Card.js
type nul > frontend\components\common\Footer.js
type nul > frontend\components\common\Header.js
type nul > frontend\components\common\Layout.js
type nul > frontend\components\common\Loading.js
type nul > frontend\components\common\Modal.js
type nul > frontend\components\common\SEO.js

type nul > frontend\components\product\ComparisonTable.js
type nul > frontend\components\product\PriceHistory.js
type nul > frontend\components\product\ProductCard.js
type nul > frontend\components\product\ProductDetails.js
type nul > frontend\components\product\ProductFilter.js
type nul > frontend\components\product\ProductGrid.js
type nul > frontend\components\product\ProductReviews.js
type nul > frontend\components\product\ReviewVideoCard.js

type nul > frontend\components\home\CategorySection.js
type nul > frontend\components\home\FeaturedProducts.js
type nul > frontend\components\home\HeroSection.js

type nul > frontend\contexts\FilterContext.js
type nul > frontend\contexts\ThemeContext.js

type nul > frontend\hooks\useFirestore.js
type nul > frontend\hooks\useLocalStorage.js
type nul > frontend\hooks\useProducts.js

type nul > frontend\lib\firebase.js
type nul > frontend\lib\formatters.js
type nul > frontend\lib\gtag.js
type nul > frontend\lib\schema.js

type nul > frontend\locales\en\common.json
type nul > frontend\locales\ja\common.json

type nul > frontend\middleware\auth.js

type nul > frontend\pages\_app.js
type nul > frontend\pages\_document.js
type nul > frontend\pages\api\revalidate.js
type nul > frontend\pages\api\sitemap.js
type nul > frontend\pages\admin\index.js
type nul > frontend\pages\admin\products\index.js
type nul > frontend\pages\admin\products\[id].js
type nul > frontend\pages\category\[id].js
type nul > frontend\pages\compare\[ids].js
type nul > frontend\pages\index.js
type nul > frontend\pages\privacy-policy.js
type nul > frontend\pages\product\[id].js
type nul > frontend\pages\terms.js

type nul > frontend\public\favicon.ico
type nul > frontend\public\robots.txt
type nul > frontend\public\sitemap.xml

type nul > frontend\styles\globals.css
type nul > frontend\styles\theme.js

type nul > frontend\.env.development
type nul > frontend\.env.local.example
type nul > frontend\.env.production
type nul > frontend\next.config.js
type nul > frontend\package.json
type nul > frontend\tailwind.config.js

:: Firebase Functions ディレクトリ
mkdir functions\api
mkdir functions\auth
mkdir functions\data-analysis\models
mkdir functions\data-collection
mkdir functions\content-generation
mkdir functions\scheduler
mkdir functions\utils

:: Firebase Functions ファイル
type nul > functions\api\products.js
type nul > functions\api\webhooks.js
type nul > functions\auth\admin.js
type nul > functions\data-analysis\contentAnalyzer.js
type nul > functions\data-analysis\sentiment.js
type nul > functions\data-analysis\transcriptExtractor.js
type nul > functions\data-analysis\models\sentimentModel.js
type nul > functions\data-analysis\models\topicModel.js
type nul > functions\data-collection\priceTracker.js
type nul > functions\data-collection\youtubeSearch.js
type nul > functions\content-generation\schemaGenerator.js
type nul > functions\content-generation\summarizer.js
type nul > functions\scheduler\daily.js
type nul > functions\scheduler\hourly.js
type nul > functions\utils\db.js
type nul > functions\utils\http.js
type nul > functions\utils\logger.js
type nul > functions\.env.example
type nul > functions\index.js
type nul > functions\package.json

:: AIモデル定義ディレクトリ
mkdir models\sentiment
mkdir models\topic

:: スクリプトディレクトリ
mkdir scripts
type nul > scripts\export-data.js
type nul > scripts\import-products.js
type nul > scripts\seed-database.js

:: テストディレクトリ
mkdir tests\e2e\cypress
mkdir tests\frontend\components
mkdir tests\functions\api

:: プロジェクトルートのファイル
type nul > .env.local
type nul > .firebaserc
type nul > .gitignore
type nul > CONTRIBUTING.md
type nul > firebase.json
type nul > firestore.indexes.json
type nul > firestore.rules
type nul > jest.config.js
type nul > LICENSE
type nul > package.json
type nul > README.md
type nul > vercel.json

echo ディレクトリ構造の作成が完了しました。