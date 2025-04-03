import React, { useState } from 'react';

const ProductFilter = ({ filters, onApplyFilters }) => {
  const [selectedFilters, setSelectedFilters] = useState({});

  const handleFilterChange = (filterKey, value) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterKey]: value,
    }));
  };

  const handleApplyFilters = () => {
    onApplyFilters(selectedFilters);
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-4">フィルター</h3>
      {filters.map((filter) => (
        <div key={filter.key} className="mb-4">
          <label className="block text-sm font-medium mb-2">{filter.label}</label>
          <select
            className="w-full p-2 border rounded"
            onChange={(e) => handleFilterChange(filter.key, e.target.value)}
          >
            <option value="">すべて</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        onClick={handleApplyFilters}
      >
        フィルターを適用
      </button>
    </div>
  );
};

export default ProductFilter;