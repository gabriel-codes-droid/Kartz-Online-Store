// ArtCard.tsx - one artwork as a museum-framed piece
import React from 'react';
import { Link } from 'react-router-dom';
import { formatRWF, timeAgo } from './format';
import type { Artwork } from '../types';

interface ArtCardProps {
  art: Artwork;
  index?: number;       // 0-based position on the wall (for catalog number)
  variant?: 'hero' | 'tall' | 'wide' | 'square' | 'short';
}

export default function ArtCard({
  art,
  index,
  variant = 'square',
}: ArtCardProps): React.ReactElement {
  const artist =
    typeof art.artistId === 'object' && art.artistId !== null
      ? art.artistId
      : { username: undefined, displayName: undefined };
  const title = art.title || 'untitled';
  const img =
    art.imageUrl ||
    `https://placehold.co/600x400/0d0d0f/E8B86A?text=${encodeURIComponent(title)}`;
  const catalogNo =
    typeof index === 'number'
      ? `№ ${String(index + 1).padStart(2, '0')}`
      : null;
  const variantClass = `kz-frame--${variant}`;

  return (
    <div className={`kz-frame ${variantClass}`}>
      <Link
        to={`/art/${art._id || art.id}`}
        className="absolute inset-0 z-1"
        aria-label={title}
      />

      {catalogNo && <span className="kz-frame__corner">{catalogNo}</span>}
      {!art.sold && (
        <span className="kz-frame__price">{formatRWF(art.price)}</span>
      )}
      {art.sold && (
        <div className="kz-frame__sold">
          <span>sold</span>
        </div>
      )}

      <img
        src={img}
        alt={title}
        loading="lazy"
        onError={(e) => {
          e.currentTarget.src = `https://placehold.co/600x400/0d0d0f/E8B86A?text=${encodeURIComponent(
            title,
          )}`;
        }}
      />

      <div className="kz-museum-label">
        <div className="kz-museum-label__cat">
          <span className="dot" />
          {art.category}
        </div>
        <div className="kz-museum-label__title">{title}</div>
        <div className="kz-museum-label__artist">
          <strong>{artist.displayName || artist.username || 'unknown artist'}</strong>
          {' · '}
          {timeAgo(art.createdAt)}
        </div>
      </div>
    </div>
  );
}
