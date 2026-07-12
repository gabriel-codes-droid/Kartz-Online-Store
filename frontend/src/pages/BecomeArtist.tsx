// BecomeArtist - upgrade a regular user to artist role and create the
// Flutterwave subaccount. Required before you can upload or sell.
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import Spinner from '../components/Spinner';
import type { MobileProvider } from '../types';

export default function BecomeArtist(): React.ReactElement {
  const { user, upgradeToArtist, refresh } = useAuth();
  const nav = useNavigate();

  const [displayName, setDisplayName] = useState<string>(
    user?.displayName || user?.username || ''
  );
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const initialProvider: MobileProvider =
    user?.mobileProvider === 'MMT' || user?.mobileProvider === 'AIR'
      ? user.mobileProvider
      : 'MMT';
  const [mobileProvider, setMobileProvider] = useState<MobileProvider>(initialProvider);
  const [bio, setBio] = useState<string>(user?.bio || '');
  const [err, setErr] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErr('');
    setLoading(true);
    try {
      await upgradeToArtist({
        displayName: displayName.trim(),
        phone: phone.trim(),
        mobileProvider: mobileProvider === '' ? 'MMT' : mobileProvider,
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
    <div className="max-w-xl mx-auto px-4 py-8 sm:py-10">
      <h1 className="font-display text-2xl sm:text-3xl mb-1">become an artist</h1>
      <p className="text-kartz-mute text-sm mb-6">
        we create a flutterwave subaccount for you so 95% of every sale goes to
        your mobile money and 5% supports the platform.
      </p>
      <form onSubmit={submit} className="kz-card p-4 sm:p-5 space-y-3">
        <div>
          <label className="kz-label">display name (shown on your artworks)</label>
          <input
            className="kz-input"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
            maxLength={60}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="kz-label">mobile money number</label>
            <input
              className="kz-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="0788 123 456"
            />
          </div>
          <div>
            <label className="kz-label">provider</label>
            <select
              className="kz-input"
              value={mobileProvider}
              onChange={(e) => setMobileProvider(e.target.value as MobileProvider)}
            >
              <option value="MMT">mtn momo</option>
              <option value="AIR">airtel money</option>
            </select>
          </div>
        </div>
        <div>
          <label className="kz-label">short bio (optional)</label>
          <textarea
            className="kz-input min-h-[90px]"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
          />
        </div>
        {err && <p className="text-sm text-red-400">{err}</p>}
        <button type="submit" disabled={loading} className="kz-btn w-full">
          {loading ? <Spinner size={16} /> : 'connect payments & continue'}
        </button>
        <p className="text-xs text-kartz-mute">
          by continuing you authorize kartz to create a flutterwave subaccount for
          your mobile money number. you can change it later by contacting support.
        </p>
      </form>
    </div>
  );
}
