// Explore.tsx - search, filter by category, sort
import React, { useEffect, useState } from 'react';
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
      <h1 className="font-display text-3xl mb-4">explore</h1>
      <div className="kz-card p-3 mb-6 flex flex-col md:flex-row gap-3 md:items-center">
        <input
          className="kz-input flex-1"
          placeholder="search title…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1.5 rounded-md text-sm border ${
              !cat
                ? 'border-kartz-cyan text-kartz-cyan'
                : 'border-kartz-line text-kartz-mute hover:text-white'
            }`}
            onClick={() => setCat('')}
          >
            all
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              className={`px-3 py-1.5 rounded-md text-sm border capitalize ${
                cat === c
                  ? 'border-kartz-cyan text-kartz-cyan'
                  : 'border-kartz-line text-kartz-mute hover:text-white'
              }`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
        <select
          className="kz-input md:w-auto"
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

      {loading && (
        <div className="p-10 text-kartz-mute">
          <Spinner />
        </div>
      )}
      {err && <p className="text-red-400">{err}</p>}
      {!loading && !err && (
        items.length === 0 ? (
          <p className="text-kartz-mute">no matches. try clearing filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((a) => (
              <ArtCard key={a._id} art={a} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
