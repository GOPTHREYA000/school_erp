"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { UserCircle, KeyRound, CheckCircle2, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [passData, setPassData] = useState({ old_password: '', new_password: '', confirm: '' });
  const [passStatus, setPassStatus] = useState({ loading: false, error: '', success: false });

  const [mfaSetup, setMfaSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [mfaConfirmCode, setMfaConfirmCode] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaDisable, setMfaDisable] = useState({ password: '', code: '' });

  useEffect(() => {
    api.get('auth/me/')
      .then(res => setUser(res.data.data))
      .catch(() => toast.error('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, []);

  const loadProfile = () => {
    api.get('auth/me/')
      .then(res => setUser(res.data.data))
      .catch(() => toast.error('Failed to load profile.'));
  };

  const startMfaSetup = async () => {
    setMfaBusy(true);
    try {
      const res = await api.get('auth/mfa/setup/');
      const d = res.data;
      if (d.mfa_enabled) {
        toast.success('Two-factor authentication is already on.');
        setMfaSetup(null);
        loadProfile();
        return;
      }
      setMfaSetup({ secret: d.secret, uri: d.provisioning_uri });
      setMfaConfirmCode('');
    } catch {
      toast.error('Could not start MFA setup.');
    } finally {
      setMfaBusy(false);
    }
  };

  const confirmMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaConfirmCode.trim()) return;
    setMfaBusy(true);
    try {
      await api.post('auth/mfa/confirm/', { code: mfaConfirmCode.replace(/\s/g, '') });
      toast.success('Two-factor authentication is enabled.');
      setMfaSetup(null);
      setMfaConfirmCode('');
      loadProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Invalid code.');
    } finally {
      setMfaBusy(false);
    }
  };

  const disableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaBusy(true);
    try {
      await api.post('auth/mfa/disable/', {
        password: mfaDisable.password,
        code: mfaDisable.code.replace(/\s/g, ''),
      });
      toast.success('Two-factor authentication is off.');
      setMfaDisable({ password: '', code: '' });
      loadProfile();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Could not disable MFA.');
    } finally {
      setMfaBusy(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassStatus({ loading: false, error: '', success: false });
    
    if (passData.new_password !== passData.confirm) {
      return setPassStatus(p => ({ ...p, error: "New passwords do not match." }));
    }

    setPassStatus(p => ({ ...p, loading: true }));
    try {
      await api.put('auth/password/change/', {
        old_password: passData.old_password,
        new_password: passData.new_password
      });
      setPassStatus({ loading: false, error: '', success: true });
      setPassData({ old_password: '', new_password: '', confirm: '' });
    } catch (err: any) {
      setPassStatus({ 
        loading: false, 
        error: err.response?.data?.error || 'Failed to change password.', 
        success: false 
      });
    }
  };

  if (loading) return <div className="animate-pulse bg-gray-200 h-96 rounded-2xl w-full" />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-4xl font-bold">
            {user?.first_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user?.first_name} {user?.last_name}</h1>
            <p className="text-gray-500 mt-1">{user?.email}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-900 text-white">
              <UserCircle size={16} />
              {user?.role?.replace('_', ' ') || 'Unknown Role'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <Shield className="text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">Two-factor authentication</h2>
        </div>
        <div className="p-6 space-y-4 max-w-lg">
          <p className="text-sm text-gray-500">
            Add a second step at sign-in with an authenticator app (TOTP). Recommended for admins and accountants.
          </p>
          {user?.mfa_enabled ? (
            <form onSubmit={disableMfa} className="space-y-3 border border-gray-100 rounded-xl p-4 bg-slate-50/50">
              <p className="text-sm font-medium text-emerald-700">Two-factor authentication is on.</p>
              <input
                type="password"
                required
                placeholder="Current password"
                value={mfaDisable.password}
                onChange={(e) => setMfaDisable({ ...mfaDisable, password: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
              />
              <input
                type="text"
                required
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Authenticator code"
                value={mfaDisable.code}
                onChange={(e) => setMfaDisable({ ...mfaDisable, code: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
              />
              <button
                type="submit"
                disabled={mfaBusy}
                className="text-sm font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50"
              >
                Turn off two-factor authentication
              </button>
            </form>
          ) : (
            <>
              {!mfaSetup ? (
                <button
                  type="button"
                  onClick={startMfaSetup}
                  disabled={mfaBusy}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-black disabled:opacity-50"
                >
                  Set up authenticator app
                </button>
              ) : (
                <form onSubmit={confirmMfa} className="space-y-3 border border-gray-100 rounded-xl p-4">
                  <p className="text-xs text-gray-500">
                    Scan the QR code in your app (or enter the secret manually), then enter a 6-digit code to confirm.
                  </p>
                  <a
                    href={mfaSetup.uri}
                    className="text-sm text-blue-600 font-medium hover:underline"
                  >
                    Open in authenticator app
                  </a>
                  <p className="text-xs font-mono break-all bg-slate-100 p-2 rounded-lg">{mfaSetup.secret}</p>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    value={mfaConfirmCode}
                    onChange={(e) => setMfaConfirmCode(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={mfaBusy}
                      className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium disabled:opacity-50"
                    >
                      Confirm and enable
                    </button>
                    <button
                      type="button"
                      onClick={() => setMfaSetup(null)}
                      className="px-4 py-2 text-sm text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex items-center gap-3">
          <KeyRound className="text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
        </div>
        
        <form onSubmit={handleChangePassword} className="p-6 space-y-5 max-w-md">
          {passStatus.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {passStatus.error}
            </div>
          )}
          {passStatus.success && (
            <div className="p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-100 flex items-center gap-2">
              <CheckCircle2 size={16} /> Password updated successfully.
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Current Password</label>
            <input 
              type="password" required 
              value={passData.old_password} onChange={e => setPassData({...passData, old_password: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-shadow" 
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">New Password</label>
            <input 
              type="password" required minLength={8}
              value={passData.new_password} onChange={e => setPassData({...passData, new_password: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-shadow" 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
            <input 
              type="password" required minLength={8}
              value={passData.confirm} onChange={e => setPassData({...passData, confirm: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 transition-shadow" 
            />
          </div>

          <button 
            type="submit" 
            disabled={passStatus.loading}
            className="w-full bg-blue-600 text-white font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {passStatus.loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
