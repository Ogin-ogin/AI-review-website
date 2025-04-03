import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ComparisonTable from '../../components/product/ComparisonTable';

export async function getServerSideProps(context) {
  const { ids } = context.params;

  // 製品IDを分割
  const productIds = ids.split(',');

  // Firestoreから製品データを取得
  const products = await Promise.all(
    productIds.map(async id => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products/${id}`);
      const product = await response.json();
      return product.success ? product.data : null;
    })
  );

  // 無効な製品が含まれている場合は404ページを表示
  if (products.includes(null)) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      products,
    },
  };
}

export default function ComparePage({ products }) {
  const router = useRouter();
  const { ids } = router.query;

  return (
    <>
      <Head>
        <title>製品比較 - {products.map(p => p.name).join(' vs ')}</title>
        <meta name="description" content="AI分析による製品比較ページ" />
      </Head>
      <main>
        <h1>製品比較</h1>
        <p>以下の製品を比較しています：</p>
        <ul>
          {products.map(product => (
            <li key={product.id}>{product.name}</li>
          ))}
        </ul>

        {/* 比較テーブル */}
        <ComparisonTable products={products} />
      </main>
    </>
  );
}