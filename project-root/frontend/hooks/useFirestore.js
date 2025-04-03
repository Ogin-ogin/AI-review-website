import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import { firebaseApp } from '../firebase';

const useFirestore = (collectionName, filters = []) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const db = getFirestore(firebaseApp);
        let ref = collection(db, collectionName);

        if (filters.length > 0) {
          const q = query(ref, ...filters.map((filter) => where(...filter)));
          ref = q;
        }

        const snapshot = await getDocs(ref);
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setData(docs);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collectionName, filters]);

  return { data, loading, error };
};

export default useFirestore;