// ArtCard.tsx - one artwork in a grid
import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
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
      className="kz-card overflow-hidden group block relative"
    >
      <div className="aspect-[4/3] overflow-hidden bg-black/40 relative">
        <img
          src={img}
          alt={title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-[1.04] transition duration-500"
          onError={(e) => {
            e.currentTarget.src = `https://placehold.co/600x400/0d0d0f/00ffff?text=${encodeURIComponent(
              title
            )}`;
          }}
        />
        {/* hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 pointer-events-none">
          <span className="text-white text-xs font-semibold inline-flex items-center gap-1">
            <Eye size={12} /> view
          </span>
        </div>
        {art.sold && (
          <span className="absolute top-2 left-2 kz-pill bg-red-400/20 text-red-300 border-red-400/40">
            sold
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-white text-lg leading-tight line-clamp-1 group-hover:text-kartz-cyan transition-colors">
            {title}
          </h3>
          <span className="kz-pill whitespace-nowrap">{formatRWF(art.price)}</span>
        </div>
        <p className="text-sm text-kartz-mute mt-1 truncate">
          by {artist.displayName || artist.username || 'unknown'}
        </p>
        <div className="mt-2 flex items-center justify-between text-xs text-kartz-mute">
          <span className="capitalize">{art.category}</span>
          <span className="inline-flex items-center gap-2">
            {art.likes !== undefined && art.likes > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Heart size={11} /> {art.likes}
              </span>
            )}
            <span>{timeAgo(art.createdAt)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
