// Navbar.tsx - top-level navigation, aware of auth + role
import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';
import { useTheme } from '../theme';

export default function Navbar(): React.ReactElement {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const isArtist = !!(user && (user.role === 'artist' || user.role === 'admin'));
  const isAdmin = !!(user && user.role === 'admin');

  function handleLogout() {
    logout();
    nav('/');
  }

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-1.5 rounded-md text-sm ${
      isActive ? 'text-kartz-cyan' : 'text-kartz-mute hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-black/40 border-b border-kartz-line">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-kartz-cyan shadow-glowSm" />
          <span className="font-display text-xl tracking-wide text-white">
            kartz<span className="text-kartz-cyan">.</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          <NavLink to="/explore" className={linkCls}>
            explore
          </NavLink>
          {isArtist && (
            <NavLink to="/upload" className={linkCls}>
              upload
            </NavLink>
          )}
          {user && (
            <NavLink to="/orders" className={linkCls}>
              orders
            </NavLink>
          )}
          {isArtist && (
            <NavLink to="/sales" className={linkCls}>
              sales
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={linkCls}>
              admin
            </NavLink>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="kz-btn-ghost text-sm p-2"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden kz-btn-ghost text-sm p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {!user && (
            <>
              <Link to="/login" className="hidden md:block kz-btn-ghost text-sm">
                log in
              </Link>
              <Link to="/signup" className="hidden md:block kz-btn text-sm">
                sign up
              </Link>
            </>
          )}
          {user && (
            <>
              {user.role === 'user' && (
                <Link to="/become-artist" className="hidden md:block kz-btn-ghost text-sm">
                  become an artist
                </Link>
              )}
              <span className="hidden sm:inline text-sm text-kartz-mute">
                @{user.username}
              </span>
              <button onClick={handleLogout} className="hidden md:block kz-btn-ghost text-sm">
                log out
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden absolute top-full left-0 right-0 bg-black/95 backdrop-blur border-b border-kartz-line">
          <nav className="flex flex-col p-4 space-y-2">
            <NavLink
              to="/explore"
              className={linkCls}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              explore
            </NavLink>
            {isArtist && (
              <NavLink
                to="/upload"
                className={linkCls}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                upload
              </NavLink>
            )}
            {user && (
              <NavLink
                to="/orders"
                className={linkCls}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                orders
              </NavLink>
            )}
            {isArtist && (
              <NavLink
                to="/sales"
                className={linkCls}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                sales
              </NavLink>
            )}
            {isAdmin && (
              <NavLink
                to="/admin"
                className={linkCls}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                admin
              </NavLink>
            )}
            {!user && (
              <>
                <Link
                  to="/login"
                  className="kz-btn-ghost text-sm px-3 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  log in
                </Link>
                <Link
                  to="/signup"
                  className="kz-btn text-sm px-3 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  sign up
                </Link>
              </>
            )}
            {user && (
              <>
                {user.role === 'user' && (
                  <Link
                    to="/become-artist"
                    className="kz-btn-ghost text-sm px-3 py-2"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    become an artist
                  </Link>
                )}
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm text-kartz-mute">@{user.username}</span>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="kz-btn-ghost text-sm"
                  >
                    log out
                  </button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
