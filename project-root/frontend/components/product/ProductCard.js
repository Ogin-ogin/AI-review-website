import React from 'react';
import Link from 'next/link';

export default function ProductCard({ product }) {
  return (
    <div className="product-card">
      <Link href={`/product/${product.id}`}>
        <a>
          <div className="product-image">
            <img src={product.image || '/placeholder.png'} alt={product.name} />
          </div>
          <div className="product-info">
            <h3>{product.name}</h3>
            <p>{product.description}</p>
            {product.aggregateRating && (
              <div className="rating">
                <span>評価: {product.aggregateRating.ratingValue} / 5</span>
                <span>({product.aggregateRating.reviewCount}件のレビュー)</span>
              </div>
            )}
            {product.offers && (
              <div className="price">
                <span>価格: ¥{product.offers.price}</span>
              </div>
            )}
          </div>
        </a>
      </Link>
    </div>
  );
}