import React from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import ProductCard from '../../components/product/ProductCard';

export async function getServerSideProps(context) {
  const { id } = context.params;

  // Firestoreからカテゴリデータを取得
  const categoryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories/${id}`);
  const category = await categoryResponse.json();

  if (!category.success) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      category: category.data,
    },
  };
}

export default function CategoryPage({ category }) {
  const router = useRouter();
  const { id } = router.query;

  return (
    <>
      <Head>
        <title>{category.name} - カテゴリ詳細</title>
        <meta name="description" content={`AI分析による${category.name}カテゴリの製品一覧`} />
      </Head>
      <main>
        <h1>{category.name}</h1>
        <p>{category.description}</p>

        {/* 製品一覧 */}
        <section>
          <h2>製品一覧</h2>
          <div className="product-grid">
            {category.products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}