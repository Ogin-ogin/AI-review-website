const request = require('supertest');
const app = require('../../../functions/api/products');
const admin = require('firebase-admin');

// Firebaseモックの初期化
jest.mock('firebase-admin', () => {
  const firestoreMock = {
    collection: jest.fn().mockReturnThis(),
    doc: jest.fn().mockReturnThis(),
    get: jest.fn(),
    set: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    add: jest.fn(),
  };
  return {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => firestoreMock),
  };
});

describe('Products API', () => {
  let firestoreMock;

  beforeEach(() => {
    firestoreMock = admin.firestore();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('GET /products - 製品一覧を取得', async () => {
    firestoreMock.collection().get.mockResolvedValue({
      docs: [
        { id: '1', data: () => ({ name: 'Product 1', description: 'Description 1' }) },
        { id: '2', data: () => ({ name: 'Product 2', description: 'Description 2' }) },
      ],
    });

    const response = await request(app).get('/products');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[0].name).toBe('Product 1');
  });

  test('GET /products/:id - 製品詳細を取得', async () => {
    firestoreMock.collection().doc().get.mockResolvedValue({
      exists: true,
      id: '1',
      data: () => ({ name: 'Product 1', description: 'Description 1' }),
    });

    const response = await request(app).get('/products/1');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Product 1');
  });

  test('POST /products - 製品を追加', async () => {
    firestoreMock.collection().add.mockResolvedValue({ id: '3' });

    const newProduct = { name: 'Product 3', description: 'Description 3' };
    const response = await request(app).post('/products').send(newProduct);

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.id).toBe('3');
  });

  test('PUT /products/:id - 製品を更新', async () => {
    firestoreMock.collection().doc().update.mockResolvedValue();

    const updates = { name: 'Updated Product 1' };
    const response = await request(app).put('/products/1').send(updates);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Product updated successfully');
  });

  test('DELETE /products/:id - 製品を削除', async () => {
    firestoreMock.collection().doc().delete.mockResolvedValue();

    const response = await request(app).delete('/products/1');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Product deleted successfully');
  });
});