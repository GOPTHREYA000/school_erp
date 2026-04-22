'use client'

import React, { useState } from 'react';
import { Download, Filter, Columns, RefreshCw } from 'lucide-react';

export default function DynamicReportBuilder() {
  const [selectedColumns, setSelectedColumns] = useState(['adm_no', 'name', 'grade', 'status']);
  const [dataset, setDataset] = useState('students'); // 'students', 'fees', 'attendance'

  const availableColumns = {
    students: [
      { id: 'adm_no', label: 'Admission No' },
      { id: 'name', label: 'Student Name' },
      { id: 'grade', label: 'Grade / Class' },
      { id: 'status', label: 'Status' },
      { id: 'parent_phone', label: 'Guardian Phone' },
      { id: 'doa', label: 'Date of Admission' }
    ],
    fees: [
      { id: 'adm_no', label: 'Admission No' },
      { id: 'name', label: 'Student Name' },
      { id: 'invoice_no', label: 'Invoice No' },
      { id: 'amount_due', label: 'Amount Due' },
      { id: 'amount_paid', label: 'Amount Paid' },
      { id: 'balance', label: 'Balance' }
    ]
  };

  const handleColumnToggle = (id: string) => {
    setSelectedColumns(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleDatasetChange = (ds: 'students'|'fees') => {
    setDataset(ds);
    setSelectedColumns(availableColumns[ds].slice(0, 4).map(c => c.id));
  };

  // Mock data generator based on columns
  const mockData = [
    { adm_no: '2024/001', name: 'Aarav Sharma', grade: '10A', status: 'Active', parent_phone: '+91 9876543210', doa: '01-Apr-24', invoice_no: 'INV-001', amount_due: '15000', amount_paid: '15000', balance: '0' },
    { adm_no: '2024/002', name: 'Aarohi Patel', grade: '9B', status: 'Active', parent_phone: '+91 9876543211', doa: '01-Apr-24', invoice_no: 'INV-002', amount_due: '15000', amount_paid: '5000', balance: '10000' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dynamic Query Builder</h2>
          <p className="text-sm text-gray-500">Generate custom reports without requesting IT support.</p>
        </div>
        
        <div className="flex space-x-3">
          <button className="flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
             <RefreshCw size={16} className="mr-2 text-gray-500" />
             Run Query
          </button>
          <button className="flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
             <Download size={16} className="mr-2" />
             Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
             <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                 <Filter size={16} className="mr-2 text-indigo-500" />
                 Data Source
             </h3>
             <select 
                className="w-full bg-white border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={dataset}
                onChange={(e) => handleDatasetChange(e.target.value as 'students'|'fees')}
             >
                <option value="students">Student Information</option>
                <option value="fees">Fee Defaulters & Payments</option>
             </select>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
             <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                 <Columns size={16} className="mr-2 text-indigo-500" />
                 Fields
             </h3>
             <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableColumns[dataset as keyof typeof availableColumns].map(col => (
                  <label key={col.id} className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      checked={selectedColumns.includes(col.id)}
                      onChange={() => handleColumnToggle(col.id)}
                    />
                    <span className="ml-2 text-sm text-gray-700">{col.label}</span>
                  </label>
                ))}
             </div>
          </div>
        </div>

        <div className="lg:col-span-3">
           <div className="border border-gray-200 rounded-lg overflow-x-auto">
               <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {selectedColumns.map(colId => {
                         const colDef = availableColumns[dataset as keyof typeof availableColumns].find(c => c.id === colId);
                         return (
                           <th key={colId} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {colDef?.label}
                           </th>
                         );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                     {mockData.map((row, idx) => (
                       <tr key={idx} className="hover:bg-gray-50">
                          {selectedColumns.map(colId => (
                            <td key={`${idx}-${colId}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                               {row[colId as keyof typeof row]}
                            </td>
                          ))}
                       </tr>
                     ))}
                  </tbody>
               </table>
               {mockData.length === 0 && (
                 <div className="p-8 text-center text-gray-500 text-sm">
                    Select columns and run query to view data.
                 </div>
               )}
           </div>
           
           <div className="mt-4 flex justify-between items-center text-sm text-gray-500">
              <span>Showing preview of first 50 rows.</span>
              <span>Total rows matched: 420</span>
           </div>
        </div>
      </div>
    </div>
  );
}
