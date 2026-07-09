// ArtworkDetail.tsx - single artwork view, buy button, sold state
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import { formatRWF, timeAgo } from '../components/format';
import Spinner from '../components/Spinner';
import BuyModal from '../components/BuyModal';
import type { Artwork, User } from '../types';

export default function ArtworkDetail(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const [art, setArt] = useState<Artwork | null>(null);
  const [err, setErr] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showBuy, setShowBuy] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ artwork: Artwork }>(
          `/artworks/${id}`
        );
        if (!cancelled) setArt(data.artwork);
      } catch {
        if (!cancelled) setErr('artwork not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  function onBuyClick() {
    if (!user) {
      nav('/login?next=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setShowBuy(true);
  }

  if (loading) {
    return (
      <div className="p-10 text-kartz-mute">
        <Spinner />
      </div>
    );
  }
  if (err)
    return <div className="p-10 text-red-400">{err}</div>;
  if (!art) return <></>;

  const rawArtist: User | string = art.artistId;
  const artist: Partial<User> & { _id?: string } =
    typeof rawArtist === 'object' && rawArtist !== null
      ? (rawArtist as Partial<User> & { _id?: string })
      : {};
  const artistId: string = artist._id || (typeof rawArtist === 'string' ? rawArtist : '');
  const isOwner = !!(user && artistId && artistId === user.id);
  const img =
    art.imageUrl ||
    `https://placehold.co/900x600/0d0d0f/00ffff?text=${encodeURIComponent(
      art.title
    )}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link
        to="/explore"
        className="text-sm text-kartz-mute hover:text-kartz-cyan"
      >
        ← back to explore
      </Link>
      <div className="grid md:grid-cols-2 gap-8 mt-4">
        <div className="kz-card overflow-hidden">
          <img
            src={img}
            alt={art.title}
            className="w-full h-auto"
            onError={(e) => {
              e.currentTarget.src = `https://placehold.co/900x600/0d0d0f/00ffff?text=${encodeURIComponent(
                art.title
              )}`;
            }}
          />
        </div>
        <div>
          <h1 className="font-display text-3xl">{art.title}</h1>
          <p className="text-kartz-mute mt-1 capitalize">
            {art.category} · listed {timeAgo(art.createdAt)}
          </p>
          <p className="text-kartz-cyan text-2xl font-display mt-3">
            {formatRWF(art.price)}
          </p>
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-white/90">
            {art.description || 'no description.'}
          </p>

          {artistId && (
            <div className="kz-card p-3 mt-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-kartz-cyan/15 border border-kartz-cyan/40 flex items-center justify-center text-kartz-cyan font-display">
                {(artist.displayName || artist.username || '?')[0].toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-kartz-mute">artist</p>
                <Link
                  to={`/artist/${artistId}`}
                  className="text-kartz-cyan hover:underline"
                >
                  {artist.displayName || artist.username || 'unknown'}
                </Link>
              </div>
            </div>
          )}

          {art.sold ? (
            <p className="mt-6 text-kartz-mute">this piece has been sold.</p>
          ) : isOwner ? (
            <p className="mt-6 text-kartz-mute">this is your listing.</p>
          ) : (
            <button onClick={onBuyClick} className="kz-btn mt-6 w-full md:w-auto">
              buy with mobile money
            </button>
          )}
        </div>
      </div>
      {showBuy && art && <BuyModal art={art} onClose={() => setShowBuy(false)} />}
    </div>
  );
}
