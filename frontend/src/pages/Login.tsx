// Login.tsx - split-screen login with friendly error surfacing.
// Works for both email and username (identifier).
import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, X, Sparkles, ShieldCheck, Wallet, Globe2 } from 'lucide-react';
import { useAuth } from '../auth';
import Spinner from '../components/Spinner';

export default function Login(): React.ReactElement {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErr('');
    setFieldErrors({});

    const iErr = !identifier.trim() ? 'email or username is required' : undefined;
    const pErr = !password
      ? 'password is required'
      : password.length < 6
        ? 'password must be at least 6 characters'
        : undefined;
    if (iErr || pErr) {
      setFieldErrors({ identifier: iErr, password: pErr });
      return;
    }

    setLoading(true);
    try {
      await login(identifier.trim(), password);
      const next = params.get('next') || '/';
      nav(next, { replace: true });
    } catch (e2) {
      const ax = e2 as { response?: { data?: { error?: string } } };
      const raw = ax?.response?.data?.error || 'login failed. please try again.';
      // Friendly mapping for the most common server error.
      if (/invalid credentials/i.test(raw)) {
        setErr('email/username or password is wrong. double-check and try again.');
      } else {
        setErr(raw);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="kz-auth-shell kz-fade-up">
      {/* Visual side */}
      <aside className="kz-auth-side">
        <div className="kz-auth-emoji" style={{ top: '8%', left: '10%' }}>🎨</div>
        <div className="kz-auth-emoji" style={{ top: '38%', right: '8%' }}>🖼️</div>
        <div className="kz-auth-emoji" style={{ bottom: '22%', left: '14%' }}>🏛️</div>
        <div className="kz-auth-emoji" style={{ bottom: '10%', right: '12%' }}>🖌️</div>

        <Link to="/" className="relative flex items-center gap-2 z-10">
          <span className="inline-block w-3 h-3 rounded-full bg-kartz-cyan shadow-glowSm" />
          <span className="font-display text-xl tracking-wide">
            kartz<span className="text-kartz-cyan">.</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-md">
          <span className="kz-pill mb-4">
            <Sparkles size={12} /> trusted by 1,200+ rwanda creators
          </span>
          <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl leading-tight font-bold mb-4">
            welcome <span className="text-kartz-cyan">back</span> to kartz.
          </h2>
          <p className="text-kartz-mute text-base sm:text-lg">
            log in to keep collecting, sell your art, or check on the orders
            already in motion.
          </p>
          <ul className="kz-feature-list">
            <li>Resume any pending mobile money checkout</li>
            <li>Track open orders and recent purchases</li>
            <li>Manage your artist profile and uploads</li>
          </ul>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-kartz-line bg-kartz-panel/60 p-3 text-center">
              <Wallet size={18} className="text-kartz-cyan mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wider text-kartz-mute">momo · airtel</p>
            </div>
            <div className="rounded-lg border border-kartz-line bg-kartz-panel/60 p-3 text-center">
              <Globe2 size={18} className="text-kartz-cyan mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wider text-kartz-mute">cards · bank</p>
            </div>
            <div className="rounded-lg border border-kartz-line bg-kartz-panel/60 p-3 text-center">
              <ShieldCheck size={18} className="text-kartz-cyan mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wider text-kartz-mute">secure pay</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-kartz-mute flex items-center gap-1.5">
          <ShieldCheck size={12} /> secure session · no data stored
        </p>
      </aside>

      {/* Form side */}
      <div className="kz-auth-form-wrap">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-kartz-cyan shadow-glowSm" />
              <span className="font-display text-xl tracking-wide">
                kartz<span className="text-kartz-cyan">.</span>
              </span>
            </Link>
          </div>

          <h1 className="kz-section-title text-2xl sm:text-3xl">welcome back</h1>
          <p className="kz-section-sub mb-6">
            new here?{' '}
            <Link to="/signup" className="text-kartz-cyan hover:underline font-semibold">
              create an account
            </Link>
          </p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {err && (
              <div className="kz-error-banner" role="alert">
                <X size={16} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <strong className="font-semibold">log in failed:</strong> {err}
                </div>
              </div>
            )}

            <div>
              <label className="kz-label" htmlFor="login-identifier">email or username</label>
              <input
                id="login-identifier"
                className={`kz-input ${fieldErrors.identifier ? 'is-bad' : ''}`}
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  setFieldErrors((p) => ({ ...p, identifier: undefined }));
                }}
                placeholder="you@example.com or @username"
                autoComplete="username"
                autoFocus
                required
              />
              {fieldErrors.identifier && (
                <p className="kz-field-hint is-bad" role="alert">{fieldErrors.identifier}</p>
              )}
            </div>

            <div>
              <label className="kz-label" htmlFor="login-password">password</label>
              <div className="relative">
                <input
                  id="login-password"
                  className={`kz-input pr-10 ${fieldErrors.password ? 'is-bad' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-kartz-mute hover:text-kartz-cyan transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="kz-field-hint is-bad" role="alert">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="kz-btn w-full justify-center mt-2"
            >
              {loading ? <Spinner size={16} /> : 'log in'}
            </button>

            <p className="text-xs text-kartz-mute text-center">
              forgot your password?{' '}
              <a
                href="mailto:hello@kartz.local"
                className="text-kartz-cyan hover:underline"
              >
                contact support
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
