AIレビュー動画分析サイト - フロントエンド開発ガイド
目的
このガイドは、AIレビュー動画分析サイトのフロントエンド開発に関する標準と規約を定義し、開発チームが一貫性のあるユーザーインターフェースを構築するための指針を提供します。
目次

アーキテクチャ概要
コンポーネント構成と責務
状態管理戦略
ルーティング設計
スタイリング規約
パフォーマンス最適化
多言語対応
テスト戦略
開発ワークフロー

アーキテクチャ概要
AIレビュー動画分析サイトのフロントエンドは、Next.js をベースとしたモダンな React アプリケーションとして構築されています。

フレームワーク: Next.js（静的生成重視）
静的生成: 可能な限り SSG (Static Site Generation) を活用
デプロイ: Vercel（無料枠を最大活用）
スタイリング: Tailwind CSS + カスタムテーマ
データフェッチ: SWR を使用した効率的な取得と更新

コンポーネント構成と責務
コンポーネント階層
フロントエンドのコンポーネントは以下の階層に分類されます：

ページコンポーネント (/pages ディレクトリ) - ルーティングとレイアウト管理
テンプレートコンポーネント - 複数ページで再利用される構造
機能コンポーネント - 製品リスト、比較表などの機能的なUI要素
共通コンポーネント - ボタン、カードなどの基本UI要素

責務の分離
各コンポーネントの責務を明確に分離します：

ページコンポーネント: データ取得とレイアウト構成のみを担当
テンプレートコンポーネント: 構造とレイアウトのみを提供
機能コンポーネント: ビジネスロジックとデータ処理を実装
共通コンポーネント: プレゼンテーションのみに集中、状態を持たない

コンポーネント設計原則

単一責任の原則: 各コンポーネントは明確な役割を持つ
コンポジション優先: 継承より構成を活用
プロップドリルを回避: Context API や Custom Hooks で状態管理
最小限の依存関係: 外部依存を最小限に抑える

状態管理戦略
ローカル状態

単一コンポーネント内の状態には useState を使用
複雑な状態遷移には useReducer を使用

グローバル状態

テーマ、フィルター、UIモードなどのアプリケーション全体の状態は Context API で管理
主要なコンテキスト:

ThemeContext - ダークモード/ライトモード管理
FilterContext - 製品フィルタリング状態管理
CompareContext - 比較対象製品管理



リモートデータ状態

SWR を使用してFirestore データのフェッチと同期
カスタムフックによるデータアクセス抽象化:

useProducts - 製品データの取得と操作
useCategory - カテゴリデータの取得と操作
useComparisons - 比較機能の状態管理



状態管理パターン
javascriptコピー// FilterContextの例
import { createContext, useContext, useReducer } from 'react';

const FilterContext = createContext();

const filterReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CATEGORY':
      return { ...state, category: action.payload };
    case 'SET_PRICE_RANGE':
      return { ...state, priceRange: action.payload };
    case 'RESET_FILTERS':
      return { ...initialState };
    default:
      return state;
  }
};

const initialState = {
  category: 'all',
  priceRange: [0, 100000],
  sortBy: 'relevance',
  ratings: 0,
};

