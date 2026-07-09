// MySales.tsx - artist's sales history
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import Spinner from '../components/Spinner';
import { formatRWF, timeAgo } from '../components/format';
import type { Artwork, Order, OrderStatus, User } from '../types';

interface Row {
  order: Order;
  art: Partial<Artwork>;
  buyer: Partial<User>;
}

function StatusPill({ s }: { s: OrderStatus }): React.ReactElement {
  const map: Record<OrderStatus, string> = {
    pending: 'border-kartz-cyan/40 text-kartz-cyan bg-kartz-cyan/10',
    completed: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/10',
    failed: 'border-red-400/40 text-red-300 bg-red-400/10',
    cancelled: 'border-kartz-line text-kartz-mute bg-black/40',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${map[s]}`}
    >
      {s}
    </span>
  );
}

function artFrom(o: Order): Partial<Artwork> {
  if (o.artworkId && typeof o.artworkId === 'object') return o.artworkId;
  return {};
}

function buyerFrom(o: Order): Partial<User> {
  if (o.buyerId && typeof o.buyerId === 'object') return o.buyerId;
  return {};
}

export default function MySales(): React.ReactElement {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ items: Order[] }>('/orders/sales');
        const items = data.items || [];
        if (!cancelled)
          setRows(
            items.map((o) => ({
              order: o,
              art: artFrom(o),
              buyer: buyerFrom(o),
            }))
          );
      } catch {
        if (!cancelled) setErr('could not load your sales');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl mb-1">your sales</h1>
      <p className="text-kartz-mute text-sm mb-6">
        every piece you sold — earnings, commission, and payment status.
      </p>

      {loading && (
        <div className="p-10 text-kartz-mute">
          <Spinner />
        </div>
      )}
      {err && <p className="text-red-400">{err}</p>}
      {!loading && !err && rows.length === 0 && (
        <p className="text-kartz-mute">no sales yet. upload your first piece.</p>
      )}

      <div className="space-y-3">
        {rows.map(({ order, art, buyer }) => {
          const img =
            art.imageUrl ||
            `https://placehold.co/120x90/0d0d0f/00ffff?text=${encodeURIComponent(
              art.title || 'art'
            )}`;
          return (
            <Link
              to={`/order/${order.id}`}
              key={order.id}
              className="kz-card p-3 flex items-center gap-4 hover:border-kartz-cyan/60"
            >
              <div className="w-20 h-16 bg-black/40 rounded-md overflow-hidden flex-shrink-0">
                <img
                  src={img}
                  alt={art.title || 'artwork'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-white truncate">
                  {art.title || 'artwork'}
                </p>
                <p className="text-xs text-kartz-mute">
                  buyer: {buyer.username || buyer.email || 'unknown'} ·{' '}
                  {timeAgo(order.createdAt)}
                </p>
                <p className="text-xs text-kartz-mute">
                  commission {formatRWF(order.commission)} · you earn{' '}
                  <span className="text-kartz-cyan">
                    {formatRWF(order.artistEarnings)}
                  </span>
                </p>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <p className="text-kartz-cyan font-display">
                  {formatRWF(order.amount)}
                </p>
                <StatusPill s={order.status} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
