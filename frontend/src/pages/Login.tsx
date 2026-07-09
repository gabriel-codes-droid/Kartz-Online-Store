// Login.tsx - email/username + password
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import Spinner from '../components/Spinner';

export default function Login(): React.ReactElement {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [err, setErr] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await login(identifier.trim(), password);
      const next = params.get('next') || '/';
      nav(next, { replace: true });
    } catch (e2) {
      const ax = e2 as { response?: { data?: { error?: string } } };
      setErr(ax?.response?.data?.error || 'login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="font-display text-3xl mb-1">welcome back</h1>
      <p className="text-kartz-mute mb-6 text-sm">log in to keep browsing and buying.</p>
      <form onSubmit={submit} className="kz-card p-5 space-y-3">
        <div>
          <label className="kz-label">email or username</label>
          <input
            className="kz-input"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div>
          <label className="kz-label">password</label>
          <input
            className="kz-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button type="submit" disabled={loading} className="kz-btn w-full">
          {loading ? <Spinner size={16} /> : 'log in'}
        </button>
        <p className="text-sm text-kartz-mute text-center">
          no account?{' '}
          <Link to="/signup" className="text-kartz-cyan hover:underline">
            sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