export const FilterProvider = ({ children }) => {
  const [state, dispatch] = useReducer(filterReducer, initialState);
  
  return (
    <FilterContext.Provider value={{ state, dispatch }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => useContext(FilterContext);
ルーティング設計
ページ構造

/ - ホームページ
/category/[id] - カテゴリ別製品一覧
/product/[id] - 製品詳細ページ
/compare/[ids] - 製品比較ページ
/admin/... - 管理機能（認証保護）
/privacy-policy - プライバシーポリシー
/terms - 利用規約

動的ルーティング
Next.js の動的ルートとgetStaticProps/getStaticPaths を使用して、ビルド時に静的ページを生成します：
javascriptコピー// /pages/product/[id].js
export async function getStaticPaths() {
  const products = await fetchAllProductIds();
  
  return {
    paths: products.map(product => ({ params: { id: product.id } })),
    fallback: 'blocking' // 新製品の場合はサーバーで生成
  };
}

export async function getStaticProps({ params }) {
  const product = await fetchProductDetails(params.id);
  
  return {
    props: { product },
    revalidate: 86400, // 24時間ごとに再検証
  };
}
プログラマティックナビゲーション
javascriptコピーimport { useRouter } from 'next/router';

const ProductCard = ({ product }) => {
  const router = useRouter();
  
  const handleClick = () => {
    router.push(`/product/${product.id}`);
  };
  
  return <div onClick={handleClick}>...</div>;
};
スタイリング規約
Tailwind CSS 活用

Tailwind CSS をベースにしたユーティリティファースト設計
カスタムテーマによるブランドカラーの統一
メディアクエリはTailwindのブレークポイントに準拠

テーマ設計
javascriptコピー// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ...以下略
        },
        secondary: {
          // ...カラーバリエーション
        },
        // その他のブランドカラー
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'sans-serif'],
        heading: ['Montserrat', 'sans-serif'],
      },
      // その他のカスタム設定
    },
  },
  // ...その他の設定
};
コンポーネントスタイリング
共通コンポーネントはTailwindを使用し、再利用可能なスタイルを定義：
javascriptコピー// components/common/Button.js
const Button = ({ children, variant = 'primary', size = 'md', ...props }) => {
  const baseClasses = 'rounded font-medium transition-colors focus:outline-none focus:ring-2';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-primary-500',
  };
  
  const sizes = {
    sm: 'py-1 px-3 text-sm',
    md: 'py-2 px-4 text-base',
    lg: 'py-3 px-6 text-lg',
  };
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]}`;
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
パフォーマンス最適化
画像最適化

Next.js の Image コンポーネントを使用した自動最適化
レスポンシブ画像とLazy Loading の実装

javascriptコピーimport Image from 'next/image';

const ProductImage = ({ product }) => {
  return (
    <div className="relative w-full aspect-square">
      <Image
        src={product.imageUrl}
        alt={product.name}
        layout="fill"
        objectFit="cover"
        priority={false}
        placeholder="blur"
        blurDataURL="data:image/png;base64,..."
      />
    </div>
  );
};
コード分割とバンドル最適化

動的インポートによるコンポーネントの遅延ロード
大きなライブラリの選択的インポート

javascriptコピーimport dynamic from 'next/dynamic';

// 大きな比較テーブルコンポーネントを遅延ロード
const ComparisonTable = dynamic(
  () => import('../components/product/ComparisonTable'),
  { loading: () => <p>Loading comparison table...</p> }
);
データフェッチの最適化

SWR を使用したキャッシュと再検証
適切なキャッシュ制御ヘッダー設定

javascriptコピーimport useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

function useProductData(productId) {
  const { data, error } = useSWR(`/api/products/${productId}`, fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    revalidateOnReconnect: false,
    refreshWhenOffline: false,
    refreshWhenHidden: false,
    refreshInterval: 0,
  });

  return {
    product: data,
    isLoading: !error && !data,
    isError: error,
  };
}
多言語対応
next-i18next の活用

日本語と英語の両方に対応
翻訳ファイルはJSON形式で管理

javascriptコピー// /locales/ja/common.json
{
  "nav": {
    "home": "ホーム",
    "categories": "カテゴリ",
    "compare": "比較",
    "search": "検索"
  },
  // 他の翻訳キー
}
翻訳の使用法
javascriptコピーimport { useTranslation } from 'next-i18next';

const Header = () => {
  const { t } = useTranslation('common');
  
  return (
    <nav>
      <ul>
        <li>{t('nav.home')}</li>
        <li>{t('nav.categories')}</li>
        <li>{t('nav.compare')}</li>
        <li>{t('nav.search')}</li>
      </ul>
    </nav>
  );
};
テスト戦略
単体テスト

Jest と React Testing Library を使用
コンポーネントの機能とレンダリングをテスト

javascriptコピー// components/common/Button.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button component', () => {
  test('renders with children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  test('calls onClick handler when clicked', () => {
    const mockOnClick = jest.fn();
    render(<Button onClick={mockOnClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });
  
  // その他のテスト
});
E2Eテスト

Cypress を使用した重要ユーザーフローのテスト
主要なユーザーストーリーをカバー

javascriptコピー// cypress/integration/product_details.spec.js
describe('Product details page', () => {
  beforeEach(() => {
    cy.visit('/product/sample-product-1');
  });
  
  it('displays product details', () => {
    cy.get('h1').should('contain', 'Sample Product 1');
    cy.get('[data-testid="product-price"]').should('exist');
    cy.get('[data-testid="product-specs"]').should('exist');
  });
  
  it('allows adding product to comparison', () => {
    cy.get('[data-testid="compare-button"]').click();
    cy.get('[data-testid="comparison-badge"]').should('contain', '1');
  });
  
  // その他のテスト
});
開発ワークフロー
開発環境セットアップ
bashコピー# リポジトリのクローン
git clone https://github.com/your-org/ai-review-website.git

# 依存関係のインストール
cd ai-review-website/frontend
npm install

# 開発サーバー起動
npm run dev
コーディング規約

ESLint と Prettier を使用した一貫したコーディングスタイル
命名規則:

コンポーネント: PascalCase (例: ProductCard.js)
フック: camelCase with use prefix (例: useProductData.js)
ユーティリティ関数: camelCase (例: formatPrice.js)



ブランチ戦略とデプロイフロー

main - 本番環境（自動デプロイ）
development - ステージング環境（自動デプロイ）
機能ブランチ - feature/feature-name

bashコピー# 新機能のブランチ作成
git checkout -b feature/product-comparison

# 変更をコミット
git add .
git commit -m "Add product comparison functionality"

# 開発ブランチにプッシュ
git push origin feature/product-comparison

# プルリクエスト作成後、マージされるとCIパイプラインが自動実行
開発リソース

コンポーネントライブラリ: Storybook で管理
APIドキュメント: Swagger UI で管理
デザインシステム: Figma で共有