import React from 'react';

const CategorySection = ({ categories, onSelectCategory }) => {
  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold mb-4">カテゴリ一覧</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((category) => (
          <button
            key={category.id}
            className="bg-gray-100 p-4 rounded-lg shadow hover:bg-gray-200"
            onClick={() => onSelectCategory(category.id)}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategorySection;