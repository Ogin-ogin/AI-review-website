const admin = require('firebase-admin');

// Firebase初期化
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

// 製品情報を取得する関数
async function fetchProductData(productId) {
  try {
    const productDoc = await db.collection('products').doc(productId).get();
    if (!productDoc.exists) {
      console.log(`No product found for ID: ${productId}`);
      return null;
    }
    return productDoc.data();
  } catch (error) {
    console.error(`Error fetching product data for ID ${productId}:`, error);
    return null;
  }
}

// 構造化データを生成する関数
function generateSchema(productData) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": productData.name,
    "description": productData.description,
    "image": productData.image || [],
    "brand": {
      "@type": "Brand",
      "name": productData.brand
    },
    "aggregateRating": productData.aggregateRating
      ? {
          "@type": "AggregateRating",
          "ratingValue": productData.aggregateRating.ratingValue,
          "reviewCount": productData.aggregateRating.reviewCount
        }
      : undefined,
    "offers": productData.offers
      ? {
          "@type": "Offer",
          "price": productData.offers.price,
          "priceCurrency": productData.offers.priceCurrency,
          "availability": productData.offers.availability,
          "url": productData.offers.url
        }
      : undefined
  };
}

// Firestoreに構造化データを保存する関数
async function saveSchemaToFirestore(productId, schema) {
  const productRef = db.collection('products').doc(productId);

  await productRef.update({
    schema,
    schemaUpdatedAt: new Date().toISOString()
  });

  console.log(`Saved schema for product ID: ${productId}`);
}

// メイン処理
async function generateProductSchema(productId) {
  console.log(`Generating schema for product ID: ${productId}`);
  const productData = await fetchProductData(productId);

  if (!productData) {
    console.log(`No product data available for schema generation (ID: ${productId})`);
    return;
  }

  const schema = generateSchema(productData);
  await saveSchemaToFirestore(productId, schema);
}

// エクスポート
module.exports = { generateProductSchema };