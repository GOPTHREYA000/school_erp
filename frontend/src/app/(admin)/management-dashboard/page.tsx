import React from 'react';
import { Building, TrendingUp, Users, AlertCircle } from 'lucide-react';

export default function ManagementDashboard() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
       <div>
         <h1 className="text-2xl font-bold text-gray-900">Trustee & Management View</h1>
         <p className="text-gray-500">Cross-branch organizational health and financial tracking.</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
             <Building className="mr-2 h-5 w-5 text-indigo-500" />
             Total Branches
           </div>
           <div className="text-3xl font-bold text-gray-900">4</div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
             <Users className="mr-2 h-5 w-5 text-indigo-500" />
             Total Students
           </div>
           <div className="text-3xl font-bold text-gray-900">4,250</div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
           <div className="flex items-center text-sm font-medium text-gray-500 mb-4">
             <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
             Revenue (YTD)
           </div>
           <div className="text-3xl font-bold text-gray-900">₹4.2 Cr</div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm bg-red-50">
           <div className="flex items-center text-sm font-medium text-red-600 mb-4">
             <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
             Fee Deficits
           </div>
           <div className="text-3xl font-bold text-red-700">₹85.5 L</div>
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
             <h3 className="text-lg font-bold text-gray-900 mb-4">Branch Performance (Revenue vs Target)</h3>
             <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 border border-dashed border-gray-200">
                [ Revenue Chart Widget Placeholder ]
             </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
             <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
               <h3 className="text-lg font-bold text-gray-900">Branch Deficit Breakdown</h3>
             </div>
             <table className="min-w-full text-left text-sm">
               <thead>
                 <tr className="text-gray-500 border-b border-gray-200">
                   <th className="font-medium p-4 uppercase tracking-wider text-xs">Branch Name</th>
                   <th className="font-medium p-4 uppercase tracking-wider text-xs text-right">Outstanding</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 <tr className="hover:bg-gray-50">
                   <td className="p-4 font-medium text-gray-900">Main Campus (Uppal)</td>
                   <td className="p-4 text-right text-red-600 font-medium">₹45.2 L</td>
                 </tr>
                 <tr className="hover:bg-gray-50">
                   <td className="p-4 font-medium text-gray-900">City Branch</td>
                   <td className="p-4 text-right text-red-600 font-medium">₹22.0 L</td>
                 </tr>
                 <tr className="hover:bg-gray-50">
                   <td className="p-4 font-medium text-gray-900">North Branch</td>
                   <td className="p-4 text-right text-red-600 font-medium">₹12.1 L</td>
                 </tr>
                 <tr className="hover:bg-gray-50">
                   <td className="p-4 font-medium text-gray-900">East Branch</td>
                   <td className="p-4 text-right text-red-600 font-medium">₹6.2 L</td>
                 </tr>
               </tbody>
             </table>
          </div>
       </div>
    </div>
  );
}
