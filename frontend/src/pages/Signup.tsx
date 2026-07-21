// Signup.tsx - split-screen signup with live email/username availability,
// password strength meter, and friendly error surfacing.
//
// Talks to backend endpoints:
//   GET  /api/auth/check-email    -> { exists, valid }
//   GET  /api/auth/check-username -> { exists, valid }
//   POST /api/auth/signup         -> { token, user } | { error }
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X, Eye, EyeOff, Sparkles, ShieldCheck, Wallet, Globe2 } from 'lucide-react';
import { useAuth } from '../auth';
import api from '../api';
import Spinner from '../components/Spinner';

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,30}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FieldStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

function passwordStrength(p: string): { score: 0 | 1 | 2 | 3; label: string } {
  if (!p) return { score: 0, label: '—' };
  let score = 0;
  if (p.length >= 6) score++;
  if (p.length >= 10) score++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p)) score++;
  const map = ['weak', 'okay', 'good', 'strong'] as const;
  return { score: score as 0 | 1 | 2 | 3, label: map[score] };
}

function statusToHintClass(s: FieldStatus): string {
  if (s === 'available') return 'kz-field-hint is-ok';
  if (s === 'taken' || s === 'invalid') return 'kz-field-hint is-bad';
  return 'kz-field-hint is-mute';
}

