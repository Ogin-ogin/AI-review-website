import React from 'react';

export default function ComparisonTable({ products }) {
  return (
    <div className="comparison-table">
      <table>
        <thead>
          <tr>
            <th>項目</th>
            {products.map(product => (
              <th key={product.id}>{product.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* 画像 */}
          <tr>
            <td>画像</td>
            {products.map(product => (
              <td key={product.id}>
                <img
                  src={product.image || '/placeholder.png'}
                  alt={product.name}
                  style={{ maxWidth: '100px' }}
                />
              </td>
            ))}
          </tr>

          {/* ブランド */}
          <tr>
            <td>ブランド</td>
            {products.map(product => (
              <td key={product.id}>{product.brand || 'N/A'}</td>
            ))}
          </tr>

          {/* 評価 */}
          <tr>
            <td>評価</td>
            {products.map(product => (
              <td key={product.id}>
                {product.aggregateRating
                  ? `${product.aggregateRating.ratingValue} / 5 (${product.aggregateRating.reviewCount}件)`
                  : 'N/A'}
              </td>
            ))}
          </tr>

          {/* 価格 */}
          <tr>
            <td>価格</td>
            {products.map(product => (
              <td key={product.id}>
                {product.offers
                  ? `¥${product.offers.price} (${product.offers.priceCurrency})`
                  : 'N/A'}
              </td>
            ))}
          </tr>

          {/* 購入リンク */}
          <tr>
            <td>購入リンク</td>
            {products.map(product => (
              <td key={product.id}>
                {product.offers && product.offers.url ? (
                  <a href={product.offers.url} target="_blank" rel="noopener noreferrer">
                    購入する
                  </a>
                ) : (
                  'N/A'
                )}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}