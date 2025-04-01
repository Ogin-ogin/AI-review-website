// frontend/pages/index.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';

// コンポーネントのインポート
import Layout from '../components/Layout';
import ProductCard from '../components/ProductCard';
import CategorySection from '../components/CategorySection';
import TrendingProducts from '../components/TrendingProducts';
import SearchBar from '../components/SearchBar';

export default function Home({ initialCategories, trendingProducts }) {
  const [categories, setCategories] = useState(initialCategories);
  const [featuredProducts, setFeaturedProducts] = useState(trendingProducts);
  const [loading, setLoading] = useState(false);

  // 検索機能
  const handleSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const productsRef = collection(db, 'products');
      const q = query(
        productsRef,
        where('name', '>=', searchTerm),
        where('name', '<=', searchTerm + '\uf8ff'),
        limit(10)
      );
      
      const snapshot = await getDocs(q);
      const searchResults = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // 検索結果ページに遷移または検索結果を表示
      console.log(searchResults);
      // 実際の実装ではここで検索結果ページに遷移する
    } catch (error) {
      console.error('検索エラー:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Head>
        <title>AIレビュー分析 | 動画レビューをAIが総合評価</title>
        <meta name="description" content="YouTubeのレビュー動画をAIが分析し、製品の良い点・悪い点を客観的に評価。最新の評判や口コミをまとめて確認できます。" />
        <meta name="keywords" content="製品レビュー,AI分析,YouTube,口コミ,比較" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="hero-section">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            動画レビューをAIが総合評価
          </h1>
          <p className="text-xl mb-8">
            複数のYouTubeレビュー動画をAIが分析し、製品の真価を客観的に評価します
          </p>
          <SearchBar onSearch={handleSearch} isLoading={loading} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* トレンド製品セクション */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-6">注目の製品</h2>
          <TrendingProducts products={featuredProducts} />
        </section>

        {/* カテゴリーセクション */}
        {categories.map((category) => (
          <CategorySection 
            key={category.id} 
            category={category} 
          />
        ))}
        
        {/* サイト説明セクション */}
        <section className="mt-16 bg-gray-50 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">AIレビュー分析について</h2>
          <p className="mb-4">
            当サイトは、YouTubeに投稿されている製品レビュー動画を独自のAIが分析し、
            その内容を客観的に評価・まとめたものです。複数のレビュワーの意見を
            統合することで、より公平で正確な製品評価を提供しています。
          </p>
          <p>
            各製品ページでは、メリット・デメリットの要約、適合するユーザー層、
            価格推移などの情報を確認できます。また、複数製品の比較機能も
            ご利用いただけます。
          </p>
        </section>
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  try {
    // カテゴリーデータの取得
    const categoriesRef = collection(db, 'categories');
    const categorySnapshot = await getDocs(categoriesRef);
    const categories = categorySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // トレンド製品の取得
    const productsRef = collection(db, 'products');
    const trendingQuery = query(
      productsRef,
      where('trending', '==', true),
      orderBy('rank'),
      limit(6)
    );
    const trendingSnapshot = await getDocs(trendingQuery);
    const trendingProducts = trendingSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return {
      props: {
        initialCategories: categories,
        trendingProducts: trendingProducts
      },
      // 24時間ごとに再生成
      revalidate: 86400
    };
  } catch (error) {
    console.error('データ取得エラー:', error);
    return {
      props: {
        initialCategories: [],
        trendingProducts: []
      },
      revalidate: 3600
    };
  }
}