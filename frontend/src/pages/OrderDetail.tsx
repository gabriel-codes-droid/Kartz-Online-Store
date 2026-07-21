// OrderDetail.tsx - single order, status panel, verify CTA
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import Spinner from '../components/Spinner';
import { formatRWF, timeAgo } from '../components/format';
import type { Artwork, Order, OrderStatus, User } from '../types';

function StatusPill({ s }: { s: OrderStatus }): React.ReactElement {
  const map: Record<OrderStatus, string> = {
    pending: 'border-kartz-amber/40 text-kartz-amber bg-kartz-amber/10',
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

function buyerFrom(o: Order): Partial<User> & { _id?: string } {
  if (o.buyerId && typeof o.buyerId === 'object')
    return o.buyerId as Partial<User> & { _id?: string };
  return {};
}

function artistFrom(o: Order): Partial<User> & { _id?: string } {
  if (o.artistId && typeof o.artistId === 'object')
    return o.artistId as Partial<User> & { _id?: string };
  return {};
}

export default function OrderDetail(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [err, setErr] = useState<string>('');
  const [verifyMsg, setVerifyMsg] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ order: Order }>(`/orders/${id}`);
        if (!cancelled) setOrder(data.order);
      } catch {
        if (!cancelled) setErr('order not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function verify(): Promise<void> {
    if (!order) return;
    setVerifying(true);
    setVerifyMsg('');
    try {
      const { data } = await api.get<{ order: Order }>(`/orders/${order.id}/verify`);
      setOrder(data.order);
      setVerifyMsg('checked the payment provider.');
    } catch (e2) {
      const ax = e2 as { response?: { data?: { error?: string } } };
      setVerifyMsg(ax?.response?.data?.error || 'could not check status');
    } finally {
      setVerifying(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10 text-kartz-mute">
        <Spinner />
      </div>
    );
  }
  if (err) return <div className="p-10 text-red-400">{err}</div>;
  if (!order) return <></>;

  const art = artFrom(order);
  const buyer = buyerFrom(order);
  const artist = artistFrom(order);
  const img =
    art.imageUrl ||
    `https://placehold.co/300x200/0d0d0f/00ffff?text=${encodeURIComponent(
      art.title || 'art'
    )}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <Link
        to="/orders"
        className="text-sm text-kartz-mute hover:text-kartz-amber"
      >
        ← back
      </Link>

      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="font-display text-3xl">order</h1>
        <StatusPill s={order.status} />
        <span className="text-xs text-kartz-mute">
          {timeAgo(order.createdAt)}
        </span>
      </div>

      <div className="kz-card p-5 flex flex-col sm:flex-row gap-4">
        <div className="w-full sm:w-40 h-28 bg-black/40 rounded-md overflow-hidden flex-shrink-0">
          <img
            src={img}
            alt={art.title || 'artwork'}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          {art._id ? (
            <Link
              to={`/art/${art._id}`}
              className="font-display text-xl text-kartz-cream hover:text-kartz-amber"
            >
              {art.title || 'artwork'}
            </Link>
          ) : (
            <p className="font-display text-xl text-kartz-cream">
              {art.title || 'artwork'}
            </p>
          )}
          {artist._id && (
            <p className="text-sm text-kartz-mute">
              by{' '}
              <Link
                to={`/artist/${artist._id}`}
                className="text-kartz-amber hover:underline"
              >
                {artist.displayName || artist.username || 'unknown'}
              </Link>
            </p>
          )}
          <p className="text-xs text-kartz-mute mt-1">
            buyer: {buyer.username || buyer.email || 'unknown'} ·{' '}
            {order.customerEmail}
          </p>
        </div>
      </div>

      <div className="kz-card p-5">
        <h2 className="font-display text-lg mb-3">payment breakdown</h2>
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <p className="text-kartz-mute">amount</p>
          <p className="text-right text-kartz-amber font-display">
            {formatRWF(order.amount)}
          </p>
          <p className="text-kartz-mute">platform commission (5%)</p>
          <p className="text-right">{formatRWF(order.commission)}</p>
          <p className="text-kartz-mute">artist earnings (95%)</p>
          <p className="text-right">{formatRWF(order.artistEarnings)}</p>
          <p className="text-kartz-mute">currency</p>
          <p className="text-right">{order.currency}</p>
          <p className="text-kartz-mute">tx ref</p>
          <p className="text-right text-xs break-all">{order.txRef}</p>
          {order.flwRef && (
            <>
              <p className="text-kartz-mute">flutterwave ref</p>
              <p className="text-right text-xs break-all">{order.flwRef}</p>
            </>
          )}
          {order.completedAt && (
            <>
              <p className="text-kartz-mute">completed at</p>
              <p className="text-right text-xs">
                {new Date(order.completedAt).toLocaleString()}
              </p>
            </>
          )}
        </div>
      </div>

      {order.status === 'pending' && (
        <div className="kz-card p-5 border-kartz-amber/40">
          <h2 className="font-display text-lg mb-2 text-kartz-amber">
            awaiting mobile-money confirmation
          </h2>
          <p className="text-sm text-kartz-mute mb-4">
            we created a flutterwave charge for{' '}
            <span className="text-kartz-cream">{order.customerPhone}</span>. approve
            the prompt on your phone, then come back and check the status.
          </p>
          <div className="flex flex-wrap gap-3">
            {order.paymentLink && (
              <a
                href={order.paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="kz-btn"
              >
                complete payment on phone
              </a>
            )}
            <button
              onClick={verify}
              disabled={verifying}
              className="kz-btn-ghost"
            >
              {verifying ? (
                <Spinner size={16} />
              ) : (
                "i've paid — check status"
              )}
            </button>
          </div>
          {verifyMsg && (
            <p className="text-xs text-kartz-mute mt-3">{verifyMsg}</p>
          )}
        </div>
      )}

      {order.status === 'completed' && (
        <div className="kz-card p-5 border-emerald-400/40 bg-emerald-400/5">
          <h2 className="font-display text-lg mb-1 text-emerald-300">
            payment successful
          </h2>
          <p className="text-sm text-kartz-mute">
            this artwork has been paid for and marked as sold. the artist's
            earnings will be settled to their mobile money.
          </p>
        </div>
      )}

      {order.status === 'failed' && (
        <div className="kz-card p-5 border-red-400/40 bg-red-400/5">
          <h2 className="font-display text-lg mb-1 text-red-300">
            payment failed
          </h2>
          <p className="text-sm text-kartz-mute">
            {order.errorMessage || 'the mobile money charge was rejected.'}
          </p>
        </div>
      )}

      {order.status === 'cancelled' && (
        <div className="kz-card p-5">
          <h2 className="font-display text-lg mb-1 text-kartz-mute">
            order cancelled
          </h2>
          <p className="text-sm text-kartz-mute">
            this order was cancelled. the artwork is still available.
          </p>
        </div>
      )}
    </div>
  );
}
