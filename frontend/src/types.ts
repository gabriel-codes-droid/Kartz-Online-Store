// Shared types for the Kartz frontend.
// These mirror the shapes the backend returns from its Mongoose models,
// with optional fields where the schema allows.

export type Role = 'user' | 'artist' | 'admin';

export type MobileProvider = 'MMT' | 'AIR' | '';

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
  phone?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  subaccountId?: string;
  mobileProvider?: MobileProvider;
  createdAt: string;
}

export type ArtCategory =
  | 'painting'
  | 'drawing'
  | 'photography'
  | 'digital'
  | 'sculpture'
  | 'other';

export const CATEGORIES: ArtCategory[] = [
  'painting',
  'drawing',
  'photography',
  'digital',
  'sculpture',
  'other',
];

export interface Artwork {
  _id: string;
  id?: string;
  title: string;
  description: string;
  price: number;
  category: ArtCategory;
  imageUrl: string;
  // Backend populates artistId to { _id, username, displayName, avatar, bio }
  // for the single-artwork route, but list routes may only populate the
  // basic fields. Accept either shape.
  artistId: User | string;
  sold: boolean;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'completed' | 'failed' | 'cancelled';

export interface Order {
  id: string;
  artworkId: Artwork | string;
  buyerId: User | string;
  artistId: User | string;
  amount: number;
  commission: number;
  artistEarnings: number;
  currency: string;
  txRef: string;
  flwRef: string;
  status: OrderStatus;
  customerEmail: string;
  customerPhone: string;
  paymentLink: string;
  errorMessage: string;
  createdAt: string;
  completedAt: string | null;
}

// --- auth payloads ---
export interface SignupPayload {
  username: string;
  email: string;
  password: string;
}

export interface UpgradePayload {
  phone: string;
  mobileProvider: 'MMT' | 'AIR';
  displayName: string;
  bio?: string;
  avatar?: string;
}

// --- admin ---
export interface AdminSeriesPoint {
  date: string;
  sales: number;
  commission: number;
}

export interface AdminRecentOrder {
  id: string;
  amount: number;
  commission: number;
  status: OrderStatus;
  createdAt: string;
  artwork?: { _id?: string; title?: string } | string | null;
  buyer?: { _id?: string; username?: string; email?: string } | string | null;
  artist?: { _id?: string; username?: string; displayName?: string } | string | null;
}

export interface AdminStats {
  users: number;
  artists: number;
  artworks: number;
  totalCompleted: number;
  totalSales: number;
  totalCommission: number;
  totalArtistEarnings: number;
  series: AdminSeriesPoint[];
  recentOrders: AdminRecentOrder[];
}

export interface AdminUser {
  _id: string;
  id?: string;
  username: string;
  email: string;
  role: Role;
  phone?: string;
  displayName?: string;
  bio?: string;
  avatar?: string;
  createdAt?: string;
}
