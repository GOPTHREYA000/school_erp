'use client'

import React, { useState, useEffect } from 'react';
import { Search, User, FileText, CreditCard, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CommandK() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isOpen) return null;

  const mockResults = [
    { id: 1, type: 'Student', title: 'Aarav Sharma (10A)', icon: <User size={18} />, link: '/admin/students/1' },
    { id: 2, type: 'Student', title: 'Aarohi Patel (9B)', icon: <User size={18} />, link: '/admin/students/2' },
    { id: 3, type: 'Invoice', title: 'INV-2024-MAIN-0125', icon: <CreditCard size={18} />, link: '/admin/fees/125' },
    { id: 4, type: 'Report', title: 'Monthly Defaulters Report', icon: <FileText size={18} />, link: '/admin/reports/defaulters' },
  ];

  const filteredResults = mockResults.filter(r => 
    r.title.toLowerCase().includes(query.toLowerCase()) || 
    r.type.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="flex items-center px-4 border-b border-gray-100">
          <Search className="text-gray-400 mr-3" size={20} />
          <input
            type="text"
            className="w-full py-4 text-lg bg-transparent border-0 focus:ring-0 outline-none placeholder-gray-400"
            placeholder="Search students, invoices, or reports..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No results found for "{query}"
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Suggestions
              </div>
              {filteredResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => {
                    setIsOpen(false);
                    // router.push(result.link);
                    console.log("Navigating to:", result.link);
                  }}
                  className="w-full flex items-center px-3 py-3 rounded-lg hover:bg-indigo-50 hover:text-indigo-700 transition-colors group text-left"
                >
                  <span className="text-gray-400 group-hover:text-indigo-500 mr-3">
                    {result.icon}
                  </span>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-indigo-700">
                      {result.title}
                    </div>
                    <div className="text-xs text-gray-500 group-hover:text-indigo-500 mt-0.5">
                      {result.type}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 px-4 py-3 text-xs text-gray-500 flex items-center justify-between border-t border-gray-100">
          <span>Search functionality powered by ScoolERP Data Graph</span>
          <span className="flex items-center space-x-1">
            <kbd className="px-2 py-1 bg-white border border-gray-200 rounded-md font-sans shadow-sm">ctrl</kbd>
            <span>+</span>
            <kbd className="px-2 py-1 bg-white border border-gray-200 rounded-md font-sans shadow-sm">k</kbd>
            <span className="ml-2">to search</span>
          </span>
        </div>
      </div>
    </div>
  );
}
