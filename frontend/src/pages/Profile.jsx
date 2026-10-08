import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getCustomerById, updateCustomer } from '../services/customerService';

const emptyProfile = { name: '', email: '', phone: '' };

export default function Profile() {
  const { user, login, token, role } = useAuth();
  const [profile, setProfile] = useState(emptyProfile);
  const [form, setForm] = useState(emptyProfile);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    if (!user?.customerId) {
      setError('Customer profile is unavailable. Please log in again.');
      setLoading(false);
      return undefined;
    }

    getCustomerById(user.customerId)
      .then((response) => {
        const customer = response.data?.data || response.data;
        const data = {
          name: customer.name || '',
          email: customer.email || '',
          phone: customer.phone || ''
        };
        if (active) {
          setProfile(data);
          setForm(data);
        }
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.response?.data?.message || 'Unable to load your profile.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user?.customerId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);

    try {
      const response = await updateCustomer(user.customerId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim()
      });
      const customer = response.data?.data || response.data;
      const updatedProfile = {
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      };
      setProfile(updatedProfile);
      setForm(updatedProfile);
      login({ ...user, ...updatedProfile }, token, role);
      setEditing(false);
      setNotice('Profile updated successfully.');
    } catch (saveError) {
      setError(saveError.response?.data?.message || 'Unable to update your profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(profile);
    setError('');
    setEditing(false);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="card p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Account</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Your Profile</h1>
          </div>
          {!loading && !editing && (
            <button type="button" className="button-primary" onClick={() => {
              setError('');
              setNotice('');
              setEditing(true);
            }}>
              Update Profile
            </button>
          )}
        </div>

        {error && <div role="alert" className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {notice && <div role="status" className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

        {loading ? (
          <p className="mt-8 text-slate-600">Loading profile...</p>
        ) : editing ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="profile-name" className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
              <input
                id="profile-name"
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label htmlFor="profile-email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <input
                id="profile-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label htmlFor="profile-phone" className="mb-1 block text-sm font-medium text-slate-700">Phone number</label>
              <input
                id="profile-phone"
                type="tel"
                autoComplete="tel"
                inputMode="numeric"
                pattern="[0-9]{10}"
                title="Enter exactly 10 digits"
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                maxLength={10}
                required
              />
              <p className="mt-1 text-xs text-slate-500">Enter a 10-digit phone number.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="button-primary disabled:opacity-50" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="button-secondary" onClick={handleCancel} disabled={saving}>Cancel</button>
            </div>
          </form>
        ) : (
          <dl className="mt-8 space-y-5 text-slate-700">
            <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 pb-3">
              <dt>Name</dt><dd className="font-semibold">{profile.name}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 pb-3">
              <dt>Email</dt><dd className="font-semibold">{profile.email}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2 border-b border-slate-200 pb-3">
              <dt>Phone</dt><dd className="font-semibold">{profile.phone}</dd>
            </div>
          </dl>
        )}
      </div>
    </div>
  );
}
