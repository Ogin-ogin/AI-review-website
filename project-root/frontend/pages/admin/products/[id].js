import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firebaseApp } from '../../../firebase';

const ProductDetails = () => {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        const db = getFirestore(firebaseApp);
        const productRef = doc(db, 'products', id);
        const productSnap = await getDoc(productRef);

        if (productSnap.exists()) {
          setProduct({ id: productSnap.id, ...productSnap.data() });
        } else {
          console.error('Product not found');
        }
        setLoading(false);
      };

      fetchProduct();
    }
  }, [id]);

  const handleUpdate = async () => {
    const db = getFirestore(firebaseApp);
    const productRef = doc(db, 'products', id);

    try {
      await updateDoc(productRef, product);
      alert('Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
      {product && (
        <div>
          <label className="block mb-2">
            Name:
            <input
              type="text"
              value={product.name}
              onChange={(e) => setProduct({ ...product, name: e.target.value })}
              className="block w-full p-2 border rounded"
            />
          </label>
          <label className="block mb-2">
            Price:
            <input
              type="number"
              value={product.price}
              onChange={(e) => setProduct({ ...product, price: e.target.value })}
              className="block w-full p-2 border rounded"
            />
          </label>
          <button
            onClick={handleUpdate}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Update Product
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;