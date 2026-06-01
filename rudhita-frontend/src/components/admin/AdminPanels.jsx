// src/components/admin/AdminPanels.jsx
import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { API } from '@/api/client';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

const Loading = () => (
  <div className="flex items-center justify-center py-20 gap-3 text-muted"><Spinner /> <span className="font-mono text-sm">Loadingâ€¦</span></div>
);

const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'â€”');
const fmtTime = (s) => (s ? new Date(s).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'â€”');

/* â”€â”€ CUSTOMERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function CustomersPanel() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = () => { setLoading(true); API.admin.users({ limit: 200 }).then((d) => setUsers(d.users || [])).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const promote = async (u) => {
    if (!window.confirm(`Make ${u.name} an admin? They'll get full dashboard access.`)) return;
    setBusyId(u.id);
    try { await API.admin.makeAdmin(u.id); setUsers((p) => p.map((x) => x.id === u.id ? { ...x, is_admin: true } : x)); }
    catch (e) { alert(e.message || 'Could not update.'); }
    finally { setBusyId(null); }
  };

  if (loading) return <Loading />;
  return (
    <div className="border-2 border-ink overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-ink text-paper font-mono text-[11px] uppercase tracking-wider">
          <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Role</th></tr>
        </thead>
        <tbody className="divide-y-2 divide-line">
          {users.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-12 text-center text-muted">No customers yet.</td></tr>
          ) : users.map((u) => (
            <tr key={u.id} className="hover:bg-sand">
              <td className="px-4 py-3 font-medium">{u.name}</td>
              <td className="px-4 py-3 text-sm">{u.email}{u.phone && <span className="block font-mono text-[11px] text-muted">{u.phone}</span>}</td>
              <td className="px-4 py-3 text-sm text-muted">{fmtDate(u.created_at)}</td>
              <td className="px-4 py-3">{u.is_verified ? <Badge variant="muted">Verified</Badge> : <Badge variant="outline">Unverified</Badge>}</td>
              <td className="px-4 py-3 text-right">
                {u.is_admin
                  ? <Badge variant="punch"><ShieldCheck size={11} className="mr-1" /> Admin</Badge>
                  : <button onClick={() => promote(u)} disabled={busyId === u.id} className="px-3 py-1.5 border-2 border-ink text-xs font-semibold hover:bg-ink hover:text-paper transition-colors">{busyId === u.id ? 'â€¦' : 'Make admin'}</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* â”€â”€ INVENTORY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function InventoryPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { API.admin.inventory({ limit: 500 }).then((d) => setRows(d.inventory || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  if (loading) return <Loading />;
  return (
    <div className="border-2 border-ink overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-ink text-paper font-mono text-[11px] uppercase tracking-wider">
          <tr><th className="px-4 py-3">Product</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Location</th><th className="px-4 py-3 text-center">Available</th><th className="px-4 py-3 text-center">Committed</th><th className="px-4 py-3 text-center">On Hand</th></tr>
        </thead>
        <tbody className="divide-y-2 divide-line">
          {rows.length === 0 ? (
            <tr><td colSpan={6} className="px-4 py-12 text-center text-muted">No inventory records yet.</td></tr>
          ) : rows.map((r, i) => (
            <tr key={`${r.product_id}-${r.location_id}-${i}`} className="hover:bg-sand">
              <td className="px-4 py-3 font-medium">{r.product_name}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted">{r.sku}</td>
              <td className="px-4 py-3 text-sm">{r.location_name}</td>
              <td className="px-4 py-3 text-center"><span className={r.available <= 5 ? 'text-punch font-bold' : 'font-semibold'}>{r.available}</span></td>
              <td className="px-4 py-3 text-center text-muted">{r.committed}</td>
              <td className="px-4 py-3 text-center font-semibold">{r.total_on_hand}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* â”€â”€ ACTIVITY (audit log) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
export function ActivityPanel() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { API.admin.auditLog({ limit: 100 }).then((d) => setLogs(d.logs || [])).catch(() => {}).finally(() => setLoading(false)); }, []);

  const label = (a) => (a || '').replace(/_/g, ' ');

  if (loading) return <Loading />;
  return (
    <div className="border-2 border-ink">
      {logs.length === 0 ? (
        <div className="px-4 py-12 text-center text-muted">No activity recorded yet.</div>
      ) : (
        <div className="divide-y-2 divide-line">
          {logs.map((l) => (
            <div key={l.id} className="flex items-start gap-4 px-4 py-3">
              <div className="w-2 h-2 mt-2 bg-punch shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm">
                  <span className="font-semibold capitalize">{label(l.action)}</span>
                  {l.target_type && <span className="text-muted"> Â· {l.target_type}{l.target_id ? ` #${l.target_id}` : ''}</span>}
                </p>
                {l.detail && <p className="font-mono text-[11px] text-muted truncate">{typeof l.detail === 'string' ? l.detail : JSON.stringify(l.detail)}</p>}
              </div>
              <span className="font-mono text-[11px] text-muted shrink-0">{fmtTime(l.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
