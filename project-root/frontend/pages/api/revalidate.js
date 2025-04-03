export default async function handler(req, res) {
    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  
    const secret = req.query.secret;
  
    if (secret !== process.env.REVALIDATE_SECRET) {
      return res.status(401).json({ message: 'Invalid secret token' });
    }
  
    try {
      const { path } = req.body;
  
      if (!path) {
        return res.status(400).json({ message: 'Path is required' });
      }
  
      await res.revalidate(path);
      return res.json({ message: `Revalidated ${path}` });
    } catch (error) {
      return res.status(500).json({ message: 'Error revalidating', error });
    }
  }