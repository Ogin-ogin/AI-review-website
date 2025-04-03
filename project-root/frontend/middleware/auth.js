import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const useAuth = () => {
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push('/login'); // ログインページにリダイレクト
      }
    });

    return () => unsubscribe();
  }, [auth, router]);
};

export default useAuth;