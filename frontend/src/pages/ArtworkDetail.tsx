// ArtworkDetail.tsx - single artwork view, buy button, sold state
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, ArrowLeft, ShoppingBag, ShieldCheck } from 'lucide-react';
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
  const [liked, setLiked] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(0);
  const [shareCount, setShareCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ artwork: Artwork }>(`/artworks/${id}`);
        if (!cancelled) {
          setArt(data.artwork);
          setLikeCount(data.artwork.likes || 0);
          setShareCount(data.artwork.shares || 0);
          if (user && data.artwork.likedBy) {
            setLiked(data.artwork.likedBy.includes(user.id));
          }
        }
      } catch {
        if (!cancelled) setErr('artwork not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  function onBuyClick(): void {
    if (!user) {
      nav('/login?next=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setShowBuy(true);
  }

  async function handleLike(): Promise<void> {
    if (!user) {
      nav('/login?next=' + encodeURIComponent(window.location.pathname));
      return;
    }
    try {
      const { data } = await api.post<{ artwork: Artwork; liked: boolean }>(
        `/artworks/${id}/like`
      );
      setLiked(data.liked);
      setLikeCount(data.artwork.likes || 0);
    } catch {
      // Silently fail on like error
    }
  }

  async function handleShare(): Promise<void> {
    try {
      const { data } = await api.post<{ artwork: Artwork; shares: number }>(
        `/artworks/${id}/share`
      );
      setShareCount(data.shares);
      if (navigator.share) {
        await navigator.share({
          title: art?.title || 'Artwork',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // Soft non-blocking notice using the error class for visibility
        alert('Link copied to clipboard!');
      }
    } catch {
      // Silently fail on share error
    }
  }

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Spinner size={20} />
      </div>
    );
  }
  if (err) return <div className="p-10 text-red-400">{err}</div>;
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
    `https://placehold.co/900x600/0d0d0f/00ffff?text=${encodeURIComponent(art.title)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 kz-fade-up">
      <Link
        to="/explore"
        className="inline-flex items-center gap-1 text-sm text-kartz-mute hover:text-kartz-cyan transition-colors"
      >
        <ArrowLeft size={14} /> back to explore
      </Link>

      <div className="grid md:grid-cols-2 gap-8 mt-4">
        <div className="kz-card overflow-hidden">
          <div className="aspect-[4/3] bg-black/40">
            <img
              src={img}
              alt={art.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.src = `https://placehold.co/900x600/0d0d0f/00ffff?text=${encodeURIComponent(
                  art.title
                )}`;
              }}
            />
          </div>
        </div>

        <div>
          <span className="kz-pill capitalize mb-3">{art.category}</span>
          <h1 className="font-display text-3xl sm:text-4xl leading-tight">{art.title}</h1>
          <p className="text-kartz-mute mt-1 text-sm">listed {timeAgo(art.createdAt)}</p>
          <p className="text-kartz-cyan text-3xl font-display mt-3">{formatRWF(art.price)}</p>

          {/* Engagement row */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors ${
                liked
                  ? 'border-kartz-cyan text-kartz-cyan bg-kartz-cyan/10'
                  : 'border-kartz-line text-kartz-mute hover:text-white hover:border-white/30'
              }`}
              aria-pressed={liked}
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              <span>{likeCount}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-kartz-line text-kartz-mute hover:text-white hover:border-white/30 text-sm transition-colors"
            >
              <Share2 size={16} />
              <span>{shareCount}</span>
            </button>
          </div>

          {/* Description */}
          <div className="mt-5 kz-card p-4">
            <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">
              {art.description || 'no description.'}
            </p>
          </div>

          {/* Artist card */}
          {artistId && (
            <div className="kz-card p-3 mt-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-kartz-cyan/15 border border-kartz-cyan/40 flex items-center justify-center text-kartz-cyan font-display text-lg shrink-0">
                {(artist.displayName || artist.username || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-kartz-mute">artist</p>
                <Link
                  to={`/artist/${artistId}`}
                  className="text-kartz-cyan hover:underline font-semibold"
                >
                  {artist.displayName || artist.username || 'unknown'}
                </Link>
              </div>
            </div>
          )}

          {/* Buy CTA / status */}
          {art.sold ? (
            <div className="kz-card p-4 mt-5 border-red-400/30 bg-red-400/5">
              <p className="text-sm font-semibold text-red-300">this piece has been sold.</p>
              <p className="text-xs text-kartz-mute mt-1">
                browse more from this artist or check the full catalogue.
              </p>
            </div>
          ) : isOwner ? (
            <div className="kz-card p-4 mt-5">
              <p className="text-sm text-kartz-mute">this is your listing.</p>
            </div>
          ) : (
            <button onClick={onBuyClick} className="kz-btn mt-5 w-full md:w-auto text-base px-6 py-3">
              <ShoppingBag size={16} className="mr-2" /> buy with mobile money
            </button>
          )}

          <p className="mt-3 text-[11px] text-kartz-mute inline-flex items-center gap-1">
            <ShieldCheck size={11} /> secure payment via flutterwave · 5% supports the platform
          </p>
        </div>
      </div>
      {showBuy && art && <BuyModal art={art} onClose={() => setShowBuy(false)} />}
    </div>
  );
}
