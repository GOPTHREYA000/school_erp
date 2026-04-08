"use client";

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { Settings, Save, Plus, Trash2, Edit2, ShieldAlert, X } from 'lucide-react';

interface GlobalSetting {
  id: string;
  key: string;
  value: string;
  description: string;
  is_public: boolean;
  updated_at: string;
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<GlobalSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [newSetting, setNewSetting] = useState<Partial<GlobalSetting>>({
    key: '', value: '', description: '', is_public: false
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('tenants/global-settings/');
      setSettings(response.data.results || response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (setting: GlobalSetting) => {
    setSaving(true);
    try {
      await api.patch(`tenants/global-settings/${setting.id}/`, {
        value: setting.value,
        description: setting.description,
        is_public: setting.is_public
      });
      setSuccess('Setting updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to apply setting');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async () => {
    if (!newSetting.key) return;
    setSaving(true);
    try {
      await api.post('tenants/global-settings/', newSetting);
      setIsAdding(false);
      setNewSetting({ key: '', value: '', description: '', is_public: false });
      fetchSettings();
      setSuccess('Added new global setting');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create setting');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this setting?')) return;
    
    try {
      await api.delete(`tenants/global-settings/${id}/`);
      setSettings(settings.filter(s => s.id !== id));
      setSuccess('Setting deleted');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Failed to delete setting');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12 text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 animate-fade-in max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 border-l-4 border-amber-500 pl-4">System Settings</h1>
          <p className="text-sm text-gray-500 mt-1 pl-5">Manage global configuration for all tenants</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-md"
        >
          {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {isAdding ? 'Cancel' : 'Add Setting'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3 border border-red-100 shadow-sm">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-3 border border-green-100 shadow-sm animate-fade-in">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="font-medium">{success}</p>
        </div>
      )}

      {isAdding && (
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-gray-100 transition-all">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"><Settings className="w-5 h-5" /> New Variable</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
              <input
                type="text"
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 font-mono text-sm uppercase placeholder-gray-400"
                placeholder="e.g. MAINTENANCE_MODE"
                value={newSetting.key}
                onChange={(e) => setNewSetting({ ...newSetting, key: e.target.value.toUpperCase() })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
              <input
                type="text"
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 placeholder-gray-400"
                placeholder="Value..."
                value={newSetting.value}
                onChange={(e) => setNewSetting({ ...newSetting, value: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input
                type="text"
                className="w-full rounded-xl border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                value={newSetting.description}
                onChange={(e) => setNewSetting({ ...newSetting, description: e.target.value })}
              />
            </div>
            <div className="md:col-span-2 flex items-center gap-3">
              <input
                type="checkbox"
                id="is_public"
                className="rounded text-amber-600 focus:ring-amber-500 h-4 w-4"
                checked={newSetting.is_public}
                onChange={(e) => setNewSetting({ ...newSetting, is_public: e.target.checked })}
              />
              <label htmlFor="is_public" className="text-sm text-gray-700 font-medium">
                Make public (frontend can access without auth)
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleCreate}
              disabled={saving || !newSetting.key}
              className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium disabled:opacity-50 transition-colors shadow-md shadow-amber-500/20"
            >
              <Save className="w-4 h-4" /> Save Setting
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Configuration Key</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Visibility</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {settings.map((setting) => (
                <tr key={setting.id} className="hover:bg-amber-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-mono text-sm font-semibold text-gray-900 bg-gray-100/50 inline-flex px-2 py-1 rounded">
                      {setting.key}
                    </div>
                    <div className="text-xs text-gray-500 w-64 truncate mt-1" title={setting.description}>
                      {setting.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="text"
                      className="w-full min-w-[200px] border-transparent focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10 rounded-lg text-sm bg-transparent group-hover:bg-white transition-colors"
                      value={setting.value}
                      onChange={(e) => setSettings(settings.map(s => s.id === setting.id ? { ...s, value: e.target.value } : s))}
                      onBlur={() => handleSave(setting)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      setting.is_public ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {setting.is_public ? 'Public' : 'Protected'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(setting.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                      title="Delete Setting"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {settings.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    <Settings className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm">No global settings defined yet.</p>
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
