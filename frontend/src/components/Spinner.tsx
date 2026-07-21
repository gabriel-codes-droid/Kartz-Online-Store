// Spinner.tsx - small cyan spinning loader
import React from 'react';

interface SpinnerProps {
  size?: number;
  className?: string;
}

export default function Spinner({
  size = 16,
  className = '',
}: SpinnerProps): React.ReactElement {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-kartz-amber border-r-transparent ${className}`}
      style={{ width: size, height: size }}
      aria-label="loading"
    />
  );
}
