import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseApp } from '../../firebase';

export default async function handler(req, res) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const db = getFirestore(firebaseApp);
    const productsCollection = collection(db, 'products');
    const productsSnapshot = await getDocs(productsCollection);

    const productUrls = productsSnapshot.docs.map((doc) => {
      return `<url>
        <loc>${baseUrl}/products/${doc.id}</loc>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
      </url>`;
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
          <loc>${baseUrl}</loc>
          <changefreq>daily</changefreq>
          <priority>1.0</priority>
        </url>
        ${productUrls.join('\n')}
      </urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.status(200).send(sitemap);
  } catch (error) {
    res.status(500).json({ message: 'Error generating sitemap', error });
  }
}