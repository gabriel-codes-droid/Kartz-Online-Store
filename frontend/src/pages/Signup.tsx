// Signup.tsx - create a regular user account
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import Spinner from '../components/Spinner';
import { Eye, EyeOff } from 'lucide-react';

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Signup(): React.ReactElement {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  function isEmailTaken(msg: string) {
    return /email|exists/i.test(msg || '');
  }
  function isUsernameTaken(msg: string) {
    return /username|exists/i.test(msg || '');
  }

  function validateField(name: string, value: string): string | null {
    if (name === 'username') {
      if (!value) return 'username is required';
      if (!USERNAME_RE.test(value)) return 'username must be 3-30 chars (letters, numbers, _ . -)';
      return null;
    }
    if (name === 'email') {
      if (!value) return 'email is required';
      if (!EMAIL_RE.test(value)) return 'please enter a valid email';
      return null;
    }
    if (name === 'password') {
      if (!value) return 'password is required';
      if (value.length < 6) return 'password must be at least 6 characters';
      return null;
    }
    return null;
  }

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErr('');
    setFieldErrors({});
    
    // Client-side validation
    const usernameError = validateField('username', username.trim());
    const emailError = validateField('email', email.trim());
    const passwordError = validateField('password', password);
    
    if (usernameError || emailError || passwordError) {
      setFieldErrors({
        username: usernameError || undefined,
        email: emailError || undefined,
        password: passwordError || undefined,
      });
      return;
    }

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
        setFieldErrors({ email: 'email already in use' });
      } else if (isUsernameTaken(msg)) {
        setErr('that username is taken. pick another.');
        setFieldErrors({ username: 'username already taken' });
      } else {
        setErr(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-8 sm:py-10">
      <h1 className="font-display text-2xl sm:text-3xl mb-1">create your kartz account</h1>
      <p className="text-kartz-mute mb-6 text-sm">
        buy art in rwf, and become an artist whenever you're ready.
      </p>
      <form onSubmit={submit} className="kz-card p-4 sm:p-5 space-y-4">
        <div>
          <label className="kz-label">username</label>
          <input
            className={`kz-input ${fieldErrors.username ? 'border-red-400' : ''}`}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setFieldErrors(prev => ({ ...prev, username: undefined }));
            }}
            required
            minLength={3}
            maxLength={30}
          />
          {fieldErrors.username && <p className="text-xs text-red-400 mt-1">{fieldErrors.username}</p>}
        </div>
        <div>
          <label className="kz-label">email</label>
          <input
            className={`kz-input ${fieldErrors.email ? 'border-red-400' : ''}`}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors(prev => ({ ...prev, email: undefined }));
            }}
            required
          />
          {fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
        </div>
        <div>
          <label className="kz-label">password (min 6 chars)</label>
          <div className="relative">
            <input
              className={`kz-input pr-10 ${fieldErrors.password ? 'border-red-400' : ''}`}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors(prev => ({ ...prev, password: undefined }));
              }}
              required
              minLength={6}
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
          {fieldErrors.password && <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>}
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
