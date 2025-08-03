'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isRefreshTokenValid } from '@/utils/auth';

export default function HomePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userEmail = localStorage.getItem('userEmail');

    if (!accessToken || !isRefreshTokenValid()) {
      router.push('/login');
    } else {
      setEmail(userEmail);
    }
  }, [router]);

  const handleLogout = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, refreshToken }),
    });

    localStorage.clear();
    router.push('/login');
  };

  return (
    <div style={{ maxWidth: 600, margin: '50px auto', padding: 20 }}>
      <h1>Bienvenue sur la page d’accueil</h1>
      {email && <p>Connecté en tant que : <strong>{email}</strong></p>}
      <p>Ceci est une page sécurisée visible après connexion.</p>
      <button onClick={handleLogout} style={{ marginTop: 20, padding: '8px 16px' }}>
        Se déconnecter
      </button>
    </div>
  );
}
