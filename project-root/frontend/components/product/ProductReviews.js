import React from 'react';

const ProductReviews = ({ reviews }) => {
  return (
    <div className="bg-gray-100 p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">レビュー一覧</h3>
      {reviews.length > 0 ? (
        <ul className="space-y-4">
          {reviews.map((review) => (
            <li key={review.id} className="border-b pb-4">
              <p className="text-sm text-gray-600">{review.date}</p>
              <p className="text-lg font-semibold">{review.title}</p>
              <p className="text-gray-700">{review.content}</p>
              <p className="text-sm text-gray-500">評価: {review.rating} / 5</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">レビューがまだありません。</p>
      )}
    </div>
  );
};

export default ProductReviews;