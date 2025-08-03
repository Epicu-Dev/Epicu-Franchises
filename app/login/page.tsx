// /app/login/page.tsx
'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('Chargement...');

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage(`Connexion réussie ! Bienvenue ${data.user.email}`);
    } else {
      setMessage(data.message || 'Erreur inconnue');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', padding: 20, border: '1px solid #ccc', borderRadius: 8 }}>
      <h1>Connexion</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email :</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 12 }}
          />
        </div>
        <div>
          <label>Mot de passe :</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8, marginTop: 4, marginBottom: 12 }}
          />
        </div>
        <button type="submit" style={{ padding: '8px 16px' }}>Se connecter</button>
      </form>
      {message && <p style={{ marginTop: 20 }}>{message}</p>}
    </div>
  );
}
