// Footer.tsx - bottom-of-page credit + tagline
import React from 'react';

export default function Footer(): React.ReactElement {
  return (
    <footer className="mt-16 border-t border-kartz-line">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-kartz-mute flex flex-col md:flex-row gap-2 justify-between">
        <p>
          <span className="text-kartz-cyan">kartz</span> · art marketplace · Rwanda
        </p>
        <p>
          payments by flutterwave · 5% supports the platform · 95% goes to the
          artist
        </p>
      </div>
    </footer>
  );
}
