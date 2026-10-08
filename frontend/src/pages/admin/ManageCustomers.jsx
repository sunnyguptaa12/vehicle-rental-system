import { useCallback, useEffect, useState } from 'react';
import { getAdminCustomers, updateAdminCustomer } from '../../services/adminService';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const emptyForm = { name: '', email: '', phone: '' };

export default function ManageCustomers() {
  const [customers, setCustomers] = useState([]);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadCustomers = useCallback(async () => {
    setError('');
    try {
      const response = await getAdminCustomers();
      setCustomers(response.data?.data || []);
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load customers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);
  useAutoRefresh(loadCustomers);

  const startEditing = (customer) => {
    setEditingCustomer(customer);
    setForm({ name: customer.name || '', email: customer.email || '', phone: customer.phone || '' });
    setError('');
    setNotice('');
  };

  const saveCustomer = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await updateAdminCustomer(editingCustomer.customerId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim()
      });
      setEditingCustomer(null);
      setNotice('Customer details updated.');
      await loadCustomers();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this customer.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Manage Customers</h1>
        <span className="text-xs text-slate-500">Live data{lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ''}</span>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</p>}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Customer ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Email</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Phone</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Registration Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">Loading customers...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">No registered customers yet.</td></tr>
            ) : customers.map((customer) => (
              <tr key={customer.customerId}>
                <td className="px-4 py-3 text-sm text-slate-700">#{customer.customerId}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{customer.name}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{customer.email}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{customer.phone}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{customer.createdAt}</td>
                <td className="px-4 py-3 text-sm">
                  <button type="button" onClick={() => startEditing(customer)} className="button-secondary text-xs">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingCustomer && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setEditingCustomer(null);
        }}>
          <form onSubmit={saveCustomer} className="card w-full max-w-lg space-y-4 p-6">
            <h2 className="text-xl font-bold text-slate-900">Edit Customer #{editingCustomer.customerId}</h2>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
            <label className="block text-sm font-medium text-slate-700">Name
              <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required maxLength="100" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Email
              <input type="email" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required maxLength="100" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Phone
              <input type="tel" inputMode="numeric" pattern="[0-9]{10}" maxLength="10" className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} required />
            </label>
            <div className="flex justify-end gap-3">
              <button type="button" className="button-secondary" onClick={() => setEditingCustomer(null)} disabled={saving}>Cancel</button>
              <button type="submit" className="button-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
