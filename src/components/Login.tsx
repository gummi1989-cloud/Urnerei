import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

// Feste interne Kennung für das Team
const SHARED_EMAIL = 'team@urnenwerkstatt.local';

export const Login: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, SHARED_EMAIL, password);
    } catch (err: any) {
      console.error(err);
      setError('Falsches Passwort. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <div className="max-w-sm w-full bg-white rounded-xl shadow-lg p-8 border border-stone-200">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-stone-800">Urnen-Produktionsplaner</h1>
          <p className="text-stone-500 text-sm mt-1">Passwort eingeben</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              required
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-stone-300 rounded-lg text-center tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg transition-colors shadow disabled:opacity-50"
          >
            {loading ? 'Wird geprüft...' : 'Freischalten'}
          </button>
        </form>
      </div>
    </div>
  );
};