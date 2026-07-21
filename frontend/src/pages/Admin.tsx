// Admin.tsx - stats dashboard + user role management
import React, { useEffect, useState } from 'react';
import { Users, Palette, BarChart3, TrendingUp, ShoppingBag, Wallet } from 'lucide-react';
import api from '../api';
import Spinner from '../components/Spinner';
import { formatRWF, timeAgo } from '../components/format';
import {
  type AdminRecentOrder,
  type AdminSeriesPoint,
  type AdminStats,
  type AdminUser,
  type OrderStatus,
  type Role,
} from '../types';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartPoint {
  date: string;
  sales: number;
}

function orderRef(o: AdminRecentOrder): string {
  if (o.artwork && typeof o.artwork === 'object' && 'title' in o.artwork) {
    return o.artwork.title || '—';
  }
  return '—';
}

function buyerRef(o: AdminRecentOrder): string {
  if (o.buyer && typeof o.buyer === 'object' && 'username' in o.buyer) {
    return o.buyer.username || o.buyer.email || '—';
  }
  return '—';
}

function artistRef(o: AdminRecentOrder): string {
  if (o.artist && typeof o.artist === 'object' && 'username' in o.artist) {
    return o.artist.displayName || o.artist.username || '—';
  }
  return '—';
}

function StatusPill({ s }: { s: OrderStatus }): React.ReactElement {
  const map: Record<OrderStatus, string> = {
    pending: 'border-kartz-amber/40 text-kartz-amber bg-kartz-amber/10',
    completed: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/10',
    failed: 'border-red-400/40 text-red-300 bg-red-400/10',
    cancelled: 'border-kartz-line text-kartz-mute bg-black/40',
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${map[s]}`}
    >
      {s}
    </span>
  );
}

function KpiTile({
  label,
  value,
  icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  sub?: string;
}): React.ReactElement {
  return (
    <div className="kz-kpi">
      <div className="flex items-center justify-between">
        <p className="kz-kpi-label">{label}</p>
        {icon && <span className="text-kartz-amber opacity-70">{icon}</span>}
      </div>
      <p className="kz-kpi-value">{value}</p>
      {sub && <p className="kz-kpi-sub">{sub}</p>}
    </div>
  );
}

export default function Admin(): React.ReactElement {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [err, setErr] = useState<string>('');
  const [updatingId, setUpdatingId] = useState<string>('');
  const [updateErr, setUpdateErr] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [statsRes, usersRes] = await Promise.all([
          api.get<AdminStats>('/admin/stats'),
          api.get<{ items: AdminUser[] }>('/admin/users'),
        ]);
        if (cancelled) return;
        setStats(statsRes.data);
        setUsers(usersRes.data.items || []);
      } catch {
        if (!cancelled) setErr('could not load admin data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function changeRole(u: AdminUser, role: Role): Promise<void> {
    if (!u._id) return;
    setUpdateErr('');
    setUpdatingId(u._id);
    try {
      const { data } = await api.put<{ user: AdminUser }>(
        `/admin/users/${u._id}/role`,
        { role }
      );
      setUsers((cur) =>
        cur.map((x) => (x._id === u._id ? { ...x, ...data.user } : x))
      );
    } catch (e2) {
      const ax = e2 as { response?: { data?: { error?: string } } };
      setUpdateErr(ax?.response?.data?.error || 'role change failed');
    } finally {
      setUpdatingId('');
    }
  }

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Spinner size={20} />
      </div>
    );
  }
  if (err) return <div className="p-10 text-red-400">{err}</div>;
  if (!stats) return <></>;

  const series: ChartPoint[] = (stats.series || []).map(
    (p: AdminSeriesPoint) => ({
      date: p.date,
      sales: p.sales || 0,
    })
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 kz-fade-up">
      <div>
        <h1 className="kz-section-title text-3xl">admin</h1>
        <p className="kz-section-sub">marketplace overview and user management.</p>
      </div>

      <div className="kz-kpi-grid">
        <KpiTile label="users" value={stats.users} icon={<Users size={14} />} />
        <KpiTile label="artists" value={stats.artists} icon={<Palette size={14} />} />
        <KpiTile label="artworks" value={stats.artworks} icon={<BarChart3 size={14} />} />
        <KpiTile
          label="total sales"
          value={formatRWF(stats.totalSales)}
          icon={<TrendingUp size={14} />}
        />
        <KpiTile
          label="platform commission"
          value={formatRWF(stats.totalCommission)}
          icon={<Wallet size={14} />}
          sub="5% of every sale"
        />
        <KpiTile
          label="orders completed"
          value={stats.totalCompleted}
          icon={<ShoppingBag size={14} />}
        />
      </div>

      <div className="kz-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="kz-section-title text-lg">sales · last 7 days</h2>
          <span className="text-xs text-kartz-mute">rwf</span>
        </div>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" fontSize={12} />
              <YAxis fontSize={12} tickFormatter={(v) => `${Math.round(Number(v) / 1000)}k`} />
              <Tooltip formatter={(v: number) => formatRWF(v)} />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#00ffff"
                strokeWidth={2}
                dot={{ r: 3, fill: '#00ffff' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="kz-card p-5">
        <h2 className="kz-section-title text-lg mb-3">recent orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-kartz-mute text-left">
              <tr>
                <th className="py-2 pr-4">artwork</th>
                <th className="py-2 pr-4">buyer</th>
                <th className="py-2 pr-4">artist</th>
                <th className="py-2 pr-4 text-right">amount</th>
                <th className="py-2 pr-4 text-right">commission</th>
                <th className="py-2 pr-4">status</th>
                <th className="py-2">when</th>
              </tr>
            </thead>
            <tbody>
              {(stats.recentOrders || []).map((o) => (
                <tr key={o.id} className="border-t border-kartz-line">
                  <td className="py-2 pr-4">{orderRef(o)}</td>
                  <td className="py-2 pr-4">{buyerRef(o)}</td>
                  <td className="py-2 pr-4">{artistRef(o)}</td>
                  <td className="py-2 pr-4 text-right text-kartz-amber">
                    {formatRWF(o.amount)}
                  </td>
                  <td className="py-2 pr-4 text-right">{formatRWF(o.commission)}</td>
                  <td className="py-2 pr-4">
                    <StatusPill s={o.status} />
                  </td>
                  <td className="py-2 text-xs text-kartz-mute">{timeAgo(o.createdAt)}</td>
                </tr>
              ))}
              {(!stats.recentOrders || stats.recentOrders.length === 0) && (
                <tr>
                  <td className="py-4 text-kartz-mute" colSpan={7}>
                    no orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="kz-card p-5">
        <h2 className="kz-section-title text-lg mb-3">users</h2>
        {updateErr && <p className="text-sm text-red-400 mb-2">{updateErr}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-kartz-mute text-left">
              <tr>
                <th className="py-2 pr-4">username</th>
                <th className="py-2 pr-4">email</th>
                <th className="py-2 pr-4">role</th>
                <th className="py-2">change</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-kartz-line">
                  <td className="py-2 pr-4">{u.username}</td>
                  <td className="py-2 pr-4 text-kartz-mute">{u.email}</td>
                  <td className="py-2 pr-4">
                    <span className="kz-pill">{u.role}</span>
                  </td>
                  <td className="py-2">
                    <select
                      className="kz-input py-1 text-xs w-auto"
                      value={u.role}
                      disabled={updatingId === u._id}
                      onChange={(e) => changeRole(u, e.target.value as Role)}
                    >
                      <option value="user">user</option>
                      <option value="artist">artist</option>
                      <option value="admin">admin</option>
                    </select>
                    {updatingId === u._id && (
                      <span className="ml-2 inline-block align-middle">
                        <Spinner size={12} />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td className="py-4 text-kartz-mute" colSpan={4}>
                    no users.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
