// App.tsx - top-level routing. Wraps the page tree in Navbar + Footer.
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Explore from './pages/Explore';
import ArtworkDetail from './pages/ArtworkDetail';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Upload from './pages/Upload';
import MyOrders from './pages/MyOrders';
import MySales from './pages/MySales';
import OrderDetail from './pages/OrderDetail';
import ArtistProfile from './pages/ArtistProfile';
import Admin from './pages/Admin';
import BecomeArtist from './pages/BecomeArtist';
import { useAuth } from './auth';
import type { Role } from './types';

interface RequireAuthProps {
  children: React.ReactNode;
  roles?: Role[];
}

function RequireAuth({ children, roles }: RequireAuthProps): React.ReactElement {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="p-10 text-kartz-mute">loading…</div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="p-10 text-center">
        <p className="text-kartz-mute">
          this area needs role: {roles.join(' or ')}
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

export default function App(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/art/:id" element={<ArtworkDetail />} />
          <Route path="/artist/:id" element={<ArtistProfile />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/become-artist"
            element={
              <RequireAuth>
                <BecomeArtist />
              </RequireAuth>
            }
          />
          <Route
            path="/upload"
            element={
              <RequireAuth roles={['artist', 'admin']}>
                <Upload />
              </RequireAuth>
            }
          />
          <Route
            path="/orders"
            element={
              <RequireAuth>
                <MyOrders />
              </RequireAuth>
            }
          />
          <Route
            path="/sales"
            element={
              <RequireAuth roles={['artist', 'admin']}>
                <MySales />
              </RequireAuth>
            }
          />
          <Route
            path="/order/:id"
            element={
              <RequireAuth>
                <OrderDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth roles={['admin']}>
                <Admin />
              </RequireAuth>
            }
          />
          <Route
            path="*"
            element={
              <div className="p-10 text-kartz-mute">page not found</div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