export default function Signup(): React.ReactElement {
  const { signup } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const [usernameStatus, setUsernameStatus] = useState<FieldStatus>('idle');
  const [emailStatus, setEmailStatus] = useState<FieldStatus>('idle');

  const [err, setErr] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; email?: string; password?: string }>({});
  const [loading, setLoading] = useState<boolean>(false);

  // Live username availability
  useEffect(() => {
    const trimmed = username.trim();
    if (!trimmed) { setUsernameStatus('idle'); return; }
    if (!USERNAME_RE.test(trimmed)) { setUsernameStatus('invalid'); return; }
    setUsernameStatus('checking');
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get<{ exists: boolean }>('/auth/check-username', {
          params: { username: trimmed },
        });
        setUsernameStatus(data.exists ? 'taken' : 'available');
      } catch {
        setUsernameStatus('idle');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [username]);

  // Live email availability
  useEffect(() => {
    const trimmed = email.trim();
    if (!trimmed) { setEmailStatus('idle'); return; }
    if (!EMAIL_RE.test(trimmed)) { setEmailStatus('invalid'); return; }
    setEmailStatus('checking');
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get<{ exists: boolean }>('/auth/check-email', {
          params: { email: trimmed },
        });
        setEmailStatus(data.exists ? 'taken' : 'available');
      } catch {
        setEmailStatus('idle');
      }
    }, 500);
    return () => clearTimeout(t);
  }, [email]);

  const strength = passwordStrength(password);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErr('');
    setFieldErrors({});

    // local validation
    const uErr = !username.trim()
      ? 'username is required'
      : !USERNAME_RE.test(username.trim())
        ? 'username must be 3-30 chars (letters, numbers, _ . -)'
        : undefined;
    const eErr = !email.trim()
      ? 'email is required'
      : !EMAIL_RE.test(email.trim())
        ? 'please enter a valid email'
        : undefined;
    const pErr = !password
      ? 'password is required'
      : password.length < 6
        ? 'password must be at least 6 characters'
        : undefined;
    if (uErr || eErr || pErr) {
      setFieldErrors({ username: uErr, email: eErr, password: pErr });
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
      const msg = ax?.response?.data?.error || 'sign up failed. please try again.';
      const lower = msg.toLowerCase();
      if (lower.includes('email') && lower.includes('exist')) {
        setErr('that email is already in use. try logging in, or use a different email.');
        setFieldErrors({ email: 'email already in use' });
        setEmailStatus('taken');
      } else if (lower.includes('username') && lower.includes('exist')) {
        setErr('that username is taken. pick another.');
        setFieldErrors({ username: 'username already taken' });
        setUsernameStatus('taken');
      } else {
        setErr(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const usernameInputCls = `kz-input ${fieldErrors.username || usernameStatus === 'taken' || usernameStatus === 'invalid' ? 'is-bad' : ''}`;
  const emailInputCls = `kz-input ${fieldErrors.email || emailStatus === 'taken' || emailStatus === 'invalid' ? 'is-bad' : ''}`;
  const passwordInputCls = `kz-input pr-10 ${fieldErrors.password ? 'is-bad' : ''}`;

  return (
    <div className="kz-auth-shell kz-fade-up">
      {/* Visual side */}
      <aside className="kz-auth-side">
        <div className="kz-auth-emoji" style={{ top: '6%', left: '8%' }}>🎨</div>
        <div className="kz-auth-emoji" style={{ top: '35%', right: '10%' }}>🖼️</div>
        <div className="kz-auth-emoji" style={{ bottom: '20%', left: '12%' }}>🖌️</div>
        <div className="kz-auth-emoji" style={{ bottom: '8%', right: '15%' }}>✨</div>

        <Link to="/" className="relative flex items-center gap-2 z-10">
          <span className="inline-block w-3 h-3 rounded-full bg-kartz-amber shadow-glowSm" />
          <span className="font-display text-xl tracking-wide">
            kartz<span className="text-kartz-amber">.</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-md">
          <span className="kz-pill mb-4">
            <Sparkles size={12} /> 1,200+ artworks · rwanda
          </span>
          <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl leading-tight font-bold mb-4">
            start your <span className="text-kartz-amber">collection</span> today.
          </h2>
          <p className="text-kartz-mute text-base sm:text-lg">
            buy art in rwf, pay with mtn momo or airtel money. become an artist
            whenever you're ready — we create your flutterwave subaccount in seconds.
          </p>
          <ul className="kz-feature-list">
            <li>Pay with mobile money, cards, or international wallets</li>
            <li>Artists keep <strong className="text-kartz-amber">95%</strong> of every sale</li>
            <li>Verified Rwandan creators, real-time order tracking</li>
          </ul>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-kartz-line bg-kartz-panel/60 p-3 text-center">
              <Wallet size={18} className="text-kartz-amber mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wider text-kartz-mute">momo · airtel</p>
            </div>
            <div className="rounded-lg border border-kartz-line bg-kartz-panel/60 p-3 text-center">
              <Globe2 size={18} className="text-kartz-amber mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wider text-kartz-mute">cards · bank</p>
            </div>
            <div className="rounded-lg border border-kartz-line bg-kartz-panel/60 p-3 text-center">
              <ShieldCheck size={18} className="text-kartz-amber mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wider text-kartz-mute">secure pay</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-kartz-mute flex items-center gap-1.5">
          <ShieldCheck size={12} /> your data is encrypted · no card required
        </p>
      </aside>

      {/* Form side */}
      <div className="kz-auth-form-wrap">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-6">
            <Link to="/" className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded-full bg-kartz-amber shadow-glowSm" />
              <span className="font-display text-xl tracking-wide">
                kartz<span className="text-kartz-amber">.</span>
              </span>
            </Link>
          </div>

          <h1 className="kz-section-title text-2xl sm:text-3xl">create your kartz account</h1>
          <p className="kz-section-sub mb-6">
            already a member?{' '}
            <Link to="/login" className="text-kartz-amber hover:underline font-semibold">
              log in
            </Link>
          </p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {err && (
              <div className="kz-error-banner" role="alert">
                <X size={16} className="mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <strong className="font-semibold">sign up failed:</strong> {err}
                </div>
              </div>
            )}

            <div>
              <label className="kz-label" htmlFor="signup-username">username</label>
              <div className="relative">
                <input
                  id="signup-username"
                  className={usernameInputCls}
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setFieldErrors((p) => ({ ...p, username: undefined }));
                  }}
                  placeholder="e.g. gabriel_m"
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={30}
                />
                {usernameStatus === 'available' && (
                  <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-kartz-amber pointer-events-none" />
                )}
                {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                  <X size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />
                )}
              </div>
              {fieldErrors.username ? (
                <p className="kz-field-hint is-bad" role="alert">{fieldErrors.username}</p>
              ) : usernameStatus === 'checking' ? (
                <p className={statusToHintClass(usernameStatus)}>checking availability…</p>
              ) : usernameStatus === 'available' ? (
                <p className={statusToHintClass(usernameStatus)}>✓ username available</p>
              ) : usernameStatus === 'taken' ? (
                <p className={statusToHintClass(usernameStatus)}>
                  ⚠ already taken. pick another one.
                </p>
              ) : usernameStatus === 'invalid' ? (
                <p className={statusToHintClass(usernameStatus)}>
                  3-30 chars: letters, numbers, _ . -
                </p>
              ) : null}
            </div>

            <div>
              <label className="kz-label" htmlFor="signup-email">email</label>
              <div className="relative">
                <input
                  id="signup-email"
                  className={emailInputCls}
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setFieldErrors((p) => ({ ...p, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
                {emailStatus === 'available' && (
                  <Check size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-kartz-amber pointer-events-none" />
                )}
                {(emailStatus === 'taken' || emailStatus === 'invalid') && (
                  <X size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 pointer-events-none" />
                )}
              </div>
              {fieldErrors.email ? (
                <p className="kz-field-hint is-bad" role="alert">{fieldErrors.email}</p>
              ) : emailStatus === 'checking' ? (
                <p className={statusToHintClass(emailStatus)}>checking availability…</p>
              ) : emailStatus === 'available' ? (
                <p className={statusToHintClass(emailStatus)}>✓ email available</p>
              ) : emailStatus === 'taken' ? (
                <p className={statusToHintClass(emailStatus)}>
                  ⚠ already registered.{' '}
                  <Link to="/login" className="underline">log in?</Link>
                </p>
              ) : emailStatus === 'invalid' ? (
                <p className={statusToHintClass(emailStatus)}>enter a valid email address</p>
              ) : null}
            </div>

            <div>
              <label className="kz-label" htmlFor="signup-password">password (min 6 chars)</label>
              <div className="relative">
                <input
                  id="signup-password"
                  className={passwordInputCls}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-kartz-mute hover:text-kartz-amber transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="kz-strength-track flex-1">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`kz-strength-seg ${i < strength.score ? `on-${strength.score}` : ''}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-kartz-mute min-w-[3rem] text-right capitalize">
                    {strength.label}
                  </span>
                </div>
              )}
              {fieldErrors.password && (
                <p className="kz-field-hint is-bad" role="alert">{fieldErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="kz-btn w-full justify-center mt-2"
            >
              {loading ? <Spinner size={16} /> : 'create account'}
            </button>

            <p className="text-xs text-kartz-mute text-center">
              by creating an account, you agree to kartz's terms of service
              and privacy policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
