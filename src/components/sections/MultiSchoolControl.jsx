import React from 'react';
import { Building2, Network, BarChart2, ShieldCheck } from 'lucide-react';

const MultiSchoolControl = () => {
  const features = [
    { icon: <Building2 className="w-6 h-6" />, title: "Branch-wise Data Separation", desc: "Keep each school's data completely isolated while maintaining a unified global view." },
    { icon: <Network className="w-6 h-6" />, title: "Centralized Control", desc: "Push policies, holidays, and fee structures to all branches with a single click." },
    { icon: <BarChart2 className="w-6 h-6" />, title: "Performance Comparison", desc: "Compare admissions, revenue, and academic performance across your entire group." },
    { icon: <ShieldCheck className="w-6 h-6" />, title: "Scalable Architecture", desc: "Add a new branch into the system in under 10 minutes. Built to scale infinitely." }
  ];

  return (
    <section className="py-24 bg-white border-y border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          
          <div className="w-full lg:w-1/2 order-2 lg:order-1 relative">
            <div className="absolute inset-0 bg-blue-50 transform -skew-x-12 rounded-3xl -z-10"></div>
            
            {/* Visual Rep of Branches */}
            <div className="p-8 relative">
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative z-10 w-3/4 transform -rotate-3 hover:rotate-0 transition-transform">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">HQ</div>
                    <div>
                      <h4 className="font-bold text-gray-900">Trust Global Dashboard</h4>
                      <p className="text-xs text-green-600 font-medium">All Systems Operational</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full bg-gray-100 rounded"></div>
                  <div className="h-2 w-3/4 bg-gray-100 rounded"></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 absolute top-24 right-0 w-2/3 transform rotate-3 hover:rotate-0 transition-transform z-20">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">B1</div>
                    <div>
                      <h4 className="font-bold text-gray-900">North Campus</h4>
                      <p className="text-xs text-gray-500">2,450 Students</p>
                    </div>
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded mb-2"></div>
              </div>

              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 absolute -bottom-12 left-12 w-2/3 transform -rotate-2 hover:rotate-0 transition-transform z-30">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">B2</div>
                    <div>
                      <h4 className="font-bold text-gray-900">South Branch</h4>
                      <p className="text-xs text-gray-500">1,820 Students</p>
                    </div>
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded mb-2"></div>
              </div>
              
              {/* Connecting lines SVG */}
              <svg className="absolute inset-0 w-full h-full -z-5 pointer-events-none" style={{ zIndex: 5 }}>
                <path d="M 150 120 C 200 120, 250 180, 280 160" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
                <path d="M 150 140 C 150 200, 100 250, 120 280" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" className="animate-pulse" />
              </svg>
            </div>
          </div>

          <div className="w-full lg:w-1/2 order-1 lg:order-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0B1F3A] mb-6">
              Built for <span className="text-blue-600">School Groups</span>, Not Just Single Schools
            </h2>
            <p className="text-lg text-gray-600 mb-10 leading-relaxed">
              Managing a chain of schools comes with unique challenges. ScoolERP is built from the ground up to support multi-branch architecture, giving trusts unprecedented oversight.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {features.map((feat, idx) => (
                <div key={idx}>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    {feat.icon}
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">{feat.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
};

export default MultiSchoolControl;
