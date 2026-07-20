// Home.tsx - landing page: hero + fresh artworks grid + stat block
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Users, Palette, ShoppingBag } from 'lucide-react';
import api from '../api';
import ArtCard from '../components/ArtCard';
import Spinner from '../components/Spinner';
import { useAuth } from '../auth';
import type { Artwork } from '../types';

export default function Home(): React.ReactElement {
  const { user } = useAuth();
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

  const ctaExplore = (
    <Link to="/explore" className="kz-btn">
      browse art <ArrowRight size={16} className="ml-1" />
    </Link>
  );
  const ctaSell = user ? (
    user.role === 'user' ? (
      <Link to="/become-artist" className="kz-btn-ghost">
        become an artist
      </Link>
    ) : (
      <Link to="/upload" className="kz-btn-ghost">
        upload artwork
      </Link>
    )
  ) : (
    <Link to="/signup" className="kz-btn-ghost">
      sell on kartz
    </Link>
  );

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Hero */}
      <section className="py-12 md:py-20 kz-fade-up">
        <span className="kz-pill mb-4">
          <Sparkles size={12} /> rwanda · international payments
        </span>
        <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight max-w-4xl">
          buy art, <span className="text-kartz-cyan">pay worldwide</span>.{' '}
          <br className="hidden sm:block" />
          artists keep <span className="text-kartz-cyan">95%</span>.
        </h1>
        <p className="text-kartz-mute mt-5 max-w-2xl text-base sm:text-lg leading-relaxed">
          kartz is an art marketplace built in rwanda. buyers pay with cards,
          mtn momo, or airtel money, and the platform keeps a flat 5%
          commission — the rest goes straight to the artist.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {ctaExplore}
          {ctaSell}
        </div>

        {/* Stats strip */}
        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="kz-stat-block">
            <TrendingUp size={16} className="text-kartz-cyan mb-2" />
            <div className="kz-stat-block-value">95%</div>
            <div className="kz-stat-block-label">to the artist</div>
          </div>
          <div className="kz-stat-block">
            <Palette size={16} className="text-kartz-cyan mb-2" />
            <div className="kz-stat-block-value">1,200+</div>
            <div className="kz-stat-block-label">artworks listed</div>
          </div>
          <div className="kz-stat-block">
            <Users size={16} className="text-kartz-cyan mb-2" />
            <div className="kz-stat-block-value">38</div>
            <div className="kz-stat-block-label">verified artists</div>
          </div>
          <div className="kz-stat-block">
            <ShoppingBag size={16} className="text-kartz-cyan mb-2" />
            <div className="kz-stat-block-value">3</div>
            <div className="kz-stat-block-label">payment rails</div>
          </div>
        </div>

        <div className="kz-divider mt-12" />
      </section>

      {/* Fresh on the wall */}
      <section className="pb-16">
        <div className="flex items-end justify-between gap-3 mb-6">
          <div>
            <h2 className="kz-section-title">fresh on the wall</h2>
            <p className="kz-section-sub">the latest pieces from our artists</p>
          </div>
          <Link
            to="/explore"
            className="text-sm text-kartz-cyan hover:underline inline-flex items-center gap-1 shrink-0"
          >
            see all <ArrowRight size={14} />
          </Link>
        </div>

        {loading && (
          <div className="p-10 flex justify-center">
            <Spinner size={20} />
          </div>
        )}
        {err && <p className="text-red-400 text-sm">{err}</p>}
        {!loading && !err && (
          items.length === 0 ? (
            <div className="kz-empty kz-card">
              <p>no artworks yet — check back soon.</p>
              <Link to="/explore" className="text-kartz-cyan hover:underline text-sm mt-2 inline-block">
                or browse the full catalogue →
              </Link>
            </div>
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
