import React from 'react';
import { Lock, Database, Key, CheckCircle, Server } from 'lucide-react';

const Security = () => {
  const points = [
    { icon: <Key />, title: "Role-Based Access", desc: "Granular permissions ensure staff only see what they need to." },
    { icon: <Lock />, title: "Bank-Grade Encryption", desc: "256-bit SSL encryption protects sensitive student and financial data." },
    { icon: <CheckCircle />, title: "Secure Payments", desc: "PCI-DSS compliant payment gateway integrations." },
    { icon: <Database />, title: "Automated Backups", desc: "Geo-redundant daily backups prevent any catastrophic data loss." },
    { icon: <Server />, title: "Detailed Audit Logs", desc: "Track every action, login, and modification for complete compliance." }
  ];

  return (
    <section className="py-24 bg-white" id="security">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#0B1F3A] rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
          {/* Abstract Security Shield bg */}
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 opacity-5 pointer-events-none">
            <Lock className="w-[500px] h-[500px] text-white" />
          </div>

          <div className="flex flex-col lg:flex-row gap-12 relative z-10">
            <div className="w-full lg:w-5/12">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
                Enterprise-Grade <span className="text-blue-400">Security</span> for Your Institution
              </h2>
              <p className="text-blue-100/80 text-lg mb-8 leading-relaxed">
                We take your data seriously. Our infrastructure is built to exceed industry standards, ensuring your school's data remains private, secure, and always accessible.
              </p>
              <div className="inline-flex items-center gap-3 bg-white/10 px-6 py-4 rounded-xl border border-white/20">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">99.99% Uptime SLA Guarantee</span>
              </div>
            </div>

            <div className="w-full lg:w-7/12 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {points.map((pt, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    {React.cloneElement(pt.icon, { className: "w-6 h-6" })}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">{pt.title}</h4>
                    <p className="text-blue-200/70 text-sm leading-relaxed">{pt.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;
