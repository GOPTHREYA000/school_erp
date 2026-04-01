import React from 'react';
import { Layers, Rocket, Sparkles } from 'lucide-react';

const DevelopmentApproach = () => {
  const phases = [
    {
      phase: "Phase 1",
      icon: <Layers className="w-6 h-6" />,
      title: "Core Foundation",
      items: ["Student Information System", "Fee Management", "Admin Dashboard Setup", "Data Migration"],
      color: "blue"
    },
    {
      phase: "Phase 2",
      icon: <Rocket className="w-6 h-6" />,
      title: "Academics & Expansion",
      items: ["Parent & Teacher Apps", "Examination Module", "Transport Tracking", "Payroll Setup"],
      color: "purple"
    },
    {
      phase: "Phase 3",
      icon: <Sparkles className="w-6 h-6" />,
      title: "Intelligence",
      items: ["AI Analytics Engine", "Automated Workflows", "Custom Integrations", "Advanced Reporting"],
      color: "cyan"
    }
  ];

  return (
    <section className="py-24 bg-[#F5F7FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1F3A] mb-6">
            A Smooth Transition <span className="text-blue-600">Without the Chaos</span>
          </h2>
          <p className="text-lg text-gray-600">
            We don't just hand you software. Our implementation experts guide your institution through a structured rollout process.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line (desktop only) */}
          <div className="hidden md:block absolute top-[88px] left-0 w-full h-1 bg-gradient-to-r from-blue-200 via-blue-400 to-cyan-400 z-0"></div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
            {phases.map((item, idx) => (
              <div key={idx} className="relative flex flex-col items-center">
                
                {/* Connector dot */}
                <div className="hidden md:flex absolute top-[-6px] left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-4 border-blue-500 z-20"></div>

                <div className={`w-16 h-16 rounded-2xl bg-white shadow-xl flex items-center justify-center mb-6 text-${item.color}-600 border border-gray-100 z-10`}>
                  {item.icon}
                </div>
                
                <div className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-${item.color}-700 bg-${item.color}-50 mb-4`}>
                  {item.phase}
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">{item.title}</h3>
                
                <div className="w-full bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                  <ul className="space-y-4">
                    {item.items.map((listItem, lidx) => (
                      <li key={lidx} className="flex flex-col text-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <span className="font-medium text-gray-700">{listItem}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>
            ))}
          </div>
        </div>
        
      </div>
    </section>
  );
};

export default DevelopmentApproach;
