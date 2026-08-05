'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { FiX, FiUserPlus } from 'react-icons/fi';
import { createRoleApi } from '@/lib/roleApi';
import { FieldError } from '@/components/FieldError';
import { validateForm, FieldErrors } from '@/lib/validation';

const churchSchema = z
  .object({
    name: z.string().trim().min(1, 'Church name is required'),
    location: z.string().trim().min(1, 'Location is required'),
    diocese: z.string().optional(),
    contactPerson: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
    createAdmin: z.boolean().optional(),
    adminUsername: z.string().optional(),
    adminEmail: z.string().optional(),
    adminPassword: z.string().optional(),
    adminFirstName: z.string().optional(),
    adminLastName: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.createAdmin) return;
    if (!data.adminFirstName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'First name is required', path: ['adminFirstName'] });
    }
    if (!data.adminLastName?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Last name is required', path: ['adminLastName'] });
    }
    if (!data.adminUsername?.trim() || data.adminUsername.trim().length < 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Username must be at least 3 characters', path: ['adminUsername'] });
    }
    if (!data.adminEmail?.trim() || !z.string().email().safeParse(data.adminEmail.trim()).success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter a valid email', path: ['adminEmail'] });
    }
    if (!data.adminPassword || data.adminPassword.length < 6) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Password must be at least 6 characters', path: ['adminPassword'] });
    }
  });

interface Church {
  _id?: string;
  name: string;
  location: string;
  diocese?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  createAdmin?: boolean;
  adminUsername?: string;
  adminEmail?: string;
  adminPassword?: string;
  adminFirstName?: string;
  adminLastName?: string;
}

interface ChurchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (church: Church) => Promise<void>;
  church?: Church | null;
}

