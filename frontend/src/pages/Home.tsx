import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Palette,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import api from '../api';
import ArtCard from '../components/ArtCard';
import Spinner from '../components/Spinner';
import { useAuth } from '../auth';
import type { Artwork } from '../types';

// Rotating variants for the curated gallery wall.
// Index 0 always gets the hero frame, then we cycle through tall/wide/square.
const variants: Array<'hero' | 'tall' | 'wide' | 'square' | 'short'> = [
  'hero',
  'tall',
  'wide',
  'square',
  'square',
  'short',
  'wide',
  'square',
];

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
        if (!cancelled) setErr('Could not load artworks.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sellLink = user
    ? user.role === 'user'
      ? '/become-artist'
      : '/upload'
    : '/signup';

  const sellLabel = user
    ? user.role === 'user'
      ? 'become an artist'
      : 'upload artwork'
    : 'sell on kartz';

  return (
    <div className="relative">
      {/* === Hero: editorial dark gallery wall === */}
      <section className="relative overflow-hidden border-b border-kartz-line">
        {/* warm gallery glow + faint film grain (texture is on body::before) */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(1100px 600px at 18% 8%, rgba(232,184,106,0.14), transparent 55%), radial-gradient(900px 500px at 88% 95%, rgba(139,58,47,0.10), transparent 60%)',
            }}
          />
          {/* corner ornamental marks — frame hooks */}
          <div className="absolute top-8 left-8 w-12 h-12 border-t border-l border-kartz-amber/30" />
          <div className="absolute top-8 right-8 w-12 h-12 border-t border-r border-kartz-amber/30" />
          <div className="absolute bottom-8 left-8 w-12 h-12 border-b border-l border-kartz-amber/30" />
          <div className="absolute bottom-8 right-8 w-12 h-12 border-b border-r border-kartz-amber/30" />
          {/* faint "ART · RWANDA" stamp */}
          <div className="hidden md:block absolute top-1/2 right-6 -rotate-90 origin-right font-mono text-[10px] tracking-[0.4em] text-kartz-amber/30">
            EST. MMXXVI · KIGALI — WORLDWIDE
          </div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl">
            <span className="kz-eyebrow mb-6">kartz · the open wall</span>

            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.95] tracking-tight">
              <span className="block">Collect</span>
              <span className="block italic text-kartz-amber">bold art</span>
              <span className="block">from independent</span>
              <span className="block italic">artists.</span>
            </h1>

            <p className="font-display italic text-kartz-mute mt-7 max-w-2xl text-lg sm:text-xl leading-relaxed">
              A curated marketplace for original works — from the studios of
              Rwanda to collectors worldwide. Secure checkout by card or mobile
              money. <span className="text-kartz-cream not-italic font-body text-base sm:text-base font-normal">Artists keep 95% of every sale.</span>
            </p>

            {/* Search bar — styled like a museum info card */}
            <div className="mt-9 max-w-3xl kz-card p-3 flex flex-col sm:flex-row gap-3">
              <div className="flex flex-1 items-center gap-3 px-3 py-2">
                <Search size={20} className="text-kartz-amber shrink-0" />
                <span className="text-sm sm:text-base text-kartz-mute italic font-display">
                  search the collection — artists, mediums, movements...
                </span>
              </div>
              <Link to="/explore" className="kz-btn rounded-xl">
                enter the gallery <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link to={sellLink} className="kz-btn-ghost rounded-xl">
                {sellLabel}
              </Link>
              <span className="inline-flex items-center gap-2 text-sm text-kartz-mute px-1 italic font-display">
                <ShieldCheck size={16} className="text-kartz-amber" /> secure
                escrow checkout
              </span>
            </div>
          </div>

          {/* Stats — as a museum wall plaque, not SaaS tiles */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="kz-stat-block">
              <TrendingUp size={16} className="text-kartz-amber mb-3" />
              <div className="kz-stat-block-value">95%</div>
              <div className="kz-stat-block-label">to the artist</div>
            </div>
            <div className="kz-stat-block">
              <Palette size={16} className="text-kartz-amber mb-3" />
              <div className="kz-stat-block-value">1.2k+</div>
              <div className="kz-stat-block-label">works hung</div>
            </div>
            <div className="kz-stat-block">
              <Users size={16} className="text-kartz-amber mb-3" />
              <div className="kz-stat-block-value">38</div>
              <div className="kz-stat-block-label">verified artists</div>
            </div>
            <div className="kz-stat-block">
              <ShoppingBag size={16} className="text-kartz-amber mb-3" />
              <div className="kz-stat-block-value">3</div>
              <div className="kz-stat-block-label">payment rails</div>
            </div>
          </div>
        </div>
      </section>

      {/* === The Wall: asymmetric curated gallery === */}
      <section className="max-w-6xl mx-auto px-4 py-14 md:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="kz-eyebrow mb-3">now exhibiting</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-medium text-kartz-cream leading-[1.05] mt-2">
              Fresh <span className="italic text-kartz-amber">on the wall</span>
            </h2>
            <p className="font-display italic text-kartz-mute mt-3 text-sm sm:text-base max-w-lg">
              New pieces from verified artists, hung this week. Tap any frame
              for provenance, dimensions and the story behind the work.
            </p>
          </div>
          <Link
            to="/explore"
            className="font-mono text-[10px] tracking-[0.28em] uppercase text-kartz-amber hover:text-kartz-cream inline-flex items-center gap-2 shrink-0 border-b border-kartz-amber/40 hover:border-kartz-cream pb-1 self-start sm:self-end transition"
          >
            view full catalogue <ArrowRight size={12} />
          </Link>
        </div>

        {loading && (
          <div className="p-10 flex justify-center">
            <Spinner size={20} />
          </div>
        )}

        {err && <p className="text-kartz-oxblood text-sm">{err}</p>}

        {!loading && !err && (
          items.length === 0 ? (
            <div className="kz-empty kz-card">
              <BadgeCheck size={22} className="text-kartz-amber mx-auto mb-2" />
              <p>The wall is empty for now. Check back soon.</p>
              <Link to="/explore" className="text-kartz-amber hover:underline text-sm mt-2 inline-block font-mono tracking-widest uppercase text-[10px]">
                browse the full catalogue
              </Link>
            </div>
          ) : (
            <div className="kz-gallery">
              {items.map((a, i) => (
                <ArtCard
                  key={a._id}
                  art={a}
                  index={i}
                  variant={variants[i % variants.length]}
                />
              ))}
            </div>
          )
        )}
      </section>

      {/* === Curators note: a final quiet footer-line of editorial copy === */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="kz-divider mb-10" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-display italic text-kartz-mute text-sm leading-relaxed">
          <div>
            <span className="kz-eyebrow not-italic mb-2">curated</span>
            <p className="mt-3">
              Every piece on Kartz is uploaded by a verified artist. We don't
              stock prints, dropship or run bots.
            </p>
          </div>
          <div>
            <span className="kz-eyebrow not-italic mb-2">paid fairly</span>
            <p className="mt-3">
              95% goes to the artist on the first sale. We take 5% to keep the
              wall lit, the escrow safe, and the payments moving.
            </p>
          </div>
          <div>
            <span className="kz-eyebrow not-italic mb-2">delivered</span>
            <p className="mt-3">
              Ships from the artist's studio, tracked, insured, signed on the
              back. The story travels with the work.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
