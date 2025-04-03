import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="ja">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="AIレビュー動画分析サイト" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}