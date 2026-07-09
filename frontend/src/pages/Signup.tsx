// Signup.tsx - create a regular user account
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import Spinner from '../components/Spinner';

export default function Signup(): React.ReactElement {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [err, setErr] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  function isEmailTaken(msg: string) {
    return /email|exists/i.test(msg || '');
  }
  function isUsernameTaken(msg: string) {
    return /username|exists/i.test(msg || '');
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await signup({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      nav('/', { replace: true });
    } catch (e2) {
      const ax = e2 as { response?: { data?: { error?: string } } };
      const msg = ax?.response?.data?.error || 'sign up failed';
      if (isEmailTaken(msg)) {
        setErr('that email is already in use. try logging in, or use a different email.');
      } else if (isUsernameTaken(msg)) {
        setErr('that username is taken. pick another.');
      } else {
        setErr(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="font-display text-3xl mb-1">create your kartz account</h1>
      <p className="text-kartz-mute mb-6 text-sm">
        buy art in rwf, and become an artist whenever you're ready.
      </p>
      <form onSubmit={submit} className="kz-card p-5 space-y-3">
        <div>
          <label className="kz-label">username</label>
          <input
            className="kz-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={30}
          />
        </div>
        <div>
          <label className="kz-label">email</label>
          <input
            className="kz-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="kz-label">password (min 6 chars)</label>
          <input
            className="kz-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>
        {err && (
          <div className="text-sm text-red-400">
            <p>{err}</p>
            {/already/i.test(err) && (
              <p className="mt-1 text-kartz-mute">
                already have an account?{' '}
                <Link to="/login" className="text-kartz-cyan hover:underline">
                  log in instead
                </Link>
              </p>
            )}
          </div>
        )}
        <button type="submit" disabled={loading} className="kz-btn w-full">
          {loading ? <Spinner size={16} /> : 'create account'}
        </button>
        <p className="text-sm text-kartz-mute text-center">
          have an account?{' '}
          <Link to="/login" className="text-kartz-cyan hover:underline">
            log in
          </Link>
        </p>
      </form>
    </div>
  );
}
