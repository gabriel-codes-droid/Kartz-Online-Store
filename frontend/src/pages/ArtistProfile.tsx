// ArtistProfile.tsx - public artist page built from the populated
// artistId on their artworks (no /api/users/:id route exists).
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api';
import ArtCard from '../components/ArtCard';
import Spinner from '../components/Spinner';
import type { Artwork, User } from '../types';

export default function ArtistProfile(): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<Artwork[]>([]);
  const [artist, setArtist] = useState<
    (Partial<User> & { _id?: string; avatar?: string; bio?: string; displayName?: string; username?: string }) | null
  >(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ items: Artwork[] }>(
          `/artworks/by-artist/${id}`
        );
        const list = data.items || [];
        if (!cancelled) {
          setItems(list);
          if (list.length > 0) {
            const a = list[0].artistId;
            if (typeof a === 'object' && a !== null) {
              setArtist(a as Partial<User> & { _id?: string });
            }
          }
        }
      } catch {
        if (!cancelled) setErr('artist not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 text-kartz-mute">
        <Spinner />
      </div>
    );
  }
  if (err) return <div className="p-10 text-red-400">{err}</div>;

  const name = artist?.displayName || artist?.username || 'unknown artist';
  const initial = (name[0] || '?').toUpperCase();
  const bio = artist?.bio || '';
  const avatar = artist?.avatar || '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="kz-card p-5 flex items-center gap-4 mb-8">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-16 h-16 rounded-full object-cover border border-kartz-amber/40"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-kartz-amber/15 border border-kartz-amber/40 flex items-center justify-center text-kartz-amber font-display text-2xl">
            {initial}
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl">{name}</h1>
          {artist?.username && (
            <p className="text-xs text-kartz-mute">@{artist.username}</p>
          )}
          {bio && (
            <p className="text-sm text-kartz-cream/80 mt-2 max-w-2xl whitespace-pre-wrap">
              {bio}
            </p>
          )}
        </div>
      </div>

      <h2 className="font-display text-2xl mb-4">artworks</h2>

      {items.length === 0 ? (
        <p className="text-kartz-mute">no artworks from this artist yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((a) => (
            <ArtCard key={a._id} art={a} />
          ))}
        </div>
      )}

      <div className="mt-8 text-sm text-kartz-mute">
        <Link to="/explore" className="text-kartz-amber hover:underline">
          ← keep exploring
        </Link>
      </div>
    </div>
  );
}
