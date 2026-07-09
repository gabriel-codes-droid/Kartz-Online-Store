// Navbar.tsx - top-level navigation, aware of auth + role
import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Navbar(): React.ReactElement {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  const isArtist = !!(user && (user.role === 'artist' || user.role === 'admin'));
  const isAdmin = !!(user && user.role === 'admin');

  function handleLogout() {
    logout();
    nav('/');
  }

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
          {!user && (
            <>
              <Link to="/login" className="kz-btn-ghost text-sm">
                log in
              </Link>
              <Link to="/signup" className="kz-btn text-sm">
                sign up
              </Link>
            </>
          )}
          {user && (
            <>
              {user.role === 'user' && (
                <Link to="/become-artist" className="kz-btn-ghost text-sm">
                  become an artist
                </Link>
              )}
              <span className="hidden sm:inline text-sm text-kartz-mute">
                @{user.username}
              </span>
              <button onClick={handleLogout} className="kz-btn-ghost text-sm">
                log out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
