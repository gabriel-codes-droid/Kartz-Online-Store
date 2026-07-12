// ArtworkDetail.tsx - single artwork view, buy button, sold state
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../auth';
import { formatRWF, timeAgo } from '../components/format';
import Spinner from '../components/Spinner';
import BuyModal from '../components/BuyModal';
import { Heart, Share2 } from 'lucide-react';
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
        const { data } = await api.get<{ artwork: Artwork }>(
          `/artworks/${id}`
        );
        if (!cancelled) {
          setArt(data.artwork);
          setLikeCount(data.artwork.likes || 0);
          setShareCount(data.artwork.shares || 0);
          // Check if current user liked this artwork
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

  function onBuyClick() {
    if (!user) {
      nav('/login?next=' + encodeURIComponent(window.location.pathname));
      return;
    }
    setShowBuy(true);
  }

  async function handleLike() {
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

  async function handleShare() {
    try {
      const { data } = await api.post<{ artwork: Artwork; shares: number }>(
        `/artworks/${id}/share`
      );
      setShareCount(data.shares);
      
      // Copy URL to clipboard
      if (navigator.share) {
        await navigator.share({
          title: art?.title || 'Artwork',
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch {
      // Silently fail on share error
    }
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
          
          {/* Like and Share Buttons */}
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                liked
                  ? 'border-kartz-cyan text-kartz-cyan bg-kartz-cyan/10'
                  : 'border-kartz-line text-kartz-mute hover:text-white hover:border-white/30'
              }`}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
              <span>{likeCount}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-kartz-line text-kartz-mute hover:text-white hover:border-white/30 transition-colors"
            >
              <Share2 size={18} />
              <span>{shareCount}</span>
            </button>
          </div>
          
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