export function ChurchModal({ isOpen, onClose, onSave, church }: ChurchModalProps) {
  const [formData, setFormData] = useState<Church>({
    name: '',
    location: '',
    diocese: '',
    contactPerson: '',
    phone: '',
    email: '',
    createAdmin: false,
    adminUsername: '',
    adminEmail: '',
    adminPassword: '',
    adminFirstName: '',
    adminLastName: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<FieldErrors>({});

  useEffect(() => {
    setFormErrors({});
    if (church) {
      setFormData(church);
    } else {
      setFormData({
        name: '',
        location: '',
        diocese: '',
        contactPerson: '',
        phone: '',
        email: '',
        createAdmin: false,
        adminUsername: '',
        adminEmail: '',
        adminPassword: '',
        adminFirstName: '',
        adminLastName: '',
      });
    }
  }, [church]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = validateForm(churchSchema, formData);
    if (!result.success) {
      setFormErrors(result.errors);
      return;
    }
    setFormErrors({});
    setSaving(true);

    try {
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save church');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {church ? 'Edit Church' : 'Add New Church'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Church Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${formErrors.name ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="St. Mary's Cathedral"
                />
                <FieldError message={formErrors.name} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${formErrors.location ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Kochi, Kerala"
                />
                <FieldError message={formErrors.location} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Diocese
                </label>
                <input
                  type="text"
                  value={formData.diocese || ''}
                  onChange={(e) => setFormData({ ...formData, diocese: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Ernakulam-Angamaly Archdiocese"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={formData.contactPerson || ''}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Fr. Thomas Joseph"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none ${formErrors.email ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="church@example.com"
                />
                <FieldError message={formErrors.email} />
              </div>

              {/* Church Admin Creation Option */}
              {!church && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center mb-4">
                    <input
                      type="checkbox"
                      id="createAdmin"
                      checked={formData.createAdmin || false}
                      onChange={(e) => setFormData({ ...formData, createAdmin: e.target.checked })}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="createAdmin" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                      <FiUserPlus className="w-4 h-4 mr-1" />
                      Create Church Admin Account
                    </label>
                  </div>

                  {formData.createAdmin && (
                    <div className="space-y-4 bg-purple-50 p-4 rounded-lg">
                      <p className="text-xs text-gray-600 mb-3">Admin login credentials</p>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.adminFirstName || ''}
                            onChange={(e) => setFormData({ ...formData, adminFirstName: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${formErrors.adminFirstName ? 'border-red-400' : 'border-gray-300'}`}
                            placeholder="John"
                          />
                          <FieldError message={formErrors.adminFirstName} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={formData.adminLastName || ''}
                            onChange={(e) => setFormData({ ...formData, adminLastName: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${formErrors.adminLastName ? 'border-red-400' : 'border-gray-300'}`}
                            placeholder="Doe"
                          />
                          <FieldError message={formErrors.adminLastName} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Username <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.adminUsername || ''}
                          onChange={(e) => setFormData({ ...formData, adminUsername: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${formErrors.adminUsername ? 'border-red-400' : 'border-gray-300'}`}
                          placeholder="churchadmin"
                        />
                        <FieldError message={formErrors.adminUsername} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.adminEmail || ''}
                          onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${formErrors.adminEmail ? 'border-red-400' : 'border-gray-300'}`}
                          placeholder="admin@church.com"
                        />
                        <FieldError message={formErrors.adminEmail} />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={formData.adminPassword || ''}
                          onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none ${formErrors.adminPassword ? 'border-red-400' : 'border-gray-300'}`}
                          placeholder="Min. 6 characters"
                        />
                        <FieldError message={formErrors.adminPassword} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {church?._id && <EdvBridgeSection churchId={church._id} />}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : church ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── EDV Bridge ──────────────────────────────────────────────────────────────
// Lets a Super Admin connect this church to its EDV accounting system —
// paste the API key issued by EDV's Settings > Church Bridge screen, and
// see whether recent transactions are syncing across.

interface EdvBridgeStatus {
  connected: boolean;
  syncedCount: number;
  failedCount: number;
  lastSyncedAt: string | null;
  recentFailures: Array<{
    _id: string;
    receiptNumber: string;
    transactionType: string;
    totalAmount: number;
    paymentDate: string;
    edvSyncError: string;
  }>;
}

function EdvBridgeSection({ churchId }: { churchId: string }) {
  const api = createRoleApi('super_admin');
  const [status, setStatus] = useState<EdvBridgeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/churches/${churchId}/edv-bridge`);
      setStatus(res.data.data);
    } catch (err) {
      // Non-fatal — bridge status is a nice-to-have, not blocking church edits
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [churchId]);

  const handleSaveKey = async () => {
    if (!apiKeyInput.trim()) return;
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/churches/${churchId}/edv-bridge`, { apiKey: apiKeyInput.trim() });
      setApiKeyInput('');
      setMessage('Key saved.');
      await fetchStatus();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to save key');
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect this church from EDV? New transactions will stop syncing until a key is set again.')) return;
    setSaving(true);
    try {
      await api.delete(`/churches/${churchId}/edv-bridge`);
      await fetchStatus();
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to disconnect');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-semibold text-gray-700 mb-2">EDV Bridge</h4>

      {loading ? (
        <p className="text-xs text-gray-500">Checking connection…</p>
      ) : (
        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                status?.connected ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
              }`}
            >
              {status?.connected ? 'Connected' : 'Not connected'}
            </span>
            {status?.connected && (
              <span className="text-xs text-gray-500">
                {status.syncedCount} synced
                {status.failedCount > 0 && `, ${status.failedCount} failed`}
                {status.lastSyncedAt && ` · last ${new Date(status.lastSyncedAt).toLocaleString('en-IN')}`}
              </span>
            )}
          </div>

          {!!status?.recentFailures?.length && (
            <div className="text-xs text-red-600 space-y-1">
              {status.recentFailures.slice(0, 3).map((f) => (
                <div key={f._id} className="truncate" title={f.edvSyncError}>
                  {f.receiptNumber} (₹{f.totalAmount}) — {f.edvSyncError}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              placeholder={status?.connected ? 'Paste a new key to replace it…' : 'Paste API key from EDV…'}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            />
            <button
              type="button"
              onClick={handleSaveKey}
              disabled={saving || !apiKeyInput.trim()}
              className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 disabled:opacity-50"
            >
              Save
            </button>
            {status?.connected && (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={saving}
                className="px-3 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 disabled:opacity-50"
              >
                Disconnect
              </button>
            )}
          </div>

          {message && <p className="text-xs text-gray-600">{message}</p>}
          <p className="text-xs text-gray-400">
            Get the key from EDV → Settings → Church Bridge → Connect a Church App.
          </p>
        </div>
      )}
    </div>
  );
}
