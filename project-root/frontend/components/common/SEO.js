import Head from 'next/head';
import React from 'react';

const SEO = ({ title, description }) => {
  return (
    <Head>
      <title>{title ? `${title} | AIレビュー動画分析サイト` : 'AIレビュー動画分析サイト'}</title>
      <meta name="description" content={description || 'AIレビュー動画分析サイトの公式ページです。'} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charSet="UTF-8" />
    </Head>
  );
};

export default SEO;