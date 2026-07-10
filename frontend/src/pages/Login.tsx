// Login.tsx - email/username + password
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth';
import Spinner from '../components/Spinner';
import { Eye, EyeOff } from 'lucide-react';

export default function Login(): React.ReactElement {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
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
          <div className="relative">
            <input
              className="kz-input pr-10"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-kartz-mute hover:text-kartz-cyan transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
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
