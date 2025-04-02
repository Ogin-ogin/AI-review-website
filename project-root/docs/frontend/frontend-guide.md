# AIレビュー動画分析サイト - フロントエンド開発ガイド

## 目次

1. [概要](#概要)
2. [技術スタック](#技術スタック)
3. [プロジェクト構成](#プロジェクト構成)
4. [コンポーネント設計](#コンポーネント設計)
5. [状態管理](#状態管理)
6. [ルーティング設計](#ルーティング設計)
7. [スタイリング規約](#スタイリング規約)
8. [パフォーマンス最適化](#パフォーマンス最適化)
9. [国際化対応](#国際化対応)
10. [テスト戦略](#テスト戦略)
11. [デプロイフロー](#デプロイフロー)
12. [SEO対策](#seo対策)

## 概要

このドキュメントは、AIレビュー動画分析サイトのフロントエンド開発に関するガイドラインを提供します。フロントエンドは Next.js を使用し、静的サイト生成（SSG）を主体としたアーキテクチャで構築されています。このアプローチにより、高速なページ読み込み、SEO最適化、および Firebase の無料枠内でのリソース効率化を実現します。

### 開発目標

- **高速で応答性の高いUI**: ユーザー体験を最優先
- **SEO最適化された構造**: 検索エンジンからの流入を最大化
- **スケーラブルな設計**: 新カテゴリや機能の追加が容易
- **コスト効率**: 無料枠内でのリソース活用

## 技術スタック

- **フレームワーク**: Next.js 14.x
- **言語**: TypeScript 5.x
- **スタイリング**: Tailwind CSS 3.x
- **状態管理**: React Context API + SWR
- **UIコンポーネント**: 自作コンポーネント + Headless UI
- **フォーム**: React Hook Form
- **バリデーション**: Zod
- **テスト**: Jest + React Testing Library
- **E2Eテスト**: Cypress
- **国際化**: next-i18next
- **分析**: Google Analytics 4

## プロジェクト構成

```
frontend/
├── components/                   # UIコンポーネント
│   ├── common/                   # 共通コンポーネント
│   ├── product/                  # 製品関連コンポーネント
│   └── home/                     # ホームページコンポーネント
├── contexts/                     # Reactコンテキスト
├── hooks/                        # カスタムReactフック
├── lib/                          # ユーティリティ関数
├── locales/                      # 多言語対応ファイル
├── middleware/                   # ミドルウェア
├── pages/                        # ルーティング
├── public/                       # 静的アセット
└── styles/                       # スタイル
```

### ディレクトリ構造の原則

- **機能別モジュール化**: 関連するコンポーネントとロジックをグループ化
- **共通コンポーネントの分離**: 再利用可能なコンポーネントを明確に区分
- **ページとコンポーネントの分離**: Next.js のルーティング機能に合わせた構造

## コンポーネント設計

### コンポーネント階層

1. **ページコンポーネント**: `/pages` ディレクトリ内の各ページ
2. **レイアウトコンポーネント**: ページ構造を定義（Header, Footer, Layout）
3. **機能コンポーネント**: 特定の機能を提供（ProductGrid, FilterPanel）
4. **共通コンポーネント**: 再利用可能な UI 要素（Button, Card, Modal）

### コンポーネント設計原則

- **単一責任の原則**: 各コンポーネントは明確な単一の責任を持つ
- **プロップドリリングの最小化**: Context API を適切に活用
- **Container/Presentational パターン**: ロジックと表示の分離
- **Composition over Props**: 柔軟な構成のために子コンポーネントを使用

### コンポーネント例

```typescript
// components/product/ProductCard.tsx
import { FC } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/formatters';
import { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  showReviewCount?: boolean;
}

export const ProductCard: FC<ProductCardProps> = ({ 
  product, 
  showReviewCount = true 
}) => {
  return (
    <div className="rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg">
      <Link href={`/product/${product.id}`}>
        <a className="block">
          <div className="relative h-48">
            <Image 
              src={product.images[0] || '/images/placeholder.png'} 
              alt={product.name}
              layout="fill"
              objectFit="cover"
            />
          </div>
          <div className="p-4">
            <h3 className="font-medium text-gray-900">{product.name}</h3>
            <div className="mt-1 flex justify-between items-center">
              <p className="text-lg font-bold text-indigo-600">
                {formatPrice(product.prices[0]?.price)}
              </p>
              {showReviewCount && (
                <span className="text-sm text-gray-500">
                  {product.videos.length} レビュー
                </span>
              )}
            </div>
          </div>
        </a>
      </Link>
    </div>
  );
};
```

## 状態管理

### 状態管理戦略

フロントエンドの状態管理は、目的に応じて複数のアプローチを組み合わせます：

1. **ローカルコンポーネント状態**: コンポーネント固有の UI 状態（`useState`）
2. **グローバルアプリケーション状態**: Context API を使用
3. **サーバーデータ状態**: SWR を使用したデータフェッチングと管理
4. **URL 状態**: クエリパラメータを使用した状態の永続化

### Context API の使用例

```typescript
// contexts/FilterContext.tsx
import { createContext, useContext, useState, FC, ReactNode } from 'react';

interface FilterState {
  category: string | null;
  priceRange: [number, number] | null;
  rating: number | null;
  sortBy: 'popularity' | 'price_asc' | 'price_desc' | 'rating';
}

interface FilterContextType {
  filters: FilterState;
  setFilter: (key: keyof FilterState, value: any) => void;
  resetFilters: () => void;
}

const initialState: FilterState = {
  category: null,
  priceRange: null,
  rating: null,
  sortBy: 'popularity'
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(initialState);
  
  const setFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const resetFilters = () => {
    setFilters(initialState);
  };
  
  return (
    <FilterContext.Provider value={{ filters, setFilter, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
```

### SWR によるデータフェッチング

```typescript
// hooks/useProducts.ts
import useSWR from 'swr';
import { Product } from '@/types';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function useProducts(category?: string) {
  const url = category 
    ? `/api/products?category=${encodeURIComponent(category)}` 
    : '/api/products';
    
  const { data, error, isLoading } = useSWR<{ products: Product[] }>(
    url, 
    fetcher
  );
  
  return {
    products: data?.products || [],
    isLoading,
    isError: error
  };
}
```

### ローカルストレージを活用した状態永続化

```typescript
// hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    }
  }, [key, storedValue]);
  
  return [storedValue, setStoredValue] as const;
}
```

## ルーティング設計

Next.js のファイルベースのルーティングシステムを活用し、以下のルートを実装します：

### 主要ルート

- `/` - ホームページ
- `/category/[id]` - カテゴリページ
- `/product/[id]` - 製品詳細ページ
- `/compare/[ids]` - 製品比較ページ
- `/admin/*` - 管理者ページ（保護されたルート）

### ダイナミックルーティング戦略

- **SEO に最適化したスラッグ**: `[id]` の代わりに `[slug]` を使用する選択肢あり
- **複合パラメータ**: 複数の製品比較では `compare/product1-vs-product2-vs-product3` のような形式を使用

### API ルート

- `/api/products` - 製品リスト取得
- `/api/products/[id]` - 製品詳細取得
- `/api/revalidate` - ISR 再検証トリガー（管理者認証必須）
- `/api/sitemap` - 動的サイトマップ生成

### 管理者ルート保護

```typescript
// middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // /admin/* へのアクセスを保護
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (!session || session.role !== 'admin') {
      const url = new URL('/api/auth/signin', req.url);
      url.searchParams.set('callbackUrl', req.url);
      return NextResponse.redirect(url);
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*']
};
```

## スタイリング規約

### Tailwind CSS 設計原則

- **ユーティリティファースト**: 可能な限り Tailwind のユーティリティクラスを直接使用
- **コンポーネント抽出**: 繰り返し使用されるパターンには専用コンポーネントを作成
- **テーマ変数**: デザイントークンとして Tailwind のテーマ設定を活用

### テーマ設定

```typescript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          // ... 他の色調
          900: '#0c4a6e',
        },
        // 他のブランドカラー
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif']
      },
      borderRadius: {
        'card': '0.5rem'
      },
      // その他のカスタム設定
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio')
  ]
};
```

### コンポーネントクラス構造

```typescript
// components/common/Button.tsx
import { FC, ButtonHTMLAttributes } from 'react';
import classNames from 'classnames';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  const isDisabled = disabled || isLoading;
  
  return (
    <button
      className={classNames(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        isDisabled && 'opacity-60 cursor-not-allowed',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          処理中...
        </span>
      ) : children}
    </button>
  );
};
```

### モバイルファースト原則

- 常にモバイルファーストでデザイン、レスポンシブブレークポイントは拡大方向に設定
- Tailwind のブレークポイント: `sm`(640px)、`md`(768px)、`lg`(1024px)、`xl`(1280px)、`2xl`(1536px)

## パフォーマンス最適化

### 画像最適化

- Next.js の `Image` コンポーネントを使用
- 適切なサイズ、フォーマット（WebP/AVIF）、遅延読み込みの活用

```typescript
// components/product/ProductImage.tsx
import { FC } from 'react';
import Image from 'next/image';

interface ProductImageProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export const ProductImage: FC<ProductImageProps> = ({ src, alt, priority = false }) => {
  return (
    <div className="relative aspect-w-4 aspect-h-3">
      <Image
        src={src}
        alt={alt}
        layout="fill"
        objectFit="cover"
        className="rounded-md"
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      />
    </div>
  );
};
```

### コンポーネント分割と動的インポート

```typescript
// 大きなコンポーネントの動的読み込み
import dynamic from 'next/dynamic';

const ProductComparisonTable = dynamic(
  () => import('@/components/product/ComparisonTable'),
  { 
    loading: () => <p>比較表を読み込み中...</p>,
    ssr: false // クライアントサイドのみでレンダリング
  }
);
```

### バンドルサイズ最適化

- `next-bundle-analyzer` を使用したバンドル分析
- 大きな依存関係は動的インポート
- ツリーシェイキングを考慮したインポート

```javascript
// 良い例: 特定の関数のみをインポート
import { formatPrice } from '@/lib/formatters';

// 避けるべき例: モジュール全体をインポート
import * as formatters from '@/lib/formatters';
```

## 国際化対応

### next-i18next の設定

```typescript
// next-i18next.config.js
module.exports = {
  i18n: {
    defaultLocale: 'ja',
    locales: ['ja', 'en'],
    localePath: './locales'
  },
  reloadOnPrerender: process.env.NODE_ENV === 'development'
};
```

### 翻訳ファイルの構造

```
locales/
├── en/
│   ├── common.json
│   ├── product.json
│   └── home.json
└── ja/
    ├── common.json
    ├── product.json
    └── home.json
```

### 翻訳の使用方法

```typescript
// コンポーネントでの使用例
import { useTranslation } from 'next-i18next';

export const ProductDetails = ({ product }) => {
  const { t } = useTranslation('product');
  
  return (
    <div>
      <h1>{product.name}</h1>
      <div className="mt-4">
        <h2>{t('specs.title')}</h2>
        {/* ... */}
      </div>
    </div>
  );
};

// ページでのサーバーサイド設定
export const getStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'product'])),
      // その他のprops
    }
  };
};
```

## テスト戦略

### ユニットテスト (Jest + React Testing Library)

```typescript
// components/common/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button component', () => {
  test('renders button with text', () => {
    render(<Button>クリック</Button>);
    expect(screen.getByText('クリック')).toBeInTheDocument();
  });
  
  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>クリック</Button>);
    fireEvent.click(screen.getByText('クリック'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('shows loading state', () => {
    render(<Button isLoading>クリック</Button>);
    expect(screen.getByText('処理中...')).toBeInTheDocument();
  });
});
```

### インテグレーションテスト

```typescript
// tests/integration/productListing.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { ProductGrid } from '@/components/product/ProductGrid';
import { FilterProvider } from '@/contexts/FilterContext';
import { SWRConfig } from 'swr';

// APIレスポンスのモック
const mockProducts = [/* ... */];

// fetchのモック
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ products: mockProducts }),
  })
);

describe('Product listing with filters', () => {
  test('renders products and allows filtering', async () => {
    render(
      <SWRConfig value={{ dedupingInterval: 0 }}>
        <FilterProvider>
          <ProductGrid category="cameras" />
        </FilterProvider>
      </SWRConfig>
    );
    
    // 製品が表示されるのを待つ
    await waitFor(() => {
      expect(screen.getByText(mockProducts[0].name)).toBeInTheDocument();
    });
    
    // フィルタリングのテスト
    // ...
  });
});
```

### E2Eテスト (Cypress)

```javascript
// cypress/integration/product_page.spec.js
describe('Product Detail Page', () => {
  it('loads product details and related videos', () => {
    cy.visit('/product/sample-product-id');
    
    // 製品タイトルが表示されることを確認
    cy.get('h1').should('be.visible');
    
    // 製品画像が表示されることを確認
    cy.get('[data-testid="product-image"]').should('be.visible');
    
    // レビュー動画セクションが表示されることを確認
    cy.get('[data-testid="review-videos"]').should('be.visible');
    
    // 最初の動画をクリックしてモーダルが開くことをテスト
    cy.get('[data-testid="video-card"]').first().click();
    cy.get('[data-testid="video-modal"]').should('be.visible');
  });
});
```

## デプロイフロー

### Vercel へのデプロイ

- GitHub リポジトリとの連携
- ブランチベースのプレビューデプロイ
- 本番環境は `main` ブランチに連動

### 環境変数管理

```
# .env.development
NEXT_PUBLIC_API_URL=http://localhost:5001/your-project/us-central1
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"..."}

# .env.production
NEXT_PUBLIC_API_URL=https://us-central1-your-project.cloudfunctions.net
NEXT_PUBLIC_FIREBASE_CONFIG={"apiKey":"..."}
```

### GitHub Actions ワークフロー

```yaml
# .github/workflows/deploy-frontend.yml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - 'frontend/**'
      - '.github/workflows/deploy-frontend.yml'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install Dependencies
        run: cd frontend && npm ci
      
      - name: Run Tests
        run: cd frontend && npm test
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./frontend
          vercel-args: '--prod'
```

## SEO対策

### メタデータ最適化

```typescript
// components/common/SEO.tsx
import { FC } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
}

export const SEO: FC<SEOProps> = ({
  title,
  description,
  image,
  article
}) => {
  const router = useRouter();
  const siteTitle = 'AIレビュー動画分析サイト';
  const defaultDescription = '製品のレビュー動画をAIが分析し、客観的な評価を提供します。';
  const defaultImage = 'https://yourdomain.com/images/og-image.png';
  
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const canURL = `https://yourdomain.com${router.asPath}`;
  
  return (
    <Head>
      <title key="title">{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} key="description" />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} key="og:title" />
      <meta property="og:description" content={description || defaultDescription} key="og:description" />
      <meta property="og:url" content={canURL} key="og:url" />
      <meta property="og:image" content={image || defaultImage} key="og:image" />
      <meta property="og:type" content={article ? 'article' : 'website'} key="og:type" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" key="twitter:card" />
      <meta name="twitter:title" content={fullTitle} key="twitter:title" />
      <meta name="twitter:description" content={description || defaultDescription} key="twitter:description" />
      <meta name="twitter:image" content={image || defaultImage} key="twitter:image" />
      
      <link rel="canonical" href={canURL} key="canonical" />
    </Head>
  );
};
```

### 構造化データ (JSON-LD)

```typescript
// lib/schema.js
export const generateProductSchema = (product) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.summary.text,
    brand: {
      '@type': 'Brand',
      name: product.brand
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: product.summary.score,
      reviewCount: product.videos.length
    },
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'JPY',
      lowPrice: Math.min(...product.prices.map(p => p.price)),
      highPrice: Math.max(...product.prices.map(p => p.price)),
      offerCount: product.prices.length,
      offers: product.prices.map(price => ({
        '@type': 'Offer',
        price: price.price,
        priceCurrency: price.currency,
        availability: 'https://schema.org/InStock',
        url: price.url,
        seller: {
          '@type': 'Organization',
          name: price.store
        }
      }))
    }
  };
};
```

### サイトマップ生成

```typescript
// pages/api/sitemap.js
import { getAllProducts, getAllCategories } from '@/lib/db';

const generateSiteMap = (products, categories) => {
  return `<?xml version="1.0" encoding="UTF-8"?>
   <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
     <url>
       <loc>https://yourdomain.com</loc>
     </url>
     ${categories
       .map(category => {
         return `
       <url>
         <loc>https://yourdomain.com/category/${category.id}</loc>
       </url>
     `;
       })
       .join('')}
     ${products
       .map(product => {
         return `
       <url>
         <loc>https://yourdomain.com/product/${product.id}</loc>
         <lastmod>${new Date(product.lastUpdated).toISOString()}</lastmod>
       </url>
     `;
       })
       .join('')}
   </urlset>
 `;
};

export default async function handler(req, res) {
  // ファイアストアから全製品とカテゴリを取得
  const products = await getAllProducts();
  const categories = await getAllCategories();
  
  // XML形式のサイトマップを生成