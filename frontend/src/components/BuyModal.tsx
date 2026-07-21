// BuyModal - collects email + phone, starts the Flutterwave charge,
// then redirects to /order/:id on success.
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import Spinner from './Spinner';
import { formatRWF } from './format';
import type { Artwork, Order } from '../types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface BuyModalProps {
  art: Artwork;
  onClose: () => void;
}

export default function BuyModal({ art, onClose }: BuyModalProps): React.ReactElement {
  const { user } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState<string>(user?.email || '');
  const [phone, setPhone] = useState<string>(user?.phone || '');
  const [err, setErr] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setErr('');
    if (!EMAIL_RE.test(email)) {
      setErr('enter a valid email');
      return;
    }
    if (!phone) {
      setErr('phone is required for mobile money');
      return;
    }
    setLoading(true);
    try {
      const artId = art._id || art.id;
      const { data } = await api.post<{ order: Order }>('/orders', {
        artworkId: artId,
        customerEmail: email.trim().toLowerCase(),
        customerPhone: phone.trim(),
      });
      onClose();
      nav(`/order/${data.order.id}`);
    } catch (e2) {
      const ax = e2 as { response?: { data?: { error?: string } } };
      setErr(ax?.response?.data?.error || 'could not start payment');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="kz-card w-full max-w-md p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <h2 className="font-display text-lg">buy with mobile money</h2>
            <p className="text-xs text-kartz-mute">
              {art.title} · {formatRWF(art.price)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-kartz-mute hover:text-kartz-cream"
            aria-label="close"
          >
            ×
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="kz-label">your email</label>
            <input
              className="kz-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="kz-label">mobile money phone (mtn or airtel rwanda)</label>
            <input
              className="kz-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="0788 123 456"
            />
            <p className="text-xs text-kartz-mute mt-1">
              we'll send a prompt to this number. approve it on your phone to
              complete the purchase.
            </p>
          </div>
          {err && <p className="text-sm text-red-400">{err}</p>}
          <div className="flex items-center gap-2 pt-1">
            <button type="submit" disabled={loading} className="kz-btn flex-1">
              {loading ? <Spinner size={16} /> : 'pay ' + formatRWF(art.price)}
            </button>
            <button type="button" onClick={onClose} className="kz-btn-ghost">
              cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
