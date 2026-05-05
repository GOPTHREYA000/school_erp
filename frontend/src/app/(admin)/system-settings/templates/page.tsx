"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Settings, Badge, Paintbrush, ExternalLink, Code } from 'lucide-react';
import api from '@/lib/axios';
import TemplateEditorModal, { DocumentTemplate } from '@/components/system-settings/TemplateEditorModal';

export default function DocumentTemplatesPage() {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);

  const normalizeTemplatesResponse = (payload: unknown): DocumentTemplate[] => {
    if (Array.isArray(payload)) return payload as DocumentTemplate[];
    if (payload && typeof payload === 'object') {
      const maybeArrayKeys = ['results', 'data', 'items', 'templates'] as const;
      for (const key of maybeArrayKeys) {
        const value = (payload as Record<string, unknown>)[key];
        if (Array.isArray(value)) return value as DocumentTemplate[];
      }
    }
    return [];
  };

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('templates/');
      setTemplates(normalizeTemplatesResponse(data));
    } catch (e) {
      console.error('Failed to fetch templates', e);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleEdit = (tmpl: DocumentTemplate) => {
    setSelectedTemplate(tmpl);
    setIsModalOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const renderBadge = (tmpl: DocumentTemplate) => {
    if (tmpl.is_default) {
      return <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold border border-green-200">Default Active</span>
    }
    return <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full font-semibold">Standby</span>
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
            <Paintbrush className="w-8 h-8 mr-3 text-blue-600" />
            Document Templates
          </h1>
          <p className="text-gray-500 mt-2 max-w-2xl">
            Each organisation can customise PDFs: ID cards, fee receipts, hall tickets, and report cards. Use Standard Configuration for quick styling, or Raw HTML (Django templates) for full control over layout and branding.
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center shadow-lg shadow-blue-200 transition-all transform hover:scale-105"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Template
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length === 0 ? (
            <div className="col-span-full bg-white p-12 rounded-2xl border border-gray-200 shadow-sm text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900">No Templates Found</h3>
              <p className="text-gray-500 mt-2">Get started by creating your first ID Card or Fee Receipt template.</p>
              <button onClick={handleCreateNew} className="mt-6 text-blue-600 font-medium hover:underline">
                Create one now →
              </button>
            </div>
          ) : (
            templates.map((tmpl) => (
              <div key={tmpl.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-shadow group overflow-hidden">
                <div className={`p-1 h-3 w-full ${tmpl.type === 'ID_CARD' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                        {tmpl.type.replace('_', ' ')}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900">{tmpl.name}</h3>
                    </div>
                    {renderBadge(tmpl)}
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-3 flex items-center mt-4">
                    {tmpl.mode === 'CONFIG' ? (
                      <Settings className="w-4 h-4 mr-2 text-gray-500" />
                    ) : (
                      <Code className="w-4 h-4 mr-2 text-gray-500" />
                    )}
                    <span className="text-sm font-medium text-gray-600">
                      {tmpl.mode === 'CONFIG' ? 'Standard Config' : 'Raw HTML Engine'}
                    </span>
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Updated {new Date(tmpl.updated_at || '').toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleEdit(tmpl)}
                      className="text-blue-600 font-semibold text-sm hover:text-blue-800 transition-colors flex items-center"
                    >
                      Edit Template
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <TemplateEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={fetchTemplates}
        template={selectedTemplate}
      />
    </div>
  );
}
