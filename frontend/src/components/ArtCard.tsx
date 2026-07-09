// ArtCard.tsx - one artwork in a grid
import React from 'react';
import { Link } from 'react-router-dom';
import { formatRWF, timeAgo } from './format';
import type { Artwork } from '../types';

interface ArtCardProps {
  art: Artwork;
}

export default function ArtCard({ art }: ArtCardProps): React.ReactElement {
  const artist =
    typeof art.artistId === 'object' && art.artistId !== null
      ? art.artistId
      : { username: undefined, displayName: undefined };
  const title = art.title || 'untitled';
  const img =
    art.imageUrl ||
    `https://placehold.co/600x400/0d0d0f/00ffff?text=${encodeURIComponent(title)}`;
  return (
    <Link
      to={`/art/${art._id || art.id}`}
      className="kz-card overflow-hidden group block"
    >
      <div className="aspect-[4/3] overflow-hidden bg-black/40">
        <img
          src={img}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.02] transition"
          onError={(e) => {
            e.currentTarget.src = `https://placehold.co/600x400/0d0d0f/00ffff?text=${encodeURIComponent(
              title
            )}`;
          }}
        />
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-white text-lg leading-tight line-clamp-1">
            {title}
          </h3>
          <span className="kz-pill whitespace-nowrap">{formatRWF(art.price)}</span>
        </div>
        <p className="text-sm text-kartz-mute mt-1">
          by {artist.displayName || artist.username || 'unknown'}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-kartz-mute">
          <span className="capitalize">{art.category}</span>
          <span>{timeAgo(art.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
