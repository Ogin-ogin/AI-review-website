export const productSchema = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number' },
      image: { type: 'string' },
      category: { type: 'string' },
      stock: { type: 'number' },
    },
    required: ['id', 'name', 'price', 'image', 'category'],
  };
  
  export const reviewSchema = {
    type: 'object',
    properties: {
      id: { type: 'string' },
      productId: { type: 'string' },
      title: { type: 'string' },
      content: { type: 'string' },
      rating: { type: 'number', minimum: 1, maximum: 5 },
      date: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'productId', 'title', 'rating', 'date'],
  };