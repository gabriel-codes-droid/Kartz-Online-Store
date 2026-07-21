// Navbar.tsx - top-level navigation, auth-aware, role-aware,
// with a profile dropdown and a mobile drawer.
import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Upload,
  ShoppingBag,
  BarChart3,
  Shield,
  Palette,
} from 'lucide-react';
import { useAuth } from '../auth';
import { useTheme } from '../theme';

const linkCls = ({ isActive }: { isActive: boolean }): string =>
  `px-3 py-1.5 rounded-md text-sm transition ${
    isActive
      ? 'text-kartz-amber bg-kartz-amber/10 shadow-glowSm'
      : 'text-kartz-mute hover:text-kartz-cream'
  }`;

export default function Navbar(): React.ReactElement {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const nav = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const isArtist = !!(user && (user.role === 'artist' || user.role === 'admin'));
  const isAdmin = !!(user && user.role === 'admin');
  const initials = (user?.displayName || user?.username || '?').charAt(0).toUpperCase();

  function handleLogout(): void {
    logout();
    setIsProfileOpen(false);
    setIsDrawerOpen(false);
    nav('/');
  }

  // close profile dropdown on outside click / escape
  useEffect(() => {
    function onDown(e: MouseEvent): void {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        setIsProfileOpen(false);
        setIsDrawerOpen(false);
      }
    }
    if (isProfileOpen) document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [isProfileOpen]);

  // lock body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  return (
    <header className="sticky top-0 z-30 backdrop-blur bg-kartz-bg/70 border-b border-kartz-line">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="inline-block w-3 h-3 rounded-full bg-kartz-amber shadow-glowSm kz-pulse" />
          <span className="font-display text-xl tracking-wide text-kartz-cream">
            kartz<span className="text-kartz-amber">.</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-1 ml-4">
          <NavLink to="/explore" className={linkCls}>explore</NavLink>
          {isArtist && <NavLink to="/upload" className={linkCls}>upload</NavLink>}
          {user && <NavLink to="/orders" className={linkCls}>orders</NavLink>}
          {isArtist && <NavLink to="/sales" className={linkCls}>sales</NavLink>}
          {isAdmin && <NavLink to="/admin" className={linkCls}>admin</NavLink>}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="kz-btn-ghost text-sm p-2"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user && (
            <button
              className="hidden sm:inline-flex kz-btn-ghost text-sm p-2"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={18} />
            </button>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="md:hidden kz-btn-ghost text-sm p-2"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Desktop auth CTAs / profile */}
          <div className="hidden md:flex items-center gap-2">
            {!user && (
              <>
                <Link to="/login" className="kz-btn-ghost text-sm">log in</Link>
                <Link to="/signup" className="kz-btn text-sm">sign up</Link>
              </>
            )}
            {user && user.role === 'user' && (
              <Link to="/become-artist" className="hidden lg:inline-flex kz-btn-ghost text-sm">
                become an artist
              </Link>
            )}
            {user && (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition"
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                >
                  <span className="w-7 h-7 rounded-full bg-kartz-amber/15 border border-kartz-amber/40 flex items-center justify-center text-kartz-amber font-display text-sm">
                    {initials}
                  </span>
                  <span className="hidden lg:inline text-sm text-kartz-mute">
                    @{user.username}
                  </span>
                </button>
                {isProfileOpen && (
                  <div className="kz-profile-menu" role="menu">
                    <div className="px-3 py-2 border-b border-kartz-line mb-1">
                      <p className="text-sm font-semibold text-kartz-cream truncate">
                        {user.displayName || user.username}
                      </p>
                      <p className="text-xs text-kartz-mute truncate">
                        {user.email}
                      </p>
                      <span className="kz-pill mt-1.5">{user.role}</span>
                    </div>
                    <Link
                      to="/orders"
                      onClick={() => setIsProfileOpen(false)}
                      className="kz-profile-item"
                      role="menuitem"
                    >
                      <ShoppingBag size={14} /> My orders
                    </Link>
                    {isArtist && (
                      <Link
                        to="/sales"
                        onClick={() => setIsProfileOpen(false)}
                        className="kz-profile-item"
                        role="menuitem"
                      >
                        <BarChart3 size={14} /> Sales
                      </Link>
                    )}
                    {isArtist && (
                      <Link
                        to="/upload"
                        onClick={() => setIsProfileOpen(false)}
                        className="kz-profile-item"
                        role="menuitem"
                      >
                        <Upload size={14} /> Upload artwork
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setIsProfileOpen(false)}
                        className="kz-profile-item"
                        role="menuitem"
                      >
                        <Shield size={14} /> Admin
                      </Link>
                    )}
                    <div className="my-1 border-t border-kartz-line" />
                    <button
                      onClick={handleLogout}
                      className="kz-profile-item is-danger"
                      role="menuitem"
                    >
                      <LogOut size={14} /> Log out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {isDrawerOpen && (
        <div className="kz-drawer md:hidden" onClick={() => setIsDrawerOpen(false)}>
          <div
            className="kz-drawer-panel kz-fade-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Mobile menu"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-kartz-amber shadow-glowSm" />
                <span className="font-display text-lg tracking-wide text-kartz-cream">
                  kartz<span className="text-kartz-amber">.</span>
                </span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="text-kartz-mute hover:text-kartz-cream p-1"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {user && (
              <div className="kz-card p-3 mb-4 flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-kartz-amber/15 border border-kartz-amber/40 flex items-center justify-center text-kartz-amber font-display">
                  {initials}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-kartz-cream truncate">
                    {user.displayName || user.username}
                  </p>
                  <p className="text-xs text-kartz-mute truncate">@{user.username}</p>
                </div>
                <span className="kz-pill">{user.role}</span>
              </div>
            )}

            <nav className="flex flex-col gap-1">
              <NavLink to="/explore" onClick={() => setIsDrawerOpen(false)} className={linkCls}>
                <span className="inline-flex items-center gap-2">
                  <Palette size={14} /> explore
                </span>
              </NavLink>
              {isArtist && (
                <NavLink to="/upload" onClick={() => setIsDrawerOpen(false)} className={linkCls}>
                  <span className="inline-flex items-center gap-2">
                    <Upload size={14} /> upload
                  </span>
                </NavLink>
              )}
              {user && (
                <NavLink to="/orders" onClick={() => setIsDrawerOpen(false)} className={linkCls}>
                  <span className="inline-flex items-center gap-2">
                    <ShoppingBag size={14} /> orders
                  </span>
                </NavLink>
              )}
              {isArtist && (
                <NavLink to="/sales" onClick={() => setIsDrawerOpen(false)} className={linkCls}>
                  <span className="inline-flex items-center gap-2">
                    <BarChart3 size={14} /> sales
                  </span>
                </NavLink>
              )}
              {isAdmin && (
                <NavLink to="/admin" onClick={() => setIsDrawerOpen(false)} className={linkCls}>
                  <span className="inline-flex items-center gap-2">
                    <Shield size={14} /> admin
                  </span>
                </NavLink>
              )}
            </nav>

            <div className="mt-6 pt-4 border-t border-kartz-line space-y-2">
              {!user && (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsDrawerOpen(false)}
                    className="kz-btn-ghost w-full justify-center"
                  >
                    log in
                  </Link>
                  <Link
                    to="/signup"
                    onClick={() => setIsDrawerOpen(false)}
                    className="kz-btn w-full justify-center"
                  >
                    sign up
                  </Link>
                </>
              )}
              {user && user.role === 'user' && (
                <Link
                  to="/become-artist"
                  onClick={() => setIsDrawerOpen(false)}
                  className="kz-btn-ghost w-full justify-center"
                >
                  become an artist
                </Link>
              )}
              {user && (
                <button
                  onClick={handleLogout}
                  className="kz-btn-ghost w-full justify-center"
                >
                  <LogOut size={14} className="mr-2" /> log out
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
