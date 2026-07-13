// BecomeArtist - upgrade a regular user to artist role and create the
// Flutterwave subaccount. Required before you can upload or sell.
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ShieldCheck, Wallet, Phone, User as UserIcon, FileText } from 'lucide-react';
import { useAuth } from '../auth';
import Spinner from '../components/Spinner';
import type { MobileProvider } from '../types';

const PROVIDER_INFO: Record<'MMT' | 'AIR', { label: string; sub: string; prefix: string }> = {
  MMT: { label: 'MTN MoMo', sub: 'mobile money rwanda', prefix: '078 / 079' },
  AIR: { label: 'Airtel Money', sub: 'airtel rwanda', prefix: '072 / 073' },
};

export default function BecomeArtist(): React.ReactElement {
  const { user, upgradeToArtist, refresh } = useAuth();
  const nav = useNavigate();

  const [displayName, setDisplayName] = useState<string>(
    user?.displayName || user?.username || ''
  );
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const initialProvider: 'MMT' | 'AIR' =
    user?.mobileProvider === 'AIR' ? 'AIR' : 'MMT';
  const [mobileProvider, setMobileProvider] = useState<'MMT' | 'AIR'>(initialProvider);
  const [bio, setBio] = useState<string>(user?.bio || '');
  const [err, setErr] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErr('');
    if (!displayName.trim() || !phone.trim()) {
      setErr('display name and phone are required');
      return;
    }
    setLoading(true);
    try {
      await upgradeToArtist({
        displayName: displayName.trim(),
        phone: phone.trim(),
        mobileProvider,
        bio: bio.trim(),
      });
      await refresh();
      nav('/upload', { replace: true });
    } catch (e2) {
      const ax = e2 as { response?: { data?: { error?: string } } };
      setErr(ax?.response?.data?.error || 'upgrade failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="kz-auth-shell kz-fade-up">
      {/* Visual side */}
      <aside className="kz-auth-side">
        <div className="kz-auth-emoji" style={{ top: '10%', left: '8%' }}>🎨</div>
        <div className="kz-auth-emoji" style={{ top: '40%', right: '8%' }}>🖼️</div>
        <div className="kz-auth-emoji" style={{ bottom: '20%', left: '14%' }}>💰</div>
        <div className="kz-auth-emoji" style={{ bottom: '8%', right: '12%' }}>✨</div>

        <Link to="/" className="relative flex items-center gap-2 z-10">
          <span className="inline-block w-3 h-3 rounded-full bg-kartz-cyan shadow-glowSm" />
          <span className="font-display text-xl tracking-wide">
            kartz<span className="text-kartz-cyan">.</span>
          </span>
        </Link>

        <div className="relative z-10 max-w-md">
          <span className="kz-pill mb-4">
            <Sparkles size={12} /> for rwanda creators
          </span>
          <h2 className="font-display text-3xl sm:text-4xl xl:text-5xl leading-tight font-bold mb-4">
            sell on kartz.<br />
            <span className="text-kartz-cyan">keep 95%.</span>
          </h2>
          <p className="text-kartz-mute text-base sm:text-lg">
            we create a flutterwave subaccount for you so 95% of every sale
            goes to your mobile money, and 5% supports the platform.
          </p>
          <ul className="kz-feature-list">
            <li>List as many artworks as you want</li>
            <li>Payments settle to your <strong className="text-kartz-cyan">MTN MoMo</strong> or <strong className="text-kartz-cyan">Airtel Money</strong></li>
            <li>Real-time order notifications + sales dashboard</li>
          </ul>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-kartz-line bg-kartz-panel/60 p-3 text-center">
              <Wallet size={18} className="text-kartz-cyan mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wider text-kartz-mute">instant payouts</p>
            </div>
            <div className="rounded-lg border border-kartz-line bg-kartz-panel/60 p-3 text-center">
              <ShieldCheck size={18} className="text-kartz-cyan mx-auto mb-1" />
              <p className="text-[10px] uppercase tracking-wider text-kartz-mute">secure escrow</p>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-kartz-mute flex items-center gap-1.5">
          <ShieldCheck size={12} /> you can change provider later via support
        </p>
      </aside>

      {/* Form side */}
      <div className="kz-auth-form-wrap">
        <div className="w-full max-w-lg">
          <h1 className="kz-section-title text-2xl sm:text-3xl">become an artist</h1>
          <p className="kz-section-sub mb-6">
            we&apos;ll create a flutterwave subaccount for your mobile money. you
            can start uploading the moment this is done.
          </p>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {err && (
              <div className="kz-error-banner" role="alert">
                <strong className="font-semibold">upgrade failed:</strong> {err}
              </div>
            )}

            <div>
              <label className="kz-label" htmlFor="ba-display">display name</label>
              <div className="relative">
                <UserIcon
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-kartz-mute pointer-events-none"
                />
                <input
                  id="ba-display"
                  className="kz-input pl-9"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={60}
                  placeholder="e.g. Gabriel's Studio"
                />
              </div>
              <p className="text-xs text-kartz-mute mt-1">shown next to your artworks</p>
            </div>

            <div>
              <label className="kz-label" htmlFor="ba-phone">mobile money number</label>
              <div className="relative">
                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-kartz-mute pointer-events-none"
                />
                <input
                  id="ba-phone"
                  className="kz-input pl-9"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="0788 123 456"
                />
              </div>
            </div>

            <div>
              <label className="kz-label">provider</label>
              <div className="grid grid-cols-2 gap-2">
                {(['MMT', 'AIR'] as const).map((p) => {
                  const info = PROVIDER_INFO[p];
                  const active = mobileProvider === p;
                  return (
                    <button
                      type="button"
                      key={p}
                      onClick={() => setMobileProvider(p)}
                      className={`text-left p-3 rounded-md border transition ${
                        active
                          ? 'border-kartz-cyan bg-kartz-cyan/10 shadow-glowSm'
                          : 'border-kartz-line bg-black/40 hover:border-kartz-cyan/40'
                      }`}
                    >
                      <p className="text-sm font-semibold text-white">{info.label}</p>
                      <p className="text-xs text-kartz-mute">{info.sub}</p>
                      <p className="text-[10px] text-kartz-mute mt-1">{info.prefix}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="kz-label" htmlFor="ba-bio">
                short bio <span className="text-kartz-mute/60">(optional)</span>
              </label>
              <div className="relative">
                <FileText
                  size={16}
                  className="absolute left-3 top-3 text-kartz-mute pointer-events-none"
                />
                <textarea
                  id="ba-bio"
                  className="kz-input pl-9 min-h-[100px]"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  placeholder="what kind of art do you make?"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="kz-btn w-full justify-center mt-2"
            >
              {loading ? <Spinner size={16} /> : 'connect payments & continue'}
            </button>

            <p className="text-xs text-kartz-mute">
              by continuing you authorize kartz to create a flutterwave
              subaccount for your mobile money number.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
