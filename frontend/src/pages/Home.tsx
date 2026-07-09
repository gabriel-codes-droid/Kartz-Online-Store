// Home.tsx - landing page: hero + "fresh on the wall" preview grid
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import ArtCard from '../components/ArtCard';
import Spinner from '../components/Spinner';
import type { Artwork } from '../types';

export default function Home(): React.ReactElement {
  const [items, setItems] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await api.get<{ items: Artwork[] }>('/artworks', {
          params: { sort: 'newest' },
        });
        if (!cancelled) setItems((data.items || []).slice(0, 8));
      } catch {
        if (!cancelled) setErr('could not load artworks');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <section className="py-12 md:py-20">
        <p className="kz-pill mb-3">rwanda · international payments</p>
        <h1 className="font-display text-4xl md:text-6xl leading-tight">
          buy art, <span className="text-kartz-cyan">pay worldwide</span>.{' '}
          <br />
          artists keep <span className="text-kartz-cyan">95%</span>.
        </h1>
        <p className="text-kartz-mute mt-4 max-w-2xl">
          kartz is an art marketplace built in rwanda. buyers pay with cards,
          mtn momo, or airtel money, and the platform keeps a flat 5% commission —
          the rest goes straight to the artist.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/explore" className="kz-btn">
            browse art
          </Link>
          <Link to="/signup" className="kz-btn-ghost">
            sell on kartz
          </Link>
        </div>
        <div className="kz-divider mt-10" />
      </section>

      <section className="pb-12">
        <div className="flex items-end justify-between mb-4">
          <h2 className="font-display text-2xl">fresh on the wall</h2>
          <Link to="/explore" className="text-sm text-kartz-cyan hover:underline">
            see all →
          </Link>
        </div>
        {loading && (
          <div className="p-10 text-kartz-mute">
            <Spinner />
          </div>
        )}
        {err && <p className="text-red-400">{err}</p>}
        {!loading && !err && (
          items.length === 0 ? (
            <p className="text-kartz-mute">no artworks yet — check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((a) => (
                <ArtCard key={a._id} art={a} />
              ))}
            </div>
          )
        )}
      </section>
    </div>
  );
}
