'use client'

import React, { useState } from 'react';
import { User, Users, FileText, CreditCard } from 'lucide-react';

export default function StudentProfileTabs() {
  const [activeTab, setActiveTab] = useState('personal');

  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: <User size={18} /> },
    { id: 'parents', label: 'Parents / Guardian', icon: <Users size={18} /> },
    { id: 'fees', label: 'Fee Accounting', icon: <CreditCard size={18} /> },
    { id: 'documents', label: 'Documents', icon: <FileText size={18} /> },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="border-b border-gray-200 hide-scrollbar overflow-x-auto">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors
                ${activeTab === tab.id 
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'personal' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Personal Details</h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">First name</label>
                <div className="mt-2">
                  <input type="text" name="first-name" id="first-name" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md" defaultValue="Aarav" />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">Last name</label>
                <div className="mt-2">
                  <input type="text" name="last-name" id="last-name" className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full px-3 py-2 sm:text-sm border border-gray-300 rounded-md" defaultValue="Sharma" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'parents' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Primary Guardian</h3>
             <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 flex items-center justify-between">
                <div>
                   <p className="font-medium text-gray-900">Rajesh Sharma</p>
                   <p className="text-sm text-gray-500">Father • +91 98765 43210</p>
                </div>
                <button className="text-sm text-indigo-600 font-medium hover:text-indigo-800">Edit</button>
             </div>
          </div>
        )}

        {activeTab === 'fees' && (
           <div className="space-y-6">
             <div className="flex justify-between items-center">
                 <h3 className="text-lg font-medium text-gray-900">Fee Ledger</h3>
                 <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Wallet: ₹1,200 (CR)
                 </span>
             </div>
             
             <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">21 Apr 2026</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Term 1 Fee Payment</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 text-right">+₹15,000</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">01 Apr 2026</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Term 1 Invoice Generated</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-right">-₹15,000</td>
                    </tr>
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Verified Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <FileText className="text-gray-400" size={20} />
                        <div>
                            <p className="font-medium text-gray-900 text-sm">Birth Certificate</p>
                            <p className="text-xs text-green-600 font-medium">Verified by Admin</p>
                        </div>
                    </div>
                    <button className="text-indigo-600 text-sm font-medium hover:underline">View</button>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
