import React from 'react';
import Head from 'next/head';
import HeroSection from '../components/home/HeroSection';
import CategorySection from '../components/home/CategorySection';
import FeaturedProducts from '../components/home/FeaturedProducts';

export default function HomePage() {
  return (
    <>
      <Head>
        <title>AIレビュー動画分析サイト</title>
        <meta name="description" content="AIを活用して製品レビュー動画を分析し、最適な製品選びをサポートします。" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <main>
        {/* ヒーローセクション */}
        <HeroSection />

        {/* カテゴリセクション */}
        <CategorySection />

        {/* 注目製品セクション */}
        <FeaturedProducts />
      </main>
    </>
  );
}