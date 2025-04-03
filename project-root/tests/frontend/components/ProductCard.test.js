import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductCard from '../../../frontend/components/product/ProductCard';

describe('ProductCard Component', () => {
  const mockProduct = {
    id: '1',
    name: 'Test Product',
    description: 'This is a test product.',
    image: '/test-image.jpg',
    aggregateRating: {
      ratingValue: 4.5,
      reviewCount: 10,
    },
    offers: {
      price: 1000,
      priceCurrency: 'JPY',
    },
  };

  test('renders product name and description', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('This is a test product.')).toBeInTheDocument();
  });

  test('renders product image', () => {
    render(<ProductCard product={mockProduct} />);

    const image = screen.getByAltText('Test Product');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  test('renders product rating', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('評価: 4.5 / 5')).toBeInTheDocument();
    expect(screen.getByText('(10件のレビュー)')).toBeInTheDocument();
  });

  test('renders product price', () => {
    render(<ProductCard product={mockProduct} />);

    expect(screen.getByText('価格: ¥1000')).toBeInTheDocument();
  });

  test('renders link to product details page', () => {
    render(<ProductCard product={mockProduct} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/product/1');
  });
});