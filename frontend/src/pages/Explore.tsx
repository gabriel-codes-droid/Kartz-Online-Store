// Explore.tsx - search, filter by category, sort
import React, { useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import api from '../api';
import ArtCard from '../components/ArtCard';
import Spinner from '../components/Spinner';
import { CATEGORIES, type ArtCategory, type Artwork } from '../types';

const SORTS: { v: string; label: string }[] = [
  { v: 'newest', label: 'newest' },
  { v: 'price-asc', label: 'price · low to high' },
  { v: 'price-desc', label: 'price · high to low' },
];

type SortKey = 'newest' | 'price-asc' | 'price-desc';

export default function Explore(): React.ReactElement {
  const [items, setItems] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>('');
  const [q, setQ] = useState<string>('');
  const [cat, setCat] = useState<ArtCategory | ''>('');
  const [sort, setSort] = useState<SortKey>('newest');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get<{ items: Artwork[] }>('/artworks', {
          params: { q, category: cat, sort },
        });
        if (!cancelled) setItems(data.items || []);
      } catch {
        if (!cancelled) setErr('could not load artworks');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [q, cat, sort]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-6 kz-fade-up">
        <h1 className="kz-section-title">explore</h1>
        <p className="kz-section-sub">browse the full kartz catalogue</p>
      </div>

      {/* Sticky filter bar */}
      <div className="sticky top-16 z-20 -mx-4 px-4 py-3 bg-kartz-bg/85 backdrop-blur border-b border-kartz-line mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-kartz-mute pointer-events-none"
            />
            <input
              className="kz-input pl-9"
              placeholder="search by title…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 -mx-1 px-1">
            <button
              className={`kz-chip shrink-0 ${!cat ? 'is-active' : ''}`}
              onClick={() => setCat('')}
            >
              all
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                className={`kz-chip shrink-0 ${cat === c ? 'is-active' : ''}`}
                onClick={() => setCat(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal size={14} className="text-kartz-mute hidden sm:block" />
            <select
              className="kz-input md:w-auto text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              {SORTS.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
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
            <p>no matches.</p>
            <button
              onClick={() => { setQ(''); setCat(''); setSort('newest'); }}
              className="text-kartz-cyan hover:underline text-sm mt-2 inline-block"
            >
              clear filters
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs text-kartz-mute mb-3">
              {items.length} {items.length === 1 ? 'result' : 'results'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {items.map((a) => (
                <ArtCard key={a._id} art={a} />
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
}
