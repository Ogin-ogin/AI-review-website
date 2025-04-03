const admin = require('firebase-admin');
const express = require('express');
const app = express();

// Firebase初期化
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// JSONリクエストをパース
app.use(express.json());

// 製品一覧取得
app.get('/products', async (req, res) => {
  try {
    const snapshot = await db.collection('products').get();
    const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch products' });
  }
});

// 製品詳細取得
app.get('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await db.collection('products').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product' });
  }
});

// 製品追加
app.post('/products', async (req, res) => {
  const product = req.body;
  try {
    const docRef = await db.collection('products').add(product);
    res.status(201).json({ success: true, id: docRef.id });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ success: false, message: 'Failed to add product' });
  }
});

// 製品更新
app.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  try {
    await db.collection('products').doc(id).update(updates);
    res.status(200).json({ success: true, message: 'Product updated successfully' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ success: false, message: 'Failed to update product' });
  }
});

// 製品削除
app.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection('products').doc(id).delete();
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ success: false, message: 'Failed to delete product' });
  }
});

module.exports = app;