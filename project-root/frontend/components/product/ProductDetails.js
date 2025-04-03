import React from 'react';

export default function ProductDetails({ product }) {
  return (
    <div className="product-details">
      {/* 製品画像 */}
      <div className="product-image">
        <img src={product.image || '/placeholder.png'} alt={product.name} />
      </div>

      {/* 製品情報 */}
      <div className="product-info">
        <h1>{product.name}</h1>
        <p>{product.description}</p>

        {/* ブランド情報 */}
        {product.brand && (
          <div className="brand">
            <strong>ブランド:</strong> {product.brand}
          </div>
        )}

        {/* 評価情報 */}
        {product.aggregateRating && (
          <div className="rating">
            <strong>評価:</strong> {product.aggregateRating.ratingValue} / 5
            <span> ({product.aggregateRating.reviewCount}件のレビュー)</span>
          </div>
        )}

        {/* 価格情報 */}
        {product.offers && (
          <div className="price">
            <strong>価格:</strong> ¥{product.offers.price} ({product.offers.priceCurrency})
          </div>
        )}

        {/* 購入リンク */}
        {product.offers && product.offers.url && (
          <div className="buy-link">
            <a href={product.offers.url} target="_blank" rel="noopener noreferrer">
              購入する
            </a>
          </div>
        )}
      </div>
    </div>
  );
}