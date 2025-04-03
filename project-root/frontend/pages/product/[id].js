import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProductDetails from '../../components/product/ProductDetails';
import VideoList from '../../components/product/VideoList';
import PriceHistory from '../../components/product/PriceHistory';

export async function getServerSideProps(context) {
  const { id } = context.params;

  // Firestoreから製品データを取得
  const productResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`);
  const product = await productResponse.json();

  if (!product.success) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      product: product.data,
    },
  };
}

export default function ProductPage({ product }) {
  const router = useRouter();
  const { id } = router.query;

  return (
    <>
      <Head>
        <title>{product.name} - 製品詳細</title>
        <meta name="description" content={`AI分析による${product.name}の詳細情報`} />
      </Head>
      <main>
        {/* 製品詳細セクション */}
        <ProductDetails product={product} />

        {/* 関連動画セクション */}
        <section>
          <h2>関連動画</h2>
          <VideoList videos={product.videos || []} />
        </section>

        {/* 価格履歴セクション */}
        <section>
          <h2>価格履歴</h2>
          <PriceHistory prices={product.prices || []} />
        </section>
      </main>
    </>
  );
}